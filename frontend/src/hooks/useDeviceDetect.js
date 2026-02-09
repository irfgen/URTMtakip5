// filepath: /home/irfan/Documents/PROJELER/URTMtakip/frontend/src/hooks/useDeviceDetect.js
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useDeviceOverride from './useDeviceOverride';

export default function useDeviceDetect() {
  const [detectedMobile, setDetectedMobile] = useState(false);
  const { forcedDevice } = useDeviceOverride();
  const location = useLocation();
  const currentPath = location.pathname;
  const isOnMobilePath = currentPath.startsWith('/mobile');
  
  useEffect(() => {
    // Mobil cihazı algılama fonksiyonu
    const handleResize = () => {
      setDetectedMobile(window.innerWidth < 768); // 768px mobil ve tablet ayrımı için genelde kullanılan değerdir
    };
    
    // İlk yüklemede algılama
    handleResize();
    
    // Pencere boyutu değiştiğinde algılama
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 1. Zorlanan cihaz tercihi (localStorage)
  // 2. URL yolu (eğer /mobile/ ile başlıyorsa)
  // 3. Ekran boyutu temelli algılama
  const isMobile = forcedDevice === 'mobile' ? true : 
                  forcedDevice === 'desktop' ? false : 
                  isOnMobilePath ? true :
                  detectedMobile;
  
  return { isMobile, detectedMobile };
}
