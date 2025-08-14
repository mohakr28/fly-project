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
      // ✅ ==== التعديل الرئيسي هنا ====
      .pipe(csv({ 
          separator: '^', // 1. تحديد الفاصل الجديد
          mapHeaders: ({ header }) => header.trim() // 2. تنظيف أسماء الأعمدة كإجراء احترازي
      }))
      .on('data', (data) => {
        // ✅ 3. استخدام أسماء الأعمدة الجديدة (iata_code و name)
        if (data.iata_code && data.name && data.iata_code.trim() !== "" && data.name.trim() !== "") {
            tempList.push({
                code: data.iata_code.trim(), // استخدام iata_code
                name: data.name.trim()       // استخدام name
            });
        }
      })
      // =============================
      .on('end', () => {
        // فلترة وإزالة أي إدخالات مكررة بناءً على الرمز
        const uniqueAirlines = Array.from(new Map(tempList.map(item => [item.code, item])).values());
        
        // ترتيب شركات الطيران أبجدياً حسب الاسم
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

const getAvailableAirlines = () => {
  return availableAirlines;
};

module.exports = {
  loadAirlineData,
  getAvailableAirlines,
};