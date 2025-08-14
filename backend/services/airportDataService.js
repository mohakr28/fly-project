// backend/services/airportDataService.js
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const tzLookup = require('tz-lookup');
const { getCountryNameByCode } = require('./countryDataService'); // استيراد دالة ترجمة الدول

let airportDetailsMap = null;
let availableAirportsList = [];

const loadAirportData = () => {
  return new Promise((resolve, reject) => {
    console.log('LOG: [AirportDataService] Starting to load airport data from CSV...');
    const csvFilePath = path.join(__dirname, '../data/airport-codes.csv');

    if (!fs.existsSync(csvFilePath)) {
      console.error("FATAL: airport-codes.csv not found in backend/data folder.");
      return reject(new Error("airport-codes.csv not found."));
    }
    
    const tempMap = {};
    const tempList = [];

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => {
        if (
          ['large_airport', 'medium_airport'].includes(data.type) &&
          data.iata_code &&
          data.iso_country &&
          data.latitude_deg && 
          data.longitude_deg
        ) {
          const lat = parseFloat(data.latitude_deg);
          const lon = parseFloat(data.longitude_deg);
          
          let timezone = 'Etc/UTC';
          try {
            if (!isNaN(lat) && !isNaN(lon)) {
              timezone = tzLookup(lat, lon);
            }
          } catch (e) { /* ignore */ }
          
          tempMap[data.iata_code] = {
            name: data.name,
            timezone: timezone
          };

          tempList.push({
            icao: data.ident,
            iata: data.iata_code,
            name: data.name,
            // ترجمة رمز الدولة إلى اسم كامل هنا
            country: getCountryNameByCode(data.iso_country),
          });
        }
      })
      .on('end', () => {
        airportDetailsMap = tempMap;
        availableAirportsList = tempList.sort((a, b) => a.name.localeCompare(b.name));
        
        console.log(`✅ LOG: [AirportDataService] Successfully loaded. Airport map created with ${Object.keys(airportDetailsMap).length} entries. Available list has ${availableAirportsList.length} airports.`);
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

const getAvailableAirportsList = () => {
  return availableAirportsList;
};

module.exports = {
  loadAirportData,
  getAirportDetailsMap,
  getAvailableAirportsList,
};