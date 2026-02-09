// Dosya adını parça kodu ve tarih-saat ile oluşturur
export function generateImageFileName(parcaKodu, originalName) {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const ext = originalName.split('.').pop();
  return `${parcaKodu}_${dateStr}.${ext}`;
}
