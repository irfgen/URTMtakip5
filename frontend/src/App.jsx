import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import mobileTheme from './theme.mobile';
import Layout from './components/Layout';
import MobileLayout from './components/MobileLayout';
import Dashboard from './pages/Dashboard';
import Tezgahlar from './pages/Tezgahlar';
import Parcalar from './pages/Parcalar';
import ParcaDetay from './pages/ParcaDetay';
import StokKartlari from './pages/StokKartlari';
import IsEmirleri from './pages/IsEmirleri';
import Makinalar from './pages/Makinalar';
import Fason from './pages/Fason';
import FasonGruplar from './pages/FasonGruplar';
import Teklifler from './pages/Teklifler';
import Boms from './pages/Boms';
import UretimPlani from './pages/UretimPlani';
import KarmaUretimPlaniForm from './components/UretimPlani/KarmaUretimPlaniForm';
import UretimPanosu from './pages/UretimPanosu';
import ArizaBakimListesi from './pages/ArizaBakim/ArizaBakimListesi';
import ArizaBakimEkle from './pages/ArizaBakim/ArizaBakimEkle';
import ArizaBakimDetay from './pages/ArizaBakim/ArizaBakimDetay';
import UygunsuzluklarPage from './components/Uygunsuzluklar/UygunsuzluklarPage';
import UygunsuzlukDetayPage from './components/Uygunsuzluklar/UygunsuzlukDetayPage';
import UygunsuzlukRaporPage from './components/Uygunsuzluklar/UygunsuzlukRaporPage';
import Raporlar from './pages/Raporlar';
import GunlukVardiyaRaporu from './pages/GunlukVardiyaRaporu';
import Sevkiyat from './pages/Sevkiyat';
import TopluSevkiyatForm from './pages/TopluSevkiyatForm';
import IcSevkiyatlar from './pages/IcSevkiyatlar';

// Tedarik modülü
import TedarikTalepListesi from './components/tedarik/TedarikTalepListesi';
import FirmaYonetimPage from './components/tedarik/FirmaYonetimPage';

// Notlar modülü
import NotlarPage from './components/Notlar/NotlarPage';

// İş Emri Taslakları Yönetimi
import IsEmriTaslaklariYonetimi from './pages/IsEmriTaslaklariYonetimi';

// Yönetimsel modül
import Yonetimsel from './pages/yonetimsel/Yonetimsel';


// Workstation Scheduler - Yeni Tezgah İş Planı Modülü
import WorkstationScheduler from './components/WorkstationScheduler/WorkstationScheduler';
import TezgahIsPlanı from './pages/TezgahIsPlanı';

// Makindex modülü
import MakindexPage from './components/makindex/MakindexPage';
import MakindexPageMobile from './pages/mobile/MakindexPage';

// Mobil sayfa importları
import DashboardMobile from './pages/mobile/DashboardMobile';
import TezgahlarMobile from './pages/mobile/TezgahlarMobile';
import IsEmirleriMobileYeni from './pages/mobile/IsEmirleriMobileYeni'; // Yeni mobil iş emirleri sayfası
import UretimPlaniMobile from './pages/mobile/UretimPlaniMobile';
import UretimPlaniEkleMobile from './pages/mobile/UretimPlaniEkleMobile';
import UretimPlaniDuzenleMobile from './pages/mobile/UretimPlaniDuzenleMobile';
import UretimPlaniDetayMobile from './pages/mobile/UretimPlaniDetayMobile';
import ParcalarMobile from './pages/mobile/ParcalarMobile';
import ParcaDetayMobile from './pages/mobile/ParcaDetayMobile';
import StokKartlariMobile from './pages/mobile/StokKartlariMobile';
import GruplarMobile from './pages/mobile/GruplarMobile';
import GrupDetayMobile from './pages/mobile/GrupDetayMobile';
import GrupFormMobile from './pages/mobile/GrupFormMobile';
import ArizaBakimMobile from './pages/mobile/ArizaBakimMobile';
import ArizaBakimDetayMobile from './pages/mobile/ArizaBakimDetayMobile';
import UygunsuzluklarMobile from './pages/mobile/UygunsuzluklarMobile';
import UygunsuzlukDetayMobile from './pages/mobile/UygunsuzlukDetayMobile';
import UygunsuzlukRaporMobile from './pages/mobile/UygunsuzlukRaporMobile';
import SevkiyatListesiMobile from './pages/mobile/SevkiyatListesiMobile';
import IcSevkiyatlarMobile from './pages/mobile/IcSevkiyatlarMobile';
import MakinaGroupPartsPage from './components/UretimPlani/MakinaGroupPartsPage';

