// backend/services/countryDataService.js
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

let countryCodeMap = null;

const loadCountryData = () => {
  return new Promise((resolve, reject) => {
    if (countryCodeMap) {
        console.log("LOG: [CountryDataService] Country data already loaded.");
        return resolve();
    }
    
    console.log('LOG: [CountryDataService] Starting to load country data from CSV...');
    const csvFilePath = path.join(__dirname, '../data/countries.csv');

    if (!fs.existsSync(csvFilePath)) {
      console.error("FATAL: countries.csv not found in backend/data folder.");
      return reject(new Error("countries.csv not found."));
    }

    const tempMap = {};

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => {
        // The headers are 'Name' and 'Code'
        if (data.Code && data.Name) {
            tempMap[data.Code.trim()] = data.Name.trim();
        }
      })
      .on('end', () => {
        countryCodeMap = tempMap;
        console.log(`✅ LOG: [CountryDataService] Successfully loaded. Country map created with ${Object.keys(countryCodeMap).length} entries.`);
        resolve();
      })
      .on('error', (error) => {
        console.error('ERROR: [CountryDataService] Failed to process CSV file.', error);
        reject(error);
      });
  });
};

const getCountryNameByCode = (code) => {
    if (!countryCodeMap || !code) return code; // Return the code itself if map is not ready or code is null
    return countryCodeMap[code] || code; // Return the code if not found in the map
};

module.exports = {
  loadCountryData,
  getCountryNameByCode,
};