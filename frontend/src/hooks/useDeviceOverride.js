// filepath: /home/irfan/Documents/PROJELER/URTMtakip/frontend/src/hooks/useDeviceOverride.js
import { useState, useEffect } from 'react';

export default function useDeviceOverride() {
  const [forcedDevice, setForcedDevice] = useState(null);
  
  useEffect(() => {
    // localStorage'dan kayıtlı zorlanmış cihaz tercihini al
    const savedPreference = localStorage.getItem('forcedDevice');
    if (savedPreference) {
      setForcedDevice(savedPreference);
    }
  }, []);
  
  // Cihaz tercihini değiştirme fonksiyonu
  const setDevicePreference = (preference) => {
    // preference: 'mobile', 'desktop' veya null (otomatik algılama)
    if (preference) {
      localStorage.setItem('forcedDevice', preference);
    } else {
      localStorage.removeItem('forcedDevice');
    }
    setForcedDevice(preference);
  };
  
  return { forcedDevice, setDevicePreference };
}