// Fatura & İrsaliye Modülü
import Faturalar from './pages/Faturalar';
import FaturaDetay from './pages/FaturaDetay';
import FaturaFormPage from './pages/FaturaFormPage';
import EslestirmeDesktop from './pages/EslestirmeDesktop';
import EslestirmeDesktopGuncel from './pages/EslestirmeDesktopGuncel';
import Irsaliyeler from './pages/Irsaliyeler';
import IrsaliyeForm from './pages/IrsaliyeForm';
import IrsaliyelerMobile from './pages/mobile/IrsaliyelerMobile';
import SatisFormSimple from './components/SatisFormSimple';
import IrsaliyeFormMobile from './pages/mobile/IrsaliyeFormMobile';
import IrsaliyeDetayMobile from './pages/mobile/IrsaliyeDetayMobile';
// import TezgahIsPlanı from './pages/TezgahIsPlanı'; // OLD SYSTEM DISABLED

// Mobil/Desktop algılama hook'u
import useDeviceDetect from './hooks/useDeviceDetect';
import { useEffect } from 'react';
import socketService from './services/socket';

function App() {
  const { isMobile } = useDeviceDetect();

  // Socket.IO bağlantısını kur
  useEffect(() => {
    socketService.connect();

    // Cleanup: bileşen unmount olduğunda bağlantıyı kapat
    return () => {
      socketService.disconnect();
    };
  }, []);

  // Mobil ve desktop route'ları farklı şekilde göster
  return (
    <ThemeProvider theme={isMobile ? mobileTheme : theme}>
      <CssBaseline />
      {isMobile ? (
        // Mobil Layout ve Rotaları
        <MobileLayout>
          <Routes>
            {/* Anasayfaya gidildiğinde mobil mi desktop mu ona göre yönlendirme yap */}
            <Route path="/" element={<Navigate to="/mobile/tezgahlar" replace />} />
            <Route path="/mobile" element={<Navigate to="/mobile/tezgahlar" replace />} />
            <Route path="/mobile/tezgahlar" element={<TezgahlarMobile />} />
            <Route path="/mobile/is-emirleri" element={<IsEmirleriMobileYeni />} /> {/* Yeni mobil iş emirleri sayfası route'u */}
            <Route path="/mobile/uretim-plani" element={<UretimPlaniMobile />} />
            <Route path="/mobile/uretim-plani/ekle" element={<UretimPlaniEkleMobile />} />
            <Route path="/mobile/uretim-plani/duzenle/:id" element={<UretimPlaniDuzenleMobile />} />
            <Route path="/mobile/uretim-plani/detay/:id" element={<UretimPlaniDetayMobile />} />
            <Route path="/mobile/parcalar" element={<ParcalarMobile />} />
            <Route path="/mobile/parcalar/:parcaKodu" element={<ParcaDetayMobile />} />
            <Route path="/mobile/stok-kartlari" element={<StokKartlariMobile />} />
            <Route path="/mobile/notlar" element={<NotlarPage />} />
            <Route path="/mobile/gruplar" element={<GruplarMobile />} />
            <Route path="/mobile/gruplar/ekle" element={<GrupFormMobile />} />
            <Route path="/mobile/gruplar/duzenle/:id" element={<GrupFormMobile />} />
            <Route path="/mobile/gruplar/:id" element={<GrupDetayMobile />} />
            <Route path="/mobile/ariza-bakim" element={<ArizaBakimMobile />} />
            <Route path="/mobile/ariza-bakim/:id" element={<ArizaBakimDetayMobile />} />
            <Route path="/mobile/uygunsuzluklar" element={<UygunsuzluklarMobile />} />
            <Route path="/mobile/uygunsuzluklar/:id" element={<UygunsuzlukDetayMobile />} />
            <Route path="/mobile/uygunsuzluklar/yeni" element={<UygunsuzlukRaporMobile />} />
            <Route path="/mobile/sevkiyat" element={<SevkiyatListesiMobile />} />
            <Route path="/mobile/ic-sevkiyatlar" element={<IcSevkiyatlarMobile />} />
            <Route path="/mobile/makindex" element={<MakindexPageMobile />} />
            {/* Fatura & İrsaliye Modülü Rotaları */}
            <Route path="/mobile/faturalar" element={<Faturalar />} />
            <Route path="/mobile/faturalar/yeni" element={<FaturaFormPage mode="create" />} />
            <Route path="/mobile/faturalar/:id" element={<FaturaDetay />} />
            <Route path="/mobile/irsaliyeler" element={<IrsaliyelerMobile />} />
            <Route path="/mobile/irsaliyeler/yeni" element={<IrsaliyeFormMobile />} />
            <Route path="/mobile/irsaliyeler/:id" element={<IrsaliyeDetayMobile />} />
            <Route path="/mobile/irsaliyeler/:id/duzenle" element={<IrsaliyeFormMobile />} />
            {/* Toplu sevkiyat düzenleme (mobilde de aynı sayfa kullanılır) */}
            <Route path="/sevkiyat/toplu-yeni/:sevkiyatId" element={<TopluSevkiyatForm />} />
            <Route path="/mobile/uretim-plani/makina-analiz" element={<MakinaGroupPartsPage />} />
            
            
            {/* Henüz mobile sayfası olmayan desktop rotalarına yönlendirme */}
            <Route path="/mobile/*" element={<Navigate to="/mobile" replace />} />
            
            {/* Desktop rotaları gelirse mobil rotalarına yönlendir */}
            <Route path="/tezgahlar" element={<Navigate to="/mobile/tezgahlar" replace />} />
            <Route path="/is-emirleri" element={<Navigate to="/mobile/is-emirleri" replace />} />
            <Route path="/parcalar" element={<Navigate to="/mobile/parcalar" replace />} />
            <Route path="/boms" element={<Navigate to="/mobile/gruplar" replace />} />
            <Route path="/gruplar" element={<Navigate to="/mobile/gruplar" replace />} />
            <Route path="/notlar" element={<Navigate to="/mobile/notlar" replace />} />
            <Route path="/uygunsuzluklar" element={<Navigate to="/mobile/uygunsuzluklar" replace />} />
            <Route path="/ariza-bakim" element={<Navigate to="/mobile/ariza-bakim" replace />} />
            <Route path="/sevkiyat" element={<Navigate to="/mobile/sevkiyat" replace />} />
            <Route path="/faturalar" element={<Navigate to="/mobile/faturalar" replace />} />
            <Route path="/makindex" element={<Navigate to="/mobile/makindex" replace />} />
            <Route path="/uretim-plani/makina-analiz" element={<Navigate to="/mobile/uretim-plani/makina-analiz" replace />} />
          </Routes>
        </MobileLayout>
      ) : (
        // Desktop Layout ve Rotaları
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/tezgahlar" replace />} />
            <Route path="/tezgahlar" element={<Tezgahlar />} />
            <Route path="/personel" element={<div>Personel</div>} />
            <Route path="/is-emirleri" element={<IsEmirleri />} />
            
            {/* İş Emri Taslakları Yönetimi */}
            <Route path="/is-emri-taslaklari/:oturumId" element={<IsEmriTaslaklariYonetimi />} />
            
            {/* Üretim Planı Modülü Rotaları */}
            <Route path="/uretim-plani" element={<UretimPlani />} />
            <Route path="/uretim-plani/ekle" element={<UretimPlani />} />
            <Route path="/uretim-plani/karma" element={<KarmaUretimPlaniForm />} />
            <Route path="/uretim-plani/duzenle/:id" element={<UretimPlani />} />
            <Route path="/uretim-plani/detay/:id" element={<UretimPlani />} />
            <Route path="/uretim-plani/makina-analiz" element={<MakinaGroupPartsPage />} />

            
            {/* Tezgah İş Planı Timeline - OLD SYSTEM DISABLED */}
            {/* <Route path="/tezgah-is-plani" element={<TezgahIsPlanı />} /> */}
            
            {/* Üretim Panosu (Kanban Board) */}
            <Route path="/uretim-panosu" element={<UretimPanosu />} />
            
            <Route path="/kalite-kontrol" element={<div>Kalite Kontrol</div>} />
            
            {/* Arıza ve Bakım Modülü Rotaları */}
            <Route path="/ariza-bakim" element={<ArizaBakimListesi />} />
            <Route path="/ariza-bakim/ekle" element={<ArizaBakimEkle />} />
            <Route path="/ariza-bakim/:id" element={<ArizaBakimDetay />} />

            {/* Uygunsuzluk Raporları Modülü Rotaları */}
            <Route path="/uygunsuzluklar" element={<UygunsuzluklarPage />} />
            <Route path="/uygunsuzluklar/:id" element={<UygunsuzlukDetayPage />} />
            <Route path="/uygunsuzluklar/:id/duzenle" element={<UygunsuzlukRaporPage />} />
            <Route path="/uygunsuzluklar/yeni" element={<UygunsuzlukRaporPage />} />

            <Route path="/parcalar" element={<Parcalar />} />
            <Route path="/parcalar/:parcaKodu" element={<ParcaDetay />} />
            <Route path="/stok-kartlari" element={<StokKartlari />} />
            <Route path="/stok-kartlari/:id" element={<StokKartlari />} />

            {/* Tedarik Modülü */}
            <Route path="/tedarik" element={<TedarikTalepListesi />} />
            <Route path="/tedarik/firma-yonetimi" element={<FirmaYonetimPage />} />
            
                        
            {/* Notlar Modülü */}
            <Route path="/notlar" element={<NotlarPage />} />
            
            {/* Yeni Tezgah İş Planı Modülü */}
            <Route path="/tezgah-is-plani" element={<TezgahIsPlanı />} />
            
            <Route path="/makinalar" element={<Makinalar />} />
            <Route path="/makinalar/ekle" element={<Makinalar />} />
            <Route path="/makinalar/duzenle/:id" element={<Makinalar />} />
            {/* Removed imalat-prosedurleri route */}
            <Route path="/fason" element={<Fason />} />
            <Route path="/fason-gruplar" element={<FasonGruplar />} />
            <Route path="/teklifler" element={<Teklifler />} />
            
            {/* BOM (Gruplar) Modülü Rotaları */}
            <Route path="/boms" element={<Boms />} />
            <Route path="/boms/ekle" element={<Boms />} />
            <Route path="/boms/duzenle/:id" element={<Boms />} />
            
            {/* Basitleştirilmiş Raporlar Modülü Rotaları */}
            {/* ÖZEL ROUTELAR ÖNCE - Genel route'dan önce tanımlanmalı */}
            <Route path="/raporlar/gunluk-vardiya" element={<GunlukVardiyaRaporu />} />
            <Route path="/raporlar/*" element={<Raporlar />} />
            
            {/* Sevkiyat Modülü Rotaları */}
            <Route path="/sevkiyat" element={<Sevkiyat />} />
            <Route path="/sevkiyat/toplu-yeni/:sevkiyatId" element={<TopluSevkiyatForm />} />
            <Route path="/ic-sevkiyatlar" element={<IcSevkiyatlar />} />
            
            {/* Mobil sayfalarına gidildiği zaman desktop kullanıcılarını anasayfaya yönlendir */}
            <Route path="/mobile/*" element={<Navigate to="/" replace />} />
            {/* Yönetimsel modül rotası */}
            <Route path="/yonetimsel/*" element={<Yonetimsel />} />

            
            {/* Makindex modülü rotası */}
            <Route path="/makindex" element={<MakindexPage />} />

            {/* Faturalar Modülü Rotaları */}
            <Route path="/faturalar" element={<Faturalar />} />
            <Route path="/faturalar/yeni" element={<FaturaFormPage mode="create" />} />
            <Route path="/faturalar/:id" element={<FaturaDetay />} />
            <Route path="/faturalar/:id/eslestirme" element={<EslestirmeDesktop />} />
            <Route path="/faturalar/:id/eslestirme-guncel" element={<EslestirmeDesktopGuncel />} />
            <Route path="/irsaliyeler" element={<Irsaliyeler />} />
            <Route path="/irsaliyeler/yeni" element={<IrsaliyeForm mode="create" />} />
            <Route path="/irsaliyeler/:id" element={<IrsaliyeDetayMobile />} />
            <Route path="/irsaliyeler/:id/duzenle" element={<IrsaliyeForm mode="edit" />} />
            <Route path="/satis" element={<SatisFormSimple />} />
          </Routes>
        </Layout>
      )}
    </ThemeProvider>
  );
}

export default App;