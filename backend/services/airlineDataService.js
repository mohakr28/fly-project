// backend/services/airlineDataService.js

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

let availableAirlines = [];

const loadAirlineData = () => {
  return new Promise((resolve, reject) => {
    console.log('LOG: [AirlineDataService] Starting to load airline data from CSV...');
    const csvFilePath = path.join(__dirname, '../data/airlines.csv');

    if (!fs.existsSync(csvFilePath)) {
      const errorMsg = "WARN: airlines.csv not found in backend/data folder. The airline filter will be empty.";
      console.warn(errorMsg);
      return resolve(); 
    }

    const tempList = [];

    fs.createReadStream(csvFilePath)
      .pipe(csv({ 
          separator: '^', 
          mapHeaders: ({ header }) => header.trim()
      }))
      .on('data', (data) => {
        if (data.iata_code && data.name && data.iata_code.trim() !== "" && data.name.trim() !== "") {
            tempList.push({
                code: data.iata_code.trim(),
                name: data.name.trim()
            });
        }
      })
      .on('end', () => {
        const uniqueAirlines = Array.from(new Map(tempList.map(item => [item.code, item])).values());
        availableAirlines = uniqueAirlines.sort((a, b) => a.name.localeCompare(b.name));
        console.log(`✅ LOG: [AirlineDataService] Successfully loaded. Found ${availableAirlines.length} unique airlines.`);
        resolve();
      })
      .on('error', (error) => {
        console.error('ERROR: [AirlineDataService] Failed to process airlines.csv file.', error);
        reject(error);
      });
  });
};

const getAvailableAirlines = (query = '') => {
  if (!query) {
    // إذا لم يكن هناك بحث، أرجع أول 50 نتيجة كعينة أولية
    return availableAirlines.slice(0, 50);
  }

  const lowercasedQuery = query.toLowerCase();
  
  // قم بالفلترة بناءً على الاسم أو الرمز
  const filtered = availableAirlines.filter(airline => 
    airline.name.toLowerCase().includes(lowercasedQuery) || 
    airline.code.toLowerCase().includes(lowercasedQuery)
  );
  
  // أرجع أول 50 نتيجة مطابقة
  return filtered.slice(0, 50);
};

module.exports = {
  loadAirlineData,
  getAvailableAirlines,
};