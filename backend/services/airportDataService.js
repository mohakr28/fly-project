// backend/services/airportDataService.js
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const tzLookup = require('tz-lookup');

let airportDetailsMap = null; // سيتم تخزين الخريطة هنا



const loadAirportData = () => {
  return new Promise((resolve, reject) => {
    console.log('LOG: [AirportDataService] Starting to load airport data from CSV...');
    const results = [];
    const csvFilePath = path.join(__dirname, '../data/airport-codes.csv');

    if (!fs.existsSync(csvFilePath)) {
      console.error("FATAL: airport-codes.csv not found in backend/data folder.");
      return reject(new Error("airport-codes.csv not found."));
    }

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => {
        // ✅ --- التعديل هنا ---
        // 1. التحقق من الأعمدة الصحيحة: latitude_deg و longitude_deg
        if (
          ['large_airport', 'medium_airport'].includes(data.type) &&
          data.iata_code &&
          data.iso_country &&
          data.latitude_deg && 
          data.longitude_deg
        ) {
          // 2. قراءة خطوط الطول والعرض من الأعمدة الصحيحة
          const lat = parseFloat(data.latitude_deg);
          const lon = parseFloat(data.longitude_deg);
          
          let timezone = 'Etc/UTC'; // Default timezone
          try {
            if (!isNaN(lat) && !isNaN(lon)) {
              timezone = tzLookup(lat, lon);
            }
          } catch (e) {
            // tz-lookup may fail for some coordinates, the default will be used.
          }
          
          results.push({
            iata: data.iata_code,
            name: data.name,
            timezone: timezone,
          });
        }
        // --- نهاية التعديل ---
      })
      .on('end', () => {
        airportDetailsMap = results.reduce((acc, airport) => {
          acc[airport.iata] = {
            name: airport.name,
            timezone: airport.timezone
          };
          return acc;
        }, {});
        
        console.log(`✅ LOG: [AirportDataService] Successfully loaded. Airport map created with ${Object.keys(airportDetailsMap).length} entries.`);
        resolve();
      })
      .on('error', (error) => {
        console.error('ERROR: [AirportDataService] Failed to process CSV file.', error);
        reject(error);
      });
  });
};
const getAirportDetailsMap = () => {
  if (!airportDetailsMap) {
    console.warn("WARN: [AirportDataService] Airport details map is not loaded yet!");
    return {};
  }
  return airportDetailsMap;
};

module.exports = {
  loadAirportData,
  getAirportDetailsMap,
};