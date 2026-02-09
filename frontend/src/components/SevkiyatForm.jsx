// Sevkiyat Form Bileşeni
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { FaPlus, FaImage } from 'react-icons/fa';
import axios from 'axios';
import FirmaEkleModal from './FirmaEkleModal';
import LokasyonEkleModal from './LokasyonEkleModal';
import SevkiyatResimModal from './SevkiyatResimModal';
import StokKartiSecimModal from './StokKartiSecimModal';
import ParcaSecimFormu from './ParcaSecimFormu';

const SevkiyatForm = ({ show, onHide, sevkiyat, onSuccess, onError }) => {
    const [formData, setFormData] = useState({
        tip: 'gelen',
        firma_id: '',
        lokasyon_id: '',
        tarih: '',
        durum: 'beklemede',
        aciklama: ''
    });
    
    // Kalem bilgileri için state'ler
    const [kalemData, setKalemData] = useState({
        kalem_tipi: '', // 'stok_karti' veya 'parca'
        secilen_stok_karti: null,
        secilen_parca: null,
        adet: null
    });
    
    // Modal state'leri
    const [stokKartiModalOpen, setStokKartiModalOpen] = useState(false);
    const [parcaSecimModalOpen, setParcaSecimModalOpen] = useState(false);
    
    const [firmalar, setFirmalar] = useState([]);
    const [lokasyonlar, setLokasyonlar] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showFirmaModal, setShowFirmaModal] = useState(false);
    const [showLokasyonModal, setShowLokasyonModal] = useState(false);
    const [showResimModal, setShowResimModal] = useState(false);
    const [kaydedilenSevkiyat, setKaydedilenSevkiyat] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

    useEffect(() => {
        if (show) {
            loadFirmalar();
            loadLokasyonlar();
            
            if (sevkiyat) {
                // Düzenleme modu
                setFormData({
                    tip: sevkiyat.tip,
                    firma_id: sevkiyat.firma_id,
                    lokasyon_id: sevkiyat.lokasyon_id,
                    tarih: new Date(sevkiyat.tarih).toISOString().slice(0, 16), // datetime-local format
                    durum: sevkiyat.durum,
                    aciklama: sevkiyat.aciklama || ''
                });
                
                // Mevcut kalemleri yükle
                loadSevkiyatKalemleri(sevkiyat.id);
            } else {
                // Yeni kayıt modu
                const now = new Date();
                now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Timezone düzeltmesi
                setFormData({
                    tip: 'gelen',
                    firma_id: '',
                    lokasyon_id: '',
                    tarih: now.toISOString().slice(0, 16),
                    durum: 'beklemede',
                    aciklama: ''
                });
                
                // Kalem verilerini temizle
                setKalemData({
                    kalem_tipi: '',
                    secilen_stok_karti: null,
                    secilen_parca: null,
                    adet: null
                });
            }
            setErrors({});
        }
    }, [show, sevkiyat]);

    const loadFirmalar = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/firmalar?durum=aktif`);
            setFirmalar(response.data.data || response.data);
        } catch (err) {
            console.error('Firmalar yüklenirken hata:', err);
            onError('Firmalar yüklenemedi');
        }
    };

    const loadLokasyonlar = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/sevkiyat/lokasyonlar?aktif=true`);
            setLokasyonlar(response.data);
        } catch (err) {
            console.error('Lokasyonlar yüklenirken hata:', err);
            onError('Lokasyonlar yüklenemedi');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Hata temizle
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.tip) {
            newErrors.tip = 'Sevkiyat tipi seçiniz';
        }

        if (!formData.firma_id) {
            newErrors.firma_id = 'Firma seçiniz';
        }

        if (!formData.lokasyon_id) {
            newErrors.lokasyon_id = 'Lokasyon seçiniz';
        }

        if (!formData.tarih) {
            newErrors.tarih = 'Tarih ve saat giriniz';
        }

        if (!formData.durum) {
            newErrors.durum = 'Durum seçiniz';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Stok kartı seçme fonksiyonu
    const handleStokKartiSec = (stokKarti) => {
        setKalemData({
            kalem_tipi: 'stok_karti',
            secilen_stok_karti: stokKarti,
            secilen_parca: null,
            adet: kalemData.adet
        });
        setStokKartiModalOpen(false);
    };

    // Parça seçme fonksiyonu
    const handleParcaSec = (parca) => {
        setKalemData({
            kalem_tipi: 'parca',
            secilen_stok_karti: null,
            secilen_parca: parca,
            adet: kalemData.adet
        });
        setParcaSecimModalOpen(false);
    };

    // Kalem temizleme fonksiyonu
    const handleKalemTemizle = () => {
        setKalemData({
            kalem_tipi: '',
            secilen_stok_karti: null,
            secilen_parca: null,
            adet: null
        });
    };

    // Mevcut sevkiyat kalemlerini yükle
    const loadSevkiyatKalemleri = async (sevkiyatId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/sevkiyat-kalemleri/${sevkiyatId}/kalemler`);
            const kalemler = response.data;
            
            if (kalemler && kalemler.length > 0) {
                const kalem = kalemler[0]; // İlk kalemi al (basit versiyonda tek kalem)
                
                if (kalem.kalem_tipi === 'stok_karti') {
                    setKalemData({
                        kalem_tipi: 'stok_karti',
                        secilen_stok_karti: {
                            id: kalem.stok_karti_id,
                            kesit: kalem.kalem_adi,
                            malzeme_cinsi: kalem.kalem_detay,
                            olculeriFormatted: kalem.kalem_adi
                        },
                        secilen_parca: null,
                        adet: kalem.miktar || kalem.adet
                    });
                } else if (kalem.kalem_tipi === 'parca') {
                    setKalemData({
                        kalem_tipi: 'parca',
                        secilen_stok_karti: null,
                        secilen_parca: {
                            parca_kodu: kalem.parca_kodu,
                            parca_adi: kalem.kalem_adi
                        },
                        adet: kalem.miktar || kalem.adet
                    });
                }
            }
        } catch (error) {
            console.error('Sevkiyat kalemleri yüklenirken hata:', error);
            // Hata durumunda sessizce devam et
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        
        try {
            const submitData = {
                ...formData,
                olusturan_kullanici: 'System User' // Şimdilik sabit kullanıcı, daha sonra authentication'dan alınacak
            };
            
            let sevkiyatData;
            
            if (sevkiyat) {
                // Güncelleme
                await axios.put(`${API_BASE_URL}/sevkiyat/${sevkiyat.id}`, submitData);
                sevkiyatData = { ...sevkiyat, ...submitData };
            } else {
                // Yeni kayıt
                const response = await axios.post(`${API_BASE_URL}/sevkiyat`, submitData);
                sevkiyatData = response.data.sevkiyat || response.data;
                setKaydedilenSevkiyat(sevkiyatData);
            }
            
            // Eğer kalem seçilmişse, kalemi kaydet
            if (kalemData.secilen_stok_karti || kalemData.secilen_parca) {
                const kalemSubmitData = {
                    sevkiyat_id: sevkiyatData.id,
                    kalem_tipi: kalemData.kalem_tipi,
                    adet: kalemData.adet
                };
                
                if (kalemData.kalem_tipi === 'stok_karti') {
                    kalemSubmitData.stok_karti_id = kalemData.secilen_stok_karti.id;
                } else if (kalemData.kalem_tipi === 'parca') {
                    kalemSubmitData.parca_kodu = kalemData.secilen_parca.parca_kodu || kalemData.secilen_parca.parcaKodu;
                }
                
                await axios.post(`${API_BASE_URL}/sevkiyat-kalemleri`, kalemSubmitData);
            }
            
            onSuccess();
            
            if (!sevkiyat) {
                // Yeni sevkiyat için resim ekleme seçeneği sun
                if (window.confirm('Sevkiyat başarıyla kaydedildi. Resim eklemek ister misiniz?')) {
                    setShowResimModal(true);
                } else {
                    onHide();
                }
            } else {
                onHide();
            }
        } catch (err) {
            console.error('Sevkiyat kaydedilirken hata:', err);
            
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                onError(err.response?.data?.error || 'Sevkiyat kaydedilemedi');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            tip: 'gelen',
            firma_id: '',
            lokasyon_id: '',
            tarih: '',
            durum: 'beklemede',
            aciklama: ''
        });
        setErrors({});
        setKaydedilenSevkiyat(null);
        onHide();
    };

    const handleFirmaEklendi = () => {
        setShowFirmaModal(false);
        loadFirmalar(); // Firma listesini yenile
    };

    const handleLokasyonEklendi = () => {
        setShowLokasyonModal(false);
        loadLokasyonlar(); // Lokasyon listesini yenile
    };

    return (
        <>
        <Modal show={show} onHide={handleClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    {sevkiyat ? 'Sevkiyat Düzenle' : 'Yeni Sevkiyat'}
                </Modal.Title>
            </Modal.Header>
            
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Sevkiyat Tipi *</Form.Label>
                                <Form.Select
                                    name="tip"
                                    value={formData.tip}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.tip}
                                >
                                    <option value="">Tip Seçiniz</option>
                                    <option value="gelen">Gelen Sevkiyat</option>
                                    <option value="giden">Giden Sevkiyat</option>
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.tip}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Durum *</Form.Label>
                                <Form.Select
                                    name="durum"
                                    value={formData.durum}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.durum}
                                >
                                    <option value="">Durum Seçiniz</option>
                                    <option value="beklemede">Beklemede</option>
                                    <option value="tamamlandi">Tamamlandı</option>
                                    <option value="iptal">İptal</option>
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.durum}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <Form.Label>Firma *</Form.Label>
                                    <Button
                                        variant="outline-success"
                                        size="sm"
                                        onClick={() => setShowFirmaModal(true)}
                                    >
                                        <FaPlus className="me-1" />
                                        Yeni Firma
                                    </Button>
                                </div>
                                <Form.Select
                                    name="firma_id"
                                    value={formData.firma_id}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.firma_id}
                                >
                                    <option value="">Firma Seçiniz</option>
                                    {firmalar.map(firma => (
                                        <option key={firma.id} value={firma.id}>
                                            {firma.firma_adi}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.firma_id}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <Form.Label>Lokasyon *</Form.Label>
                                    <Button
                                        variant="outline-success"
                                        size="sm"
                                        onClick={() => setShowLokasyonModal(true)}
                                    >
                                        <FaPlus className="me-1" />
                                        Yeni Lokasyon
                                    </Button>
                                </div>
                                <Form.Select
                                    name="lokasyon_id"
                                    value={formData.lokasyon_id}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.lokasyon_id}
                                >
                                    <option value="">Lokasyon Seçiniz</option>
                                    {lokasyonlar.map(lokasyon => (
                                        <option key={lokasyon.id} value={lokasyon.id}>
                                            {lokasyon.lokasyon_adi}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.lokasyon_id}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label>Tarih ve Saat *</Form.Label>
                                <Form.Control
                                    type="datetime-local"
                                    name="tarih"
                                    value={formData.tarih}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.tarih}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.tarih}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label>Açıklama</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="aciklama"
                                    value={formData.aciklama}
                                    onChange={handleInputChange}
                                    placeholder="Sevkiyat ile ilgili açıklama..."
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* Kalem Seçimi Bölümü */}
                    <Row className="mb-4">
                        <Col md={12}>
                            <h6 className="mb-3">Kalem Bilgileri</h6>
                        </Col>
                        
                        {/* Stok Kartı Seçimi */}
                        <Col md={5}>
                            <div className="border rounded p-3 h-100">
                                <h6 className="text-center mb-3">Stok Kartı</h6>
                                         {kalemData.secilen_stok_karti ? (
                            <div className="selected-item">
                                <div className="border rounded p-2 mb-2 bg-light">
                                    <small className="text-muted">Seçilen Stok Kartı:</small>
                                    <div><strong>{kalemData.secilen_stok_karti.kesit || kalemData.secilen_stok_karti.malzeme_cinsi}</strong></div>
                                    <div className="text-muted">{kalemData.secilen_stok_karti.malzeme_cinsi}</div>
                                    <div className="text-muted">{kalemData.secilen_stok_karti.olculeriFormatted || kalemData.secilen_stok_karti.kesit}</div>
                                </div>
                                <Button 
                                    variant="outline-danger" 
                                    size="sm" 
                                    onClick={handleKalemTemizle}
                                    className="w-100"
                                >
                                    Kaldır
                                </Button>
                            </div>
                                ) : (
                                    <div>                        <Button 
                            variant="outline-primary" 
                            onClick={() => setStokKartiModalOpen(true)}
                            disabled={kalemData.kalem_tipi === 'parca'}
                            className="w-100 mb-2"
                        >
                            Malzeme Stok Kartı Ekle / Değiştir
                        </Button>
                                    </div>
                                )}
                            </div>
                        </Col>

                        {/* Orta Alan */}
                        <Col md={2} className="d-flex align-items-center justify-content-center">
                            <div className="text-center">
                                <strong>VEYA</strong>
                            </div>
                        </Col>

                        {/* Parça Seçimi */}
                        <Col md={5}>
                            <div className="border rounded p-3 h-100">
                                <h6 className="text-center mb-3">Parça</h6>
                                         {kalemData.secilen_parca ? (
                            <div className="selected-item">
                                <div className="border rounded p-2 mb-2 bg-light">
                                    <small className="text-muted">Seçilen Parça:</small>
                                    <div><strong>{kalemData.secilen_parca.parca_kodu || kalemData.secilen_parca.parcaKodu}</strong></div>
                                    <div className="text-muted">{kalemData.secilen_parca.parca_adi || kalemData.secilen_parca.parcaAdi}</div>
                                </div>
                                <Button 
                                    variant="outline-danger" 
                                    size="sm" 
                                    onClick={handleKalemTemizle}
                                    className="w-100"
                                >
                                    Kaldır
                                </Button>
                            </div>
                                ) : (
                                    <div>                        <Button 
                            variant="outline-success" 
                            onClick={() => setParcaSecimModalOpen(true)}
                            disabled={kalemData.kalem_tipi === 'stok_karti'}
                            className="w-100 mb-2"
                        >
                            Parça Seç
                        </Button>
                                    </div>
                                )}
                            </div>
                        </Col>
                    </Row>

                    {/* Adet Girişi */}
                    {(kalemData.secilen_stok_karti || kalemData.secilen_parca) && (
                        <Row className="mb-3">
                            <Col md={4} className="offset-md-4">
                                <Form.Group>
                                    <Form.Label>Adet</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={kalemData.adet}
                                        onChange={(e) => setKalemData({
                                            ...kalemData,
                                            adet: parseInt(e.target.value) || 1
                                        })}
                                        className="text-center"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    )}

                    {/* Yeni sevkiyat için resim ekleme seçeneği */}
                    {!sevkiyat && (
                        <Row className="mb-3">
                            <Col>
                                <Alert variant="info">
                                    <strong>İpucu:</strong> Sevkiyat kaydedildikten sonra resim ekleme seçeneği sunulacak.
                                </Alert>
                            </Col>
                        </Row>
                    )}

                    {sevkiyat && (
                        <>
                            <Alert variant="info">
                                <strong>Sevkiyat No:</strong> {sevkiyat.sevkiyat_no}
                                <br />
                                <strong>Oluşturulma:</strong> {new Date(sevkiyat.olusturulma_tarihi).toLocaleString('tr-TR')}
                                {sevkiyat.guncelleme_tarihi && (
                                    <>
                                        <br />
                                        <strong>Son Güncelleme:</strong> {new Date(sevkiyat.guncelleme_tarihi).toLocaleString('tr-TR')}
                                    </>
                                )}
                            </Alert>
                            
                            <Row className="mb-3">
                                <Col md={12}>
                                    <Button
                                        variant="outline-primary"
                                        onClick={() => setShowResimModal(true)}
                                        className="w-100"
                                    >
                                        <FaImage className="me-2" />
                                        Resim Yönetimi
                                    </Button>
                                </Col>
                            </Row>
                        </>
                    )}
                </Modal.Body>
                
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={loading}>
                        İptal
                    </Button>
                    <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
                                Kaydediliyor...
                            </>
                        ) : (
                            sevkiyat ? 'Güncelle' : 'Kaydet'
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>

        {/* Firma Ekleme Modal */}
        <FirmaEkleModal
            show={showFirmaModal}
            onHide={() => setShowFirmaModal(false)}
            onSuccess={handleFirmaEklendi}
            onError={onError}
        />

        {/* Lokasyon Ekleme Modal */}
        <LokasyonEkleModal
            show={showLokasyonModal}
            onHide={() => setShowLokasyonModal(false)}
            onSuccess={handleLokasyonEklendi}
            onError={onError}
        />

        {/* Resim Yönetimi Modal */}
        {(sevkiyat || kaydedilenSevkiyat) && (
            <SevkiyatResimModal
                show={showResimModal}
                onHide={() => {
                    setShowResimModal(false);
                    if (kaydedilenSevkiyat) {
                        // Yeni sevkiyat için resim modal'ı kapandığında ana modal'ı da kapat
                        handleClose();
                    }
                }}
                sevkiyat={sevkiyat || kaydedilenSevkiyat}
                onSuccess={() => {
                    // Resim işlemi başarılı mesajı göster
                }}
                onError={onError}
            />
        )}

        {/* Stok Kartı Seçim Modal */}
        <StokKartiSecimModal
            open={stokKartiModalOpen}
            onClose={() => setStokKartiModalOpen(false)}
            onSelect={handleStokKartiSec}
            selectedStokKarti={kalemData.secilen_stok_karti}
        />

        {/* Parça Seçim Modal */}
        <ParcaSecimFormu
            open={parcaSecimModalOpen}
            onClose={() => setParcaSecimModalOpen(false)}
            onSec={handleParcaSec}
        />
        </>
    );
};

export default SevkiyatForm;
