const XLSX = require('xlsx');

// Test Excel dosyası oluştur
const testData = [
  ['Adet', 'Parça Adı', 'Malzeme Kesiti', 'Uzunluk', 'Malzeme Cinsi', 'Firma A', 'Firma B'],
  [10, 'PRC001', '40x40', 1000, 'Çelik', 150, 160],
  [5, 'PRC002', '30x30', 500, 'Alüminyum', 75, 80],
  [20, 'PRC003', '50x50', 2000, 'Paslanmaz', 250, 275]
];

const ws = XLSX.utils.aoa_to_sheet(testData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Teklifler');

// Excel dosyasını kaydet
XLSX.writeFile(wb, 'test-teklif-import.xlsx');
console.log('Test Excel dosyası oluşturuldu: test-teklif-import.xlsx');
