import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Box, 
    Typography, 
    TextField, 
    Button, 
    Card, 
    CardContent, 
    CardMedia,
    Grid,
    IconButton,
    Chip,
    Divider,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    Badge,
    Paper,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Popover,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Snackbar,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import FactoryIcon from '@mui/icons-material/Factory';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import GroupIcon from '@mui/icons-material/Group';
import UretimPlaniIsEmriSecimiModal from './UretimPlaniIsEmriSecimiModal';
import UretimPlaniFasonSecimiModal from './UretimPlaniFasonSecimiModal';
import IsEmriDuzenleForm from '../IsEmriDuzenleForm';
import { getFotoPath } from '../../utils/imageUtils';
import { isStatusCompleted, isStatusActive } from '../../utils/statusUtils';
import axios from 'axios';

const UretimPlaniDetay = ({ id }) => {
    const navigate = useNavigate();
    
    // State tanımlamaları
    const [planAdi, setPlanAdi] = useState('');
    const [aciklama, setAciklama] = useState('');
    const [uretimPlani, setUretimPlani] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    
    // Modal States
    const [isEmriModalOpen, setIsEmriModalOpen] = useState(false);
    const [fasonSecimiModalOpen, setFasonSecimiModalOpen] = useState(false);
    
    // Action buttons için yeni state'ler
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editModalIsEmri, setEditModalIsEmri] = useState(null);
    const [tezgahAnchorEl, setTezgahAnchorEl] = useState(null);
    const [selectedTezgahIsEmri, setSelectedTezgahIsEmri] = useState(null);
    const [tezgahListesi, setTezgahListesi] = useState([]);
    const [tezgahLoading, setTezgahLoading] = useState(false);
    
    // Fason creation modal state
    const [fasonCreationModalOpen, setFasonCreationModalOpen] = useState(false);
    const [selectedIsEmriForFason, setSelectedIsEmriForFason] = useState(null);
    const [fasonFormData, setFasonFormData] = useState({
        parca_kodu: '',
        fason_adet: 1,
        teslim_tarihi: '',
        ilgili_kisi: '',
        tedarikci: '',
        durum: 'beklemede',
        aciklama: '',
        fason_grup_id: ''
    });
    const [fasonGruplar, setFasonGruplar] = useState([]);
    
    // Snackbar state
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    
    // Seçilen Öğeler
    const [selectedIsEmirleri, setSelectedIsEmirleri] = useState([]);
    const [selectedFasonlar, setSelectedFasonlar] = useState([]);
    const [tamamlananIsEmirleri, setTamamlananIsEmirleri] = useState([]);
    const [tamamlananFasonlar, setTamamlananFasonlar] = useState([]);
    
    // Parça Görselleri
    const [parcaGorselleri, setParcaGorselleri] = useState({});
    // Resim önizleme (hover) durumu - flicker'ı önlemek için koordinat bazlı
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
    const [imagePreviewSrc, setImagePreviewSrc] = useState('');
    const [imagePreviewPos, setImagePreviewPos] = useState({ top: 0, left: 0 });
    const closeTimerRef = useRef(null);
    const clearCloseTimer = () => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    };
    const handleImagePreviewOpen = (event, src) => {
        clearCloseTimer();
        setIsImagePreviewOpen(true);
        setImagePreviewSrc(src);
        setImagePreviewPos({ top: event.clientY, left: event.clientX + 20 });
    };
    const handleImagePreviewMove = (event) => {
        setImagePreviewPos({ top: event.clientY, left: event.clientX + 20 });
    };
    const scheduleImagePreviewClose = () => {
        clearCloseTimer();
        closeTimerRef.current = setTimeout(() => {
            setIsImagePreviewOpen(false);
            setImagePreviewSrc('');
        }, 300);
    };
    
    // Form States
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Base64 encoded placeholder image (1x1 pixel gray image)
    const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdvcnNlbCBZb2s8L3RleHQ+PC9zdmc+';

    // Parça görsellerini yükle
    const loadParcaGorselleri = async (isEmirleri, fasonlar = []) => {
        console.log('=== Görsel Yükleme Başlangıç ===');
        console.log('İş emirleri sayısı:', isEmirleri.length);
        console.log('Fason işleri sayısı:', fasonlar.length);
        
        const yeniGorseller = { ...parcaGorselleri };
        
        // İş emirleri için görselleri yükle
        for (const isEmri of isEmirleri) {
            const emriId = String(isEmri.id || isEmri.is_emri_id); // ID'yi normalize et
            const parcaKodu = isEmri.parca_kodu || isEmri.is_adi; // Parça kodu yoksa iş adını kullan
            
            console.log(`İş emri işleniyor: ${emriId} - ${parcaKodu}`);
            
            if (!yeniGorseller[emriId] && parcaKodu) {
                try {
                    // Önce iş emrinin parca ilişkisini kontrol et
                    if (isEmri.parca && isEmri.parca.foto_path) {
                        yeniGorseller[emriId] = getFotoPath(isEmri.parca.foto_path);
                        console.log(`İş emri görseli include'dan alındı: ${emriId} -> ${yeniGorseller[emriId]}`);
                        continue;
                    }
                    
                    // Include çalışmadıysa API'den al
                    const response = await axios.get(`/api/parcalar`, {
                        params: { aramaMetni: parcaKodu }
                    });
                    
                    if (response.data && response.data.parcalar && response.data.parcalar.length > 0) {
                        const parca = response.data.parcalar.find(p => 
                            p.parcaKodu === parcaKodu || 
                            p.parcaAdi === parcaKodu ||
                            p.parcaKodu.toLowerCase() === parcaKodu.toLowerCase()
                        );
                        
                        if (parca && parca.foto_path) {
                            yeniGorseller[emriId] = getFotoPath(parca.foto_path);
                            console.log(`İş emri görseli API'den yüklendi: ${emriId} -> ${parcaKodu} -> ${yeniGorseller[emriId]}`);
                        } else {
                            console.log(`Parça görseli bulunamadı: ${parcaKodu}`);
                        }
                    } else {
                        console.log(`Parça bulunamadı: ${parcaKodu}`);
                    }
                } catch (error) {
                    console.log(`Parça görseli yüklenemedi: ${parcaKodu}`, error);
                }
            } else if (yeniGorseller[emriId]) {
                console.log(`İş emri görseli cache'de mevcut: ${emriId}`);
            } else {
                console.log(`İş emri için parça kodu yok: ${emriId}`);
            }
        }
        
        // Fason işleri için görselleri yükle
        for (const fason of fasonlar) {
            const fasonId = String(fason.fason_is_emri_id); // Doğru ID field'ı kullan
            console.log(`Fason işleniyor: ${fasonId} - ${fason.parca_kodu} (${fason.firma_adi})`);
            if (!yeniGorseller[fasonId] && fason.parca_kodu) {
                try {
                    const response = await axios.get(`/api/parcalar`, {
                        params: { aramaMetni: fason.parca_kodu }
                    });
                    
                    if (response.data && response.data.parcalar && response.data.parcalar.length > 0) {
                        const parca = response.data.parcalar[0];
                        if (parca.foto_path) {
                            yeniGorseller[fasonId] = getFotoPath(parca.foto_path);
                            console.log(`Fason görseli yüklendi: ${fasonId} -> ${fason.parca_kodu} -> ${yeniGorseller[fasonId]}`);
                        }
                    }
                } catch (error) {
                    console.log(`Fason parça görseli yüklenemedi: ${fason.parca_kodu}`, error);
                }
            } else if (yeniGorseller[fasonId]) {
                console.log(`Fason görseli cache'de mevcut: ${fasonId} -> ${yeniGorseller[fasonId]}`);
            } else {
                console.log(`Fason için parça kodu yok: ${fasonId}`);
            }
        }
        
        console.log('Güncellenen görsel cache:', Object.keys(yeniGorseller).length, 'öğe');
        console.log('Cache içeriği:', yeniGorseller);
        setParcaGorselleri(yeniGorseller);
        console.log('=== Görsel Yükleme Tamamlandı ===');
    };

    // Tab değiştirme
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Toplam istatistikler
    const toplamIsEmri = selectedIsEmirleri.length;
    const toplamFason = selectedFasonlar.length;
    const toplamOge = toplamIsEmri + toplamFason;

    // Üretim planı verilerini yükle
    useEffect(() => {
        const fetchUretimPlani = async () => {
            try {
                setLoading(true);
                
                // Üretim planı detaylarını getir
                const planResponse = await axios.get(`/api/uretim-plani/${id}`);
                const plan = planResponse.data;
                setUretimPlani(plan);
                setPlanAdi(plan.ozel_liste_adi || plan.aciklama || '');
                setAciklama(plan.aciklama || '');
                
                // İlişkili iş emirlerini getir
                const isEmirleriResponse = await axios.get(`/api/is-emirleri/by-uretim-plani/${id}`);
                const allIsEmirleri = isEmirleriResponse.data;

                // İş emirlerini duruma göre ayır: tamamlanmayan (ve fason olmayan) aktif sayılır
                const fasonStatus = (v) => (v || '').toString().trim().toLowerCase() === 'fason';
                const aktifIsEmirleri = allIsEmirleri.filter(ie => !isStatusCompleted(ie.durum) && !fasonStatus(ie.durum));
                const tamamlananIsEmirleri = allIsEmirleri.filter(ie => isStatusCompleted(ie.durum));
                const fasonDurumluIsEmirleri = allIsEmirleri.filter(ie => fasonStatus(ie.durum));

                setSelectedIsEmirleri(aktifIsEmirleri);
                setTamamlananIsEmirleri(tamamlananIsEmirleri);

                // Değişkenleri burada tanımla
                let aktifFasonlar = [];
                let tamamlananFasonlar = [];

                // Fason işlerini getir
                try {
                    const fasonResponse = await axios.get(`/api/fason/is-emirleri/by-uretim-plani/${id}`);
                    const allFasonlar = fasonResponse.data || [];

                    // 'durumu fason' olan iş emirlerini fason listesine dönüştür ve ekle
                    const fasonaDonusenIsler = fasonDurumluIsEmirleri.map(ie => ({
                        // Görselleme ve anahtar için tutarlı ID
                        fason_is_emri_id: `ie_${ie.is_emri_id}`,
                        firma_adi: ie.firma_adi || ie.tedarikci || 'Fason',
                        is_tanimi: ie.is_adi,
                        parca_kodu: ie.parca_kodu,
                        adet: ie.adet,
                        durum: 'fason',
                        parca: ie.parca || null
                    }));

                    const birlesikFasonlar = [...allFasonlar, ...fasonaDonusenIsler];

                    // Fason işlerini duruma göre ayır
                    aktifFasonlar = birlesikFasonlar.filter(f => !isStatusCompleted(f.durum));
                    tamamlananFasonlar = birlesikFasonlar.filter(f => isStatusCompleted(f.durum));
                    
                    setSelectedFasonlar(aktifFasonlar);
                    setTamamlananFasonlar(tamamlananFasonlar);
                } catch (fasonError) {
                    console.log('Fason işleri yüklenirken hata (normal olabilir):', fasonError);
                    setSelectedFasonlar([]);
                    setTamamlananFasonlar([]);
                }
                
                // Parça görsellerini yükle
                await loadParcaGorselleri(
                    [...aktifIsEmirleri, ...tamamlananIsEmirleri],
                    [...aktifFasonlar, ...tamamlananFasonlar]
                );
                
            } catch (error) {
                console.error('Üretim planı yüklenirken hata:', error);
                setSaveError('Üretim planı yüklenirken bir hata oluştu');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchUretimPlani();
        }
    }, [id]);

    // Geri dön
    const handleGeriDon = () => {
        navigate('/uretim-plani');
    };

    // Düzenleme moduna geç
    const handleEdit = () => {
        navigate(`/uretim-plani/duzenle/${id}`);
    };

    // İş emri seçme modalını aç
    const handleIsEmriEkleClick = () => {
        setIsEmriModalOpen(true);
    };

    // Fason seçme modalını aç
    const handleFasonEkleClick = () => {
        setFasonSecimiModalOpen(true);
    };

    // İş emri seçme modalını kapat
    const handleModalClose = () => {
        setIsEmriModalOpen(false);
    };

    // Fason seçme modalını kapat
    const handleFasonModalClose = () => {
        setFasonSecimiModalOpen(false);
    };

    // İş emirleri seçildiğinde
    const handleIsEmirleriSec = async (yeniIsEmirleri) => {
        console.log('Seçilen iş emirleri:', yeniIsEmirleri);
        
        // ID'leri normalize et ve duplikasyon kontrolü yap
        const mevcutIds = selectedIsEmirleri.map(ie => {
            const id = ie.id || ie.is_emri_id;
            return String(id); // String'e çevir tutarlılık için
        });
        
        const yeniEklenecekler = yeniIsEmirleri.filter(ie => {
            const id = String(ie.id || ie.is_emri_id);
            return !mevcutIds.includes(id);
        });
        
        console.log('Mevcut ID\'ler:', mevcutIds);
        console.log('Yeni eklenecekler:', yeniEklenecekler.map(ie => String(ie.id || ie.is_emri_id)));
        
        if (yeniEklenecekler.length > 0) {
            setSelectedIsEmirleri([...selectedIsEmirleri, ...yeniEklenecekler]);
            // Yeni eklenen iş emirlerinin görsellerini yükle
            await loadParcaGorselleri(yeniEklenecekler, []);
        }
        
        setIsEmriModalOpen(false);
    };

    // Fason işleri seçildiğinde
    const handleFasonlarSec = async (yeniFasonlar) => {
        console.log('=== Fason Ekleme Başlangıç ===');
        console.log('Seçilen fason işleri:', yeniFasonlar.map(f => ({ 
            id: f.fason_is_emri_id || f.id, 
            firma: f.firma_adi || f.tedarikci, 
            parca: f.parca_kodu 
        })));
        console.log('Mevcut fason listesi:', selectedFasonlar.map(f => ({ 
            id: f.fason_is_emri_id || f.id, 
            firma: f.firma_adi || f.tedarikci, 
            parca: f.parca_kodu 
        })));
        
        // ID'leri normalize et ve duplikasyon kontrolü yap
        const mevcutIds = selectedFasonlar.map(f => String(f.fason_is_emri_id || f.id));
        console.log('Mevcut fason ID\'leri:', mevcutIds);
        
        const yeniEklenecekler = yeniFasonlar.filter(f => {
            const fId = String(f.fason_is_emri_id || f.id);
            const eklenecek = !mevcutIds.includes(fId);
            console.log(`Fason ${fId} (${f.firma_adi || f.tedarikci}) - Eklenecek mi: ${eklenecek}`);
            return eklenecek;
        });
        
        console.log('Yeni eklenecek fasonlar:', yeniEklenecekler.map(f => ({ 
            id: String(f.fason_is_emri_id || f.id), 
            firma: f.firma_adi || f.tedarikci, 
            parca: f.parca_kodu 
        })));
        
        if (yeniEklenecekler.length > 0) {
            // Yeni fason işlerini normalize et
            const normalizedYeniEklenecekler = yeniEklenecekler.map(f => ({
                ...f,
                id: f.fason_is_emri_id || f.id,
                fason_is_emri_id: f.fason_is_emri_id || f.id,
                firma_adi: f.firma_adi || f.tedarikci,
                tedarikci: f.firma_adi || f.tedarikci,
                adet: f.adet || f.fason_adet,
                fason_adet: f.adet || f.fason_adet
            }));
            
            const yeniListe = [...selectedFasonlar, ...normalizedYeniEklenecekler];
            console.log('Güncellenmiş fason listesi:', yeniListe.map(f => ({ 
                id: f.fason_is_emri_id || f.id, 
                firma: f.firma_adi || f.tedarikci, 
                parca: f.parca_kodu 
            })));
            setSelectedFasonlar(yeniListe);
            
            // Yeni eklenen fason işlerinin görsellerini yükle
            console.log('Görsel yükleme başlatılıyor...');
            await loadParcaGorselleri([], normalizedYeniEklenecekler);
        } else {
            console.log('Eklenecek yeni fason yok (duplikasyon engellendi)');
        }
        
        setFasonSecimiModalOpen(false);
        console.log('=== Fason Ekleme Tamamlandı ===');
    };

    // İş emrini listeden çıkart
    const handleIsEmriCikart = (isEmriId) => {
        console.log('İş emri çıkarılıyor:', isEmriId);
        
        // ID'yi normalize et
        const normalizedId = String(isEmriId);
        
        setSelectedIsEmirleri(selectedIsEmirleri.filter(ie => {
            const ieId = String(ie.id || ie.is_emri_id);
            return ieId !== normalizedId;
        }));
        
        // Görsel cache'den de kaldır
        const yeniGorseller = { ...parcaGorselleri };
        delete yeniGorseller[normalizedId];
        setParcaGorselleri(yeniGorseller);
        
        console.log('İş emri çıkarıldı. Kalan:', selectedIsEmirleri.length - 1);
    };

    // Fason işini listeden çıkart
    const handleFasonCikart = useCallback((fasonId) => {
        console.log('=== Fason Silme Başlangıç ===');
        console.log('Silinecek fason ID:', fasonId);
        
        setSelectedFasonlar(currentList => {
            console.log('Current fason listesi:', currentList.map(f => ({ id: f.fason_is_emri_id, firma: f.firma_adi, parca: f.parca_kodu })));
            
            // ID'yi normalize et
            const normalizedId = String(fasonId);
            
            // Filtreleme işlemini kontrol et
            const yeniListe = currentList.filter(f => {
                const fId = String(f.fason_is_emri_id); // Doğru ID field'ı kullan
                const tutulacak = fId !== normalizedId;
                console.log(`Fason ${fId} (${f.firma_adi}) - Silinecek mi: ${!tutulacak}`);
                return tutulacak;
            });
            
            console.log('Yeni liste uzunluğu:', yeniListe.length);
            console.log('Kalan fasonlar:', yeniListe.map(f => ({ id: f.fason_is_emri_id, firma: f.firma_adi })));
            
            return yeniListe;
        });
        
        // Görsel cache'den de kaldır
        setParcaGorselleri(currentCache => {
            const normalizedId = String(fasonId);
            const yeniGorseller = { ...currentCache };
            delete yeniGorseller[normalizedId];
            console.log(`Görsel cache'den silindi: ${normalizedId}`);
            return yeniGorseller;
        });
        
        console.log('=== Fason Silme Tamamlandı ===');
    }, []);

    // Üretim planını güncelle
    const handleSave = async () => {
        if (!planAdi.trim()) {
            setSaveError('Üretim planı adı gereklidir');
            return;
        }

        if (selectedIsEmirleri.length === 0 && selectedFasonlar.length === 0) {
            setSaveError('En az bir iş emri veya fason iş emri seçmelisiniz');
            return;
        }

        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        try {
            const uretimPlaniData = {
                plan_adi: planAdi.trim(),
                aciklama: aciklama.trim(),
                // Güncellemede hem aktif hem tamamlanan iş emirlerini dahil et
                is_emirleri: [...selectedIsEmirleri, ...tamamlananIsEmirleri].map(ie => ({
                    is_emri_id: ie.id || ie.is_emri_id,
                    is_emri_no: ie.is_emri_no,
                    is_adi: ie.is_adi,
                    parca_kodu: ie.parca_kodu,
                    adet: ie.adet,
                    durum: ie.durum
                })),
                // Güncellemede hem aktif hem tamamlanan fason işleri dahil et
                // Yalnızca gerçek Fason İş Emri kayıtlarını gönder (IE'den türetilen placeholder'ları hariç tut)
                fason_isleri: [...selectedFasonlar, ...tamamlananFasonlar]
                    .filter(f => {
                        const fid = f.fason_is_emri_id || f.fason_id || f.id;
                        // IE'den türetilmiş placeholder'ları hariç tut (ie_ ile başlayanlar)
                        if (String(fid).startsWith('ie_')) {
                            return false;
                        }
                        // Geçerli ID'leri kabul et (sayı, sayısal string veya UUID)
                        if (fid === undefined || fid === null) {
                            return false;
                        }
                        const fidStr = String(fid);
                        // UUID formatını kabul et (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
                        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                        // Sayısal ID'leri kabul et
                        return !isNaN(Number(fid)) || uuidRegex.test(fidStr);
                    })
                    .map(f => ({
                        fason_is_emri_id: f.fason_is_emri_id || f.fason_id || f.id,
                        firma_adi: f.firma_adi || f.tedarikci,
                        is_tanimi: f.is_tanimi,
                        parca_kodu: f.parca_kodu,
                        adet: f.adet || f.fason_adet,
                        durum: f.durum
                    })),
                durum: 'aktif',
                guncelleme_tarihi: new Date().toISOString()
            };

            console.log('=== Karma Plan Güncelleme Debug ===');
            console.log('selectedFasonlar sayısı:', selectedFasonlar.length);
            console.log('selectedFasonlar örnek ID\'leri:', selectedFasonlar.slice(0,3).map(f => f.fason_is_emri_id || f.id));
            console.log('tamamlananFasonlar sayısı:', tamamlananFasonlar.length);
            
            // Filtreleme öncesi debug
            const oncesiFasonlar = [...selectedFasonlar, ...tamamlananFasonlar];
            console.log('Filtreleme öncesi toplam fason:', oncesiFasonlar.length);
            
            console.log('Karma plan güncellemesi için gönderilecek veri:');
            console.log('- İş emirleri sayısı:', uretimPlaniData.is_emirleri.length);
            console.log('- Fason işleri sayısı:', uretimPlaniData.fason_isleri.length);
            console.log('- Fason işleri detay:', uretimPlaniData.fason_isleri.map(f => ({
                id: f.fason_is_emri_id,
                firma: f.firma_adi,
                parca: f.parca_kodu,
                adet: f.adet
            })));

            // Üretim planını güncelle
            await axios.put(`/api/uretim-plani/${id}`, uretimPlaniData);
            
            console.log('Karma üretim planı başarıyla güncellendi');
            setSaveSuccess(true);
            
            // Başarı mesajını 3 saniye sonra gizle
            setTimeout(() => {
                setSaveSuccess(false);
            }, 3000);

            // Güncel veriyi yeniden yükle (tamamlanan ve fason listeleri tazele)
            try {
                setLoading(true);
                const planResponseAfter = await axios.get(`/api/uretim-plani/${id}`);
                setUretimPlani(planResponseAfter.data);

                const [isEmResp, fasonResp] = await Promise.all([
                    axios.get(`/api/is-emirleri/by-uretim-plani/${id}`),
                    axios.get(`/api/fason/is-emirleri/by-uretim-plani/${id}`).catch(() => ({ data: [] }))
                ]);

                const allIsEmAfter = isEmResp.data || [];
                const isFason = (v) => (v || '').toString().trim().toLowerCase() === 'fason';
                const aktifAfter = allIsEmAfter.filter(ie => !isStatusCompleted(ie.durum) && !isFason(ie.durum));
                const tamamAfter = allIsEmAfter.filter(ie => isStatusCompleted(ie.durum));
                const fasonStatusAfter = allIsEmAfter.filter(ie => isFason(ie.durum));

                setSelectedIsEmirleri(aktifAfter);
                setTamamlananIsEmirleri(tamamAfter);

                const allFasonAfter = fasonResp.data || [];
                const mappedFasonFromIE = fasonStatusAfter.map(ie => ({
                    fason_is_emri_id: `ie_${ie.is_emri_id}`,
                    firma_adi: ie.firma_adi || ie.tedarikci || 'Fason',
                    is_tanimi: ie.is_adi,
                    parca_kodu: ie.parca_kodu,
                    adet: ie.adet,
                    durum: 'fason',
                    parca: ie.parca || null
                }));

                const mergedFasonAfter = [...allFasonAfter, ...mappedFasonFromIE];
                setSelectedFasonlar(mergedFasonAfter.filter(f => !isStatusCompleted(f.durum)));
                setTamamlananFasonlar(mergedFasonAfter.filter(f => isStatusCompleted(f.durum)));

                // Görselleri güncelle
                await loadParcaGorselleri([...aktifAfter, ...tamamAfter], mergedFasonAfter);
            } catch (refreshErr) {
                console.warn('Güncelleme sonrası veri tazeleme başarısız oldu:', refreshErr);
            } finally {
                setLoading(false);
            }

        } catch (error) {
            console.error('Üretim planı güncellenirken hata:', error);
            setSaveError(
                error.response?.data?.error || 
                error.response?.data?.message || 
                'Üretim planı güncellenirken bir hata oluştu'
            );
        } finally {
            setSaving(false);
        }
    };

    // İş emri düzenleme handler
    const handleIsEmriDuzenle = (isEmri) => {
        setEditModalIsEmri(isEmri);
        setEditModalOpen(true);
    };

    // İş emri düzenle modal kapatma
    const handleIsEmriDuzenleClose = () => {
        setEditModalOpen(false);
        setEditModalIsEmri(null);
    };

    // İş emri düzenle kaydetme
    const handleIsEmriUpdate = async (formData) => {
        if (!editModalIsEmri) return;
        
        try {
            await axios.put(`/api/is-emirleri/${editModalIsEmri.is_emri_id}`, formData);
            
            // Listeyi güncelle
            setSelectedIsEmirleri(prevList => 
                prevList.map(item => 
                    item.is_emri_id === editModalIsEmri.is_emri_id 
                        ? { ...item, ...formData }
                        : item
                )
            );
            
            setSnackbar({
                open: true,
                message: 'İş emri başarıyla güncellendi',
                severity: 'success'
            });
            
            setEditModalOpen(false);
            setEditModalIsEmri(null);
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'İş emri güncellenirken hata oluştu: ' + (error.response?.data?.error || error.message),
                severity: 'error'
            });
        }
    };

    // Tezgah tanımla handler
    const handleTezgahTanimla = async (event, isEmri) => {
        setSelectedTezgahIsEmri(isEmri);
        setTezgahAnchorEl(event.currentTarget);
        
        // Tezgahları yükle
        setTezgahLoading(true);
        try {
            const response = await axios.get('/api/tezgahlar');
            // API yanıtını güvenli şekilde işle
            let tezgahlarData = [];
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                tezgahlarData = response.data.data;
            } else if (Array.isArray(response.data)) {
                tezgahlarData = response.data;
            }
            setTezgahListesi(tezgahlarData);
        } catch (error) {
            console.error('Tezgahlar yüklenirken hata:', error);
            setSnackbar({
                open: true,
                message: 'Tezgahlar yüklenirken hata oluştu',
                severity: 'error'
            });
        } finally {
            setTezgahLoading(false);
        }
    };

    // Tezgah popover kapatma
    const handleTezgahPopoverClose = () => {
        setTezgahAnchorEl(null);
        setSelectedTezgahIsEmri(null);
    };

    // Tezgah seçimi
    const handleTezgahSec = async (tezgah) => {
        if (!selectedTezgahIsEmri) return;
        
        try {
            await axios.post(`/api/tezgah-plan/${tezgah.tezgah_id}/planla`, {
                is_emri_id: selectedTezgahIsEmri.is_emri_id
            });
            
            setSnackbar({
                open: true,
                message: `İş emri ${selectedTezgahIsEmri.is_emri_no} başarıyla ${tezgah.tezgah_tanimi} tezgahına atandı`,
                severity: 'success'
            });
            
            // Popover'ı kapat
            handleTezgahPopoverClose();
            
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Tezgah atama işlemi başarısız: ' + (error.response?.data?.error || error.message),
                severity: 'error'
            });
        }
    };

    // İş tamamlandı yap handler
    const handleIsTamamla = async (isEmri) => {
        try {
            await axios.put(`/api/is-emirleri/${isEmri.is_emri_id}`, {
                durum: 'tamamlandı'
            });
            
            // İş emrini aktif listeden çıkar ve tamamlanan listesine ekle
            setSelectedIsEmirleri(prevList => 
                prevList.filter(item => item.is_emri_id !== isEmri.is_emri_id)
            );
            
            setTamamlananIsEmirleri(prevList => [
                ...prevList,
                { ...isEmri, durum: 'tamamlandı' }
            ]);
            
            setSnackbar({
                open: true,
                message: `İş emri ${isEmri.is_emri_no} tamamlandı olarak işaretlendi`,
                severity: 'success'
            });
            
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'İş tamamlama işlemi başarısız: ' + (error.response?.data?.error || error.message),
                severity: 'error'
            });
        }
    };

    // İş emrinden fason iş oluştur handler
    const handleFasonIsOlustur = async (isEmri) => {
        setSelectedIsEmriForFason(isEmri);
        
        // Fason gruplarını yükle
        try {
            const response = await axios.get('/api/fason-grup');
            setFasonGruplar(response.data || []);
        } catch (error) {
            console.error('Fason grupları yüklenirken hata:', error);
        }

        // Form verilerini iş emri bilgileri ile doldur
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 7); // 1 hafta sonra varsayılan teslim tarihi

        setFasonFormData({
            parca_kodu: isEmri.parca_kodu || '',
            fason_adet: isEmri.adet || 1,
            teslim_tarihi: tomorrow.toISOString().split('T')[0],
            ilgili_kisi: '',
            tedarikci: '',
            durum: 'beklemede',
            aciklama: `İş Emri ${isEmri.is_emri_no}'dan oluşturuldu - ${isEmri.is_adi || ''}`,
            fason_grup_id: '',
            is_emri_id: isEmri.is_emri_id // İş emri referansını sakla
        });
        
        setFasonCreationModalOpen(true);
    };

    // Fason oluşturma modal kapatma
    const handleFasonCreationModalClose = () => {
        setFasonCreationModalOpen(false);
        setSelectedIsEmriForFason(null);
        setFasonFormData({
            parca_kodu: '',
            fason_adet: 1,
            teslim_tarihi: '',
            ilgili_kisi: '',
            tedarikci: '',
            durum: 'beklemede',
            aciklama: '',
            fason_grup_id: ''
        });
    };

    // Fason iş kaydetme
    const handleFasonSave = async () => {
        if (!selectedIsEmriForFason) return;

        try {
            // Önce fason işi oluştur - üretim planı ID'si ile birlikte
            const fasonResponse = await axios.post('/api/fason/is-emirleri', {
                ...fasonFormData,
                verilis_tarihi: new Date().toISOString().split('T')[0],
                uretim_plani_id: id // Üretim planı ile ilişkilendir
            });

            // Başarılı olursa iş emrinin durumunu 'fason' olarak güncelle
            await axios.put(`/api/is-emirleri/${selectedIsEmriForFason.is_emri_id}`, {
                durum: 'fason'
            });

            // İş emrini listelerden çıkar (fason durumunda olduğu için görünmez)
            setSelectedIsEmirleri(prevList => 
                prevList.filter(item => item.is_emri_id !== selectedIsEmriForFason.is_emri_id)
            );

            // Oluşturulan fason işi selectedFasonlar listesine ekle
            const yeniFasonIs = {
                ...fasonResponse.data,
                id: fasonResponse.data.fason_is_emri_id,
                fason_is_emri_id: fasonResponse.data.fason_is_emri_id,
                firma_adi: fasonResponse.data.tedarikci,
                is_tanimi: `İş Emri ${selectedIsEmriForFason.is_emri_no}'dan dönüştürüldü`,
                adet: fasonResponse.data.fason_adet
            };

            setSelectedFasonlar(prevList => [...prevList, yeniFasonIs]);

            // Yeni fason işinin görselini yükle
            await loadParcaGorselleri([], [yeniFasonIs]);

            setSnackbar({
                open: true,
                message: `İş emri ${selectedIsEmriForFason.is_emri_no} başarıyla fason işe dönüştürüldü`,
                severity: 'success'
            });

            handleFasonCreationModalClose();

        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Fason iş oluşturma başarısız: ' + (error.response?.data?.error || error.message),
                severity: 'error'
            });
        }
    };

    // İş emri detay gösterme handler (eski)
    const handleIsEmriDetayGoster = (isEmri) => {
        alert(`İş emri detayları: ${isEmri.is_emri_no}\nDurum: ${isEmri.durum}\nAdet: ${isEmri.adet}`);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!uretimPlani) {
        return (
            <Box>
                <Alert severity="error">
                    Üretim planı bulunamadı. <Button onClick={handleGeriDon}>Geri Dön</Button>
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            {/* Başlık ve İşlemler */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton 
                    sx={{ mr: 2 }}
                    onClick={handleGeriDon}
                >
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                    Karma Üretim Planı Detayı
                </Typography>
                <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={handleEdit}
                    sx={{ ml: 2 }}
                >
                    Düzenle
                </Button>
            </Box>

            {/* Plan Bilgileri */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Plan Bilgileri</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <TextField
                                label="Üretim Planı Adı"
                                value={planAdi}
                                onChange={(e) => setPlanAdi(e.target.value)}
                                fullWidth
                                variant="outlined"
                                placeholder="Üretim planınıza bir ad verin"
                                helperText="Bu ad üretim planını tanımlamak için kullanılacak"
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
                                <Typography variant="h6" color="primary">
                                    Toplam: {toplamOge} Öğe
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {toplamIsEmri} İş Emri + {toplamFason} Fason
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Açıklama"
                                value={aciklama}
                                onChange={(e) => setAciklama(e.target.value)}
                                fullWidth
                                multiline
                                rows={2}
                                variant="outlined"
                                placeholder="İsteğe bağlı açıklama ekleyebilirsiniz"
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Tab Navigation */}
            <Box sx={{ mb: 3 }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons
                  allowScrollButtonsMobile
                >
                    <Tab 
                        icon={<Badge badgeContent={toplamIsEmri} color="primary"><WorkIcon /></Badge>} 
                        label="İş Emirleri" 
                    />
                    <Tab 
                        icon={<Badge badgeContent={toplamFason} color="secondary"><BusinessIcon /></Badge>} 
                        label="Fason İşleri" 
                    />
                </Tabs>
            </Box>

            {/* Hata ve Başarı Mesajları */}
            {saveError && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSaveError(null)}>
                    {saveError}
                </Alert>
            )}
            
            {saveSuccess && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    Karma üretim planı başarıyla güncellendi!
                </Alert>
            )}

            {/* Tab İçerikleri */}
            {activeTab === 0 && (
                <>
                    {/* İş Emri Ekle Butonu */}
                    <Box sx={{ mb: 3 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleIsEmriEkleClick}
                            size="large"
                            color="primary"
                        >
                            İş Emri Ekle
                        </Button>
                    </Box>

                    {/* Seçilen İş Emirleri */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Seçilen İş Emirleri ({selectedIsEmirleri.length})
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            
                            {selectedIsEmirleri.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                    Henüz iş emri eklenmedi. Yukarıdaki "İş Emri Ekle" butonunu kullanarak iş emri ekleyebilirsiniz.
                                </Typography>
                            ) : (
                                <Grid container spacing={2}>
                                    {selectedIsEmirleri.map((isEmri) => {
                                        const emriId = String(isEmri.id || isEmri.is_emri_id); // ID'yi normalize et
                                        return (
                                            <Grid item xs={12} sm={6} md={4} key={`aktif-ie-${emriId}`}>
                                                <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                    <Box onMouseEnter={(e) => handleImagePreviewOpen(e, parcaGorselleri[emriId] || placeholderImage)} onMouseMove={handleImagePreviewMove} onMouseLeave={scheduleImagePreviewClose}>
                                                    <CardMedia
                                                        component="img"
                                                        height="120"
                                                        image={parcaGorselleri[emriId] || placeholderImage}
                                                        alt={isEmri.parca?.parca_adi || isEmri.is_adi}
                                                        sx={{ objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            console.log('İş emri resim yüklenemedi:', e.target.src);
                                                            e.target.src = placeholderImage;
                                                        }}
                                                    />
                                                    </Box>
                                                    <CardContent sx={{ flexGrow: 1 }}>
                                                        <Typography variant="subtitle1" fontWeight="bold">
                                                            {isEmri.is_emri_no}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {isEmri.is_adi || 'İş adı belirtilmemiş'}
                                                        </Typography>
                                                        {isEmri.parca_kodu && (
                                                            <Typography variant="body2">
                                                                Parça: {isEmri.parca_kodu}
                                                            </Typography>
                                                        )}
                                                        <Typography variant="body2">
                                                            Miktar: {isEmri.adet || 0} adet
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                                                            <Chip 
                                                                label={isEmri.durum || 'Beklemede'} 
                                                                size="small" 
                                                                color="primary"
                                                            />
                                                        </Box>
                                                    </CardContent>
                                                    <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                            <Tooltip title="İş Emrini Düzenle">
                                                                <IconButton 
                                                                    color="primary" 
                                                                    size="small"
                                                                    onClick={() => handleIsEmriDuzenle(isEmri)}
                                                                >
                                                                    <EditIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Tezgah Tanımla">
                                                                <IconButton 
                                                                    color="info" 
                                                                    size="small"
                                                                    onClick={(event) => handleTezgahTanimla(event, isEmri)}
                                                                >
                                                                    <FactoryIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="İşi Tamamlandı Yap">
                                                                <IconButton 
                                                                    color="success" 
                                                                    size="small"
                                                                    onClick={() => handleIsTamamla(isEmri)}
                                                                    disabled={isStatusCompleted(isEmri.durum)}
                                                                >
                                                                    <AssignmentTurnedInIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Fason İş Oluştur">
                                                                <IconButton 
                                                                    color="secondary" 
                                                                    size="small"
                                                                    onClick={() => handleFasonIsOlustur(isEmri)}
                                                                >
                                                                    <GroupIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                        <IconButton 
                                                            color="error" 
                                                            onClick={() => handleIsEmriCikart(emriId)}
                                                            size="small"
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Box>
                                                </Card>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tamamlanan İş Emirleri */}
                    {tamamlananIsEmirleri.length > 0 && (
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon color="success" />
                                    Tamamlanan İş Emirleri ({tamamlananIsEmirleri.length})
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                
                                <Grid container spacing={2}>
                                    {tamamlananIsEmirleri.map((isEmri) => {
                                        const emriId = String(isEmri.id || isEmri.is_emri_id); // ID'yi normalize et
                                        return (
                                            <Grid item xs={12} sm={6} md={4} key={`tamamlanan-ie-${emriId}`}>
                                                <Card variant="outlined" sx={{ 
                                                    height: '100%', 
                                                    display: 'flex', 
                                                    flexDirection: 'column',
                                                    backgroundColor: '#f8fff8',
                                                    borderColor: '#4caf50'
                                                }}>
                                                    <Box onMouseEnter={(e) => handleImagePreviewOpen(e, parcaGorselleri[emriId] || placeholderImage)} onMouseMove={handleImagePreviewMove} onMouseLeave={scheduleImagePreviewClose}>
                                                    <CardMedia
                                                        component="img"
                                                        height="120"
                                                        image={parcaGorselleri[emriId] || placeholderImage}
                                                        alt={isEmri.parca?.parca_adi || isEmri.is_adi}
                                                        sx={{ objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            e.target.src = placeholderImage;
                                                        }}
                                                    />
                                                    </Box>
                                                    <CardContent sx={{ flexGrow: 1 }}>
                                                        <Typography variant="subtitle1" fontWeight="bold">
                                                            {isEmri.is_emri_no}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {isEmri.is_adi || 'İş adı belirtilmemiş'}
                                                        </Typography>
                                                        {isEmri.parca_kodu && (
                                                            <Typography variant="body2">
                                                                Parça: {isEmri.parca_kodu}
                                                            </Typography>
                                                        )}
                                                        <Typography variant="body2">
                                                            Miktar: {isEmri.adet || 0} adet
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                                                            <Chip 
                                                                label="Tamamlandı" 
                                                                size="small" 
                                                                color="success"
                                                                icon={<CheckCircleIcon />}
                                                            />
                                                        </Box>
                                                    </CardContent>
                                                    <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
                                                        <Tooltip title="İş Emri Detayları">
                                                            <IconButton 
                                                                color="success" 
                                                                size="small"
                                                                onClick={() => handleIsEmriDetayGoster(isEmri)}
                                                            >
                                                                <WorkIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </Card>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {activeTab === 1 && (
                <>
                    {/* Fason Ekle Butonu */}
                    <Box sx={{ mb: 3 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleFasonEkleClick}
                            size="large"
                            color="secondary"
                        >
                            Fason İşi Ekle
                        </Button>
                    </Box>

                    {/* Seçilen Fason İşleri */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Seçilen Fason İşleri ({selectedFasonlar.length})
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            
                            {selectedFasonlar.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                    Henüz fason işi eklenmedi. Yukarıdaki "Fason İşi Ekle" butonunu kullanarak fason işi ekleyebilirsiniz.
                                </Typography>
                            ) : (
                                <Grid container spacing={2}>
                                    {selectedFasonlar.map((fason) => {
                                        const fasonId = String(fason.fason_is_emri_id); // Doğru ID field'ı kullan
                                        const fasonGorseli = parcaGorselleri[fasonId];
                                        console.log(`Render Fason ${fasonId}: Görsel = ${fasonGorseli}, Parça = ${fason.parca_kodu}, Firma = ${fason.firma_adi}`);
                                        
                                        return (
                                            <Grid item xs={12} sm={6} md={4} key={`aktif-fason-${fasonId}`}>
                                                <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                    <CardMedia
                                                        component="img"
                                                        height="120"
                                                        image={fasonGorseli || placeholderImage}
                                                        alt={fason.parca?.parca_adi || fason.is_tanimi}
                                                        sx={{ objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            console.log(`Fason ${fasonId} resim yüklenemedi:`, e.target.src);
                                                            e.target.src = placeholderImage;
                                                        }}
                                                    />
                                                    <CardContent sx={{ flexGrow: 1 }}>
                                                        <Typography variant="subtitle1" fontWeight="bold">
                                                            {fason.firma_adi}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {fason.is_tanimi || 'İş tanımı belirtilmemiş'}
                                                        </Typography>
                                                        {fason.parca_kodu && (
                                                            <Typography variant="body2">
                                                                Parça: {fason.parca_kodu}
                                                            </Typography>
                                                        )}
                                                        <Typography variant="body2">
                                                            Miktar: {fason.adet || 0} adet
                                                        </Typography>
                                                        {fason.birim_fiyat && (
                                                            <Typography variant="body2">
                                                                Birim Fiyat: {fason.birim_fiyat} ₺
                                                            </Typography>
                                                        )}
                                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                                                            <Chip 
                                                                label={fason.durum || 'Beklemede'} 
                                                                size="small" 
                                                                color="secondary"
                                                            />
                                                            <Chip 
                                                                label="Fason"
                                                                size="small" 
                                                                variant="outlined"
                                                                icon={<BusinessIcon />}
                                                            />
                                                        </Box>
                                                    </CardContent>
                                                    <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                                        <IconButton 
                                                            color="error" 
                                                            onClick={() => {
                                                                console.log(`Silme butonu tıklandı: ${fasonId} (${fason.firma_adi})`);
                                                                handleFasonCikart(fasonId);
                                                            }}
                                                            size="small"
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Box>
                                                </Card>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tamamlanan Fason İşleri */}
                    {tamamlananFasonlar.length > 0 && (
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon color="success" />
                                    Tamamlanan Fason İşleri ({tamamlananFasonlar.length})
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                
                                <Grid container spacing={2}>
                                    {tamamlananFasonlar.map((fason) => {
                                        const fasonId = String(fason.fason_is_emri_id || fason.id); // ID'yi normalize et
                                        return (
                                            <Grid item xs={12} sm={6} md={4} key={`tamamlanan-fason-${fasonId}`}>
                                                <Card variant="outlined" sx={{ 
                                                    height: '100%', 
                                                    display: 'flex', 
                                                    flexDirection: 'column',
                                                    backgroundColor: '#f8fff8',
                                                    borderColor: '#4caf50'
                                                }}>
                                                    <CardMedia
                                                        component="img"
                                                        height="120"
                                                        image={parcaGorselleri[fasonId] || placeholderImage}
                                                        alt={fason.parca?.parca_adi || fason.is_tanimi}
                                                        sx={{ objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            e.target.src = placeholderImage;
                                                        }}
                                                    />
                                                    <CardContent sx={{ flexGrow: 1 }}>
                                                        <Typography variant="subtitle1" fontWeight="bold">
                                                            {fason.firma_adi}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {fason.is_tanimi || 'İş tanımı belirtilmemiş'}
                                                        </Typography>
                                                        {fason.parca_kodu && (
                                                            <Typography variant="body2">
                                                                Parça: {fason.parca_kodu}
                                                            </Typography>
                                                        )}
                                                        <Typography variant="body2">
                                                            Miktar: {fason.adet || 0} adet
                                                        </Typography>
                                                        {fason.birim_fiyat && (
                                                            <Typography variant="body2">
                                                                Birim Fiyat: {fason.birim_fiyat} ₺
                                                            </Typography>
                                                        )}
                                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                                                            <Chip 
                                                                label="Tamamlandı" 
                                                                size="small" 
                                                                color="success"
                                                                icon={<CheckCircleIcon />}
                                                            />
                                                            <Chip 
                                                                label="Fason"
                                                                size="small" 
                                                                variant="outlined"
                                                                icon={<BusinessIcon />}
                                                            />
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {/* Güncelle Butonu */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={saving || !planAdi.trim() || (selectedIsEmirleri.length === 0 && selectedFasonlar.length === 0)}
                    sx={{ minWidth: 250 }}
                >
                    {saving ? 'Güncelleniyor...' : `Karma Planı Güncelle (${toplamOge} öğe)`}
                </Button>
            </Box>

            {/* İş Emri Seçimi Modalı */}
            <UretimPlaniIsEmriSecimiModal
                open={isEmriModalOpen}
                onClose={handleModalClose}
                onSelectIsEmirleri={handleIsEmirleriSec}
            />

            {/* Fason Seçimi Modalı */}
            <UretimPlaniFasonSecimiModal
                open={fasonSecimiModalOpen}
                onClose={handleFasonModalClose}
                onSelect={handleFasonlarSec}
            />

            {/* İş Emri Düzenle Modalı */}
            <Dialog 
                open={editModalOpen} 
                onClose={() => setEditModalOpen(false)} 
                maxWidth="md" 
                fullWidth
            >
                <DialogTitle>İş Emri Düzenle</DialogTitle>
                <DialogContent>
                    {editModalIsEmri && (
                        <IsEmriDuzenleForm
                            open={true}
                            initialData={editModalIsEmri}
                            onClose={() => setEditModalOpen(false)}
                            onSubmit={handleIsEmriUpdate}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Tezgah Seçimi Popover */}
            <Popover
                open={Boolean(tezgahAnchorEl)}
                anchorEl={tezgahAnchorEl}
                onClose={handleTezgahPopoverClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
            >
                <Box sx={{ p: 2, minWidth: 200 }}>
                    <Typography variant="h6" gutterBottom>
                        Tezgah Seç
                    </Typography>
                    {tezgahLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : tezgahListesi.length === 0 ? (
                        <Typography color="text.secondary">
                            Tezgah bulunamadı
                        </Typography>
                    ) : (
                        <List>
                            {Array.isArray(tezgahListesi) && tezgahListesi.map((tezgah) => (
                                <ListItem
                                    key={tezgah.tezgah_id}
                                    button
                                    onClick={() => handleTezgahSec(tezgah)}
                                >
                                    <ListItemIcon>
                                        <FactoryIcon />
                                    </ListItemIcon>
                                    <ListItemText primary={tezgah.tezgah_tanimi} />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>
            </Popover>

            {/* Resim Hover Önizleme - koordinat tabanlı, flicker yok */}
            {isImagePreviewOpen && (
                <Box
                    onMouseEnter={clearCloseTimer}
                    onMouseLeave={scheduleImagePreviewClose}
                    sx={{
                        position: 'fixed',
                        top: imagePreviewPos.top,
                        left: imagePreviewPos.left,
                        zIndex: 1400,
                        p: 1,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        boxShadow: 4,
                        width: 720,
                        maxWidth: '90vw',
                        maxHeight: '90vh'
                    }}
                >
                    <img
                        src={imagePreviewSrc}
                        alt="Önizleme"
                        style={{ display: 'block', width: '100%', height: 'auto', objectFit: 'contain' }}
                        onError={(e) => { e.target.src = placeholderImage; }}
                    />
                </Box>
            )}

            {/* Fason İş Oluşturma Modalı */}
            <Dialog 
                open={fasonCreationModalOpen} 
                onClose={handleFasonCreationModalClose} 
                maxWidth="md" 
                fullWidth
            >
                <DialogTitle>İş Emrinden Fason İş Oluştur</DialogTitle>
                <DialogContent>
                    {selectedIsEmriForFason && (
                        <Box sx={{ mt: 2 }}>
                            <Alert severity="info" sx={{ mb: 3 }}>
                                İş Emri: {selectedIsEmriForFason.is_emri_no} - {selectedIsEmriForFason.is_adi}
                            </Alert>
                            
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Parça Kodu"
                                        value={fasonFormData.parca_kodu}
                                        onChange={(e) => setFasonFormData(prev => ({ ...prev, parca_kodu: e.target.value }))}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Fason Adet"
                                        type="number"
                                        value={fasonFormData.fason_adet}
                                        onChange={(e) => setFasonFormData(prev => ({ ...prev, fason_adet: parseInt(e.target.value) || 1 }))}
                                        required
                                        inputProps={{ min: 1 }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Teslim Tarihi"
                                        type="date"
                                        value={fasonFormData.teslim_tarihi}
                                        onChange={(e) => setFasonFormData(prev => ({ ...prev, teslim_tarihi: e.target.value }))}
                                        InputLabelProps={{ shrink: true }}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="İlgili Kişi"
                                        value={fasonFormData.ilgili_kisi}
                                        onChange={(e) => setFasonFormData(prev => ({ ...prev, ilgili_kisi: e.target.value }))}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Tedarikçi"
                                        value={fasonFormData.tedarikci}
                                        onChange={(e) => setFasonFormData(prev => ({ ...prev, tedarikci: e.target.value }))}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Fason Grup</InputLabel>
                                        <Select
                                            value={fasonFormData.fason_grup_id}
                                            label="Fason Grup"
                                            onChange={(e) => setFasonFormData(prev => ({ ...prev, fason_grup_id: e.target.value }))}
                                        >
                                            <MenuItem value="">Seçiniz...</MenuItem>
                                            {fasonGruplar.map((grup) => (
                                                <MenuItem key={grup.fason_grup_id} value={grup.fason_grup_id}>
                                                    {grup.grup_adi}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Açıklama"
                                        multiline
                                        rows={3}
                                        value={fasonFormData.aciklama}
                                        onChange={(e) => setFasonFormData(prev => ({ ...prev, aciklama: e.target.value }))}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleFasonCreationModalClose}>İptal</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleFasonSave}
                        disabled={!fasonFormData.parca_kodu || !fasonFormData.tedarikci || !fasonFormData.teslim_tarihi || !fasonFormData.ilgili_kisi}
                    >
                        Fason İş Oluştur ve İş Emrini Dönüştür
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={6000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    severity={snackbar.severity}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default UretimPlaniDetay;