const fs = require('fs');
const path = require('path');

console.log('Debug: Script başlatılıyor...');
console.log('Debug: Mevcut dizin:', __dirname);

const excelFilePath = path.join(__dirname, '../docs/parcalar.xlsx');
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('Debug: Excel dosyası yolu:', excelFilePath);
console.log('Debug: Veritabanı yolu:', dbPath);

console.log('Debug: Excel dosyası var mı?', fs.existsSync(excelFilePath));
console.log('Debug: Veritabanı dosyası var mı?', fs.existsSync(dbPath));

if (fs.existsSync(excelFilePath)) {
    console.log('Debug: Excel dosyası bulundu, XLSX yükleniyor...');
    try {
        const XLSX = require('xlsx');
        console.log('Debug: XLSX yüklendi, dosya okunuyor...');
        const workbook = XLSX.readFile(excelFilePath);
        console.log('Debug: Sayfa isimleri:', workbook.SheetNames);
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        console.log('Debug: Excel verileri okundu:', data.length, 'kayıt');
        console.log('Debug: İlk kayıt anahtarları:', Object.keys(data[0] || {}));
        
    } catch (error) {
        console.error('Debug: Excel okuma hatası:', error.message);
    }
} else {
    console.error('Debug: Excel dosyası bulunamadı!');
}

console.log('Debug: Script tamamlandı.');
