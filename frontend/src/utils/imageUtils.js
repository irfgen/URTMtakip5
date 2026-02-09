/**
 * Utility functions for handling image paths and file types
 */

/**
 * Get the proper path for images or technical drawings
 * Handles various path formats and ensures the correct prefix
 * 
 * @param {string} path - The original path from the database
 * @param {string} type - Type of resource: 'photo' or 'technical'
 * @returns {string} - The corrected path to the file
 */
export const getImagePath = (path, type) => {
  if (!path) return '';
  
  // Eğer zaten tam bir URL ise, direkt döndür
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads/')) return path;
  
  // Klasör adını belirle
  const folder = type === 'photo' ? 'fotograflar' : 'teknik_resimler';
  
  // Gereksiz öndeki slash'ları temizle
  let cleanPath = path;
  while (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.substring(1);
  }
  
  // Önce kesin olarak bildiğimiz durumları kontrol edelim
  // fotograflar/ veya teknik_resimler/ ile başlayan dosyalar
  if (cleanPath.startsWith('fotograflar/') || cleanPath.startsWith('teknik_resimler/')) {
    return `/uploads/${cleanPath}`;
  }
  
  // İlgili klasörle başlıyorsa ancak önünde uploads/ prefix'i yoksa ekleyelim
  if (cleanPath.startsWith(`${folder}/`)) {
    return `/uploads/${cleanPath}`;
  }
  
  // Diğer klasörle başlıyorsa da resim olarak kullanılabilir (çapraz kullanım için)
  const otherFolder = type === 'photo' ? 'teknik_resimler' : 'fotograflar';
  if (cleanPath.startsWith(`${otherFolder}/`)) {
    return `/uploads/${cleanPath}`;
  }
  
  // Yol oluştururken dosya uzantısı kontrolü yaparak ek güvenlik ekleyelim
  const fileExtensions = {
    photo: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    technical: ['.pdf', '.dwg', '.dxf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  };
  
  // Sadece dosya adı verilmişse (path içinde slash yoksa)
  if (!cleanPath.includes('/')) {
    // Uzantısı kontrol et, geçerliyse klasör ekleyerek döndür
    const hasValidExtension = fileExtensions[type].some(ext => 
      cleanPath.toLowerCase().endsWith(ext)
    );
    
    if (hasValidExtension) {
      return `/uploads/${folder}/${cleanPath}`;
    }
  }
  
  // Son çare olarak, dosya uzantısını kontrol et ve uygun klasöre yerleştir
  const hasValidExtension = fileExtensions[type].some(ext => 
    cleanPath.toLowerCase().endsWith(ext)
  );
  
  // Geçerli uzantısı varsa ve klasör belirtilmemişse
  if (hasValidExtension) {
    return `/uploads/${folder}/${cleanPath}`;
  }
  
  // Son çare olarak, varsayılan yolu döndür
  console.log(`Uyarı: Dosya yolu düzgün biçimlendirilemedi: ${path}`);
  return `/uploads/${folder}/${cleanPath}`;
};

/**
 * Get the proper path for photos
 * 
 * @param {string} foto_path - The original photo path from the database
 * @returns {string} - The corrected path to the photo
 */
export const getFotoPath = (foto_path) => {
  return getImagePath(foto_path, 'photo');
};

/**
 * Get the proper path for technical drawings
 * 
 * @param {string} teknik_resim_path - The original technical drawing path from the database
 * @returns {string} - The corrected path to the technical drawing
 */
export const getTeknikResimPath = (teknik_resim_path) => {
  return getImagePath(teknik_resim_path, 'technical');
};

/**
 * Detect the type of file based on its path
 * 
 * @param {string} path - The file path to check
 * @returns {'pdf'|'image'|'cad'|'unknown'} - The detected file type
 */
export const getFileType = (path) => {
  if (!path) return 'unknown';
  
  const lowercasePath = path.toLowerCase();
  if (lowercasePath.endsWith('.pdf')) {
    return 'pdf';
  } else if (lowercasePath.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) {
    return 'image';
  } else if (lowercasePath.match(/\.(dwg|dxf)$/i)) {
    return 'cad';
  } else {
    return 'unknown';
  }
};

/**
 * Check if a file is an image based on its extension
 * 
 * @param {string} path - The file path to check
 * @returns {boolean} - Whether the file is an image
 */
export const isImageFile = (path) => {
  return getFileType(path) === 'image';
};

/**
 * Check if a file is a PDF based on its extension
 * 
 * @param {string} path - The file path to check
 * @returns {boolean} - Whether the file is a PDF
 */
export const isPdfFile = (path) => {
  return getFileType(path) === 'pdf';
};
