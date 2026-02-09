// Sevkiyat Ana Sayfa Bileşeni
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Card, Col, Container, Form, Row, Table, Badge, Alert, Spinner } from 'react-bootstrap';
import SevkiyatForm from './SevkiyatForm';
import SevkiyatResimModal from './SevkiyatResimModal';
import LokasyonYonetimModal from './LokasyonYonetimModal';
import SevkiyatTeslimAlModal from './SevkiyatTeslimAlModal';
import getApiBaseUrl from '../utils/getApiBaseUrl';
// Add: useNavigate importu eklendi
import { useNavigate } from 'react-router-dom';
import { FaFileExcel, FaPlus, FaBuilding, FaMapMarkerAlt, FaImage, FaEdit, FaTrash } from 'react-icons/fa';

const SevkiyatListesi = () => {
    const navigate = useNavigate();
    const [sevkiyatlar, setSevkiyatlar] = useState([]);
    const [firmalar, setFirmalar] = useState([]);
    const [lokasyonlar, setLokasyonlar] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Modal states
    const [showForm, setShowForm] = useState(false);
    const [showResimModal, setShowResimModal] = useState(false);
    const [showLokasyonYonetimModal, setShowLokasyonYonetimModal] = useState(false);
    const [showTeslimAlModal, setShowTeslimAlModal] = useState(false);
    const [editingSevkiyat, setEditingSevkiyat] = useState(null);
    const [selectedSevkiyat, setSelectedSevkiyat] = useState(null);
    
    // Filtreleme states
    const [filters, setFilters] = useState({
        tip: '',
        firma_id: '',
        lokasyon_id: '',
        durum: '',
        tarih_baslangic: '',
        tarih_bitis: ''
    });
    
    // Sayfalama
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });

    const API_BASE_URL = getApiBaseUrl();

    // Veri yükleme
    useEffect(() => {
        loadData();
        loadFirmalar();
        loadLokasyonlar();
    }, [filters, pagination.page]);

    const loadData = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
            });
            
            const response = await axios.get(`${API_BASE_URL}/sevkiyat?${params}`);
            setSevkiyatlar(response.data.data);
            setPagination(response.data.pagination);
        } catch (err) {
            console.error('Sevkiyat listesi yüklenirken hata:', err);
            setError('Sevkiyat listesi yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const loadFirmalar = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/firmalar?durum=aktif`);
            setFirmalar(response.data.data || response.data);
        } catch (err) {
            console.error('Firmalar yüklenirken hata:', err);
        }
    };

    const loadLokasyonlar = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/sevkiyat/lokasyonlar?aktif=true`);
            setLokasyonlar(response.data);
        } catch (err) {
            console.error('Lokasyonlar yüklenirken hata:', err);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, page: 1 })); // İlk sayfaya dön
    };

    const clearFilters = () => {
        setFilters({
            tip: '',
            firma_id: '',
            lokasyon_id: '',
            durum: '',
            tarih_baslangic: '',
            tarih_bitis: ''
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleEdit = (sevkiyat) => {
        setEditingSevkiyat(sevkiyat);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu sevkiyatı silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            await axios.delete(`${API_BASE_URL}/sevkiyat/${id}`);
            setSuccess('Sevkiyat başarıyla silindi');
            loadData();
        } catch (err) {
            console.error('Sevkiyat silinirken hata:', err);
            setError('Sevkiyat silinemedi');
        }
    };

    const handleShowResimler = (sevkiyat) => {
        setSelectedSevkiyat(sevkiyat);
        setShowResimModal(true);
    };

    const handleTeslimAl = (sevkiyat) => {
        setSelectedSevkiyat(sevkiyat);
        setShowTeslimAlModal(true);
    };

    const handleTeslimAlSuccess = (response) => {
        setSuccess(`Sevkiyat ${response.data?.sevkiyat_no || ''} başarıyla teslim alındı`);
        setShowTeslimAlModal(false);
        setSelectedSevkiyat(null);
        loadData(); // Listeyi yenile
    };

    const exportToExcel = async () => {
        try {
            const params = new URLSearchParams({
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
            });
            
            const response = await axios.get(`${API_BASE_URL}/sevkiyat/raporlar/excel?${params}`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `sevkiyat_raporu_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            setSuccess('Excel raporu başarıyla indirildi');
        } catch (err) {
            console.error('Excel export hatası:', err);
            setError('Excel raporu oluşturulamadı');
        }
    };

    const handleTopluSevkiyatOlustur = async () => {
        try {
            const response = await axios.post(`${API_BASE_URL}/toplu-sevkiyat`, {
                olusturan_kullanici: 'web'
            });
            const { id } = response.data;
            navigate(`/sevkiyat/toplu-yeni/${id}`);
        } catch (err) {
            console.error('Toplu sevkiyat oluşturulamadı:', err);
            setError('Toplu sevkiyat oluşturulamadı');
        }
    };

    const getDurumBadge = (durum) => {
        const variants = {
            'taslak': 'secondary',
            'beklemede': 'warning',
            'tamamlandi': 'success',
            'iptal': 'danger'
        };
        
        const labels = {
            'taslak': 'Taslak',
            'beklemede': 'Beklemede',
            'tamamlandi': 'Tamamlandı',
            'iptal': 'İptal'
        };
        
        return <Badge bg={variants[durum] || 'secondary'}>{labels[durum] || durum}</Badge>;
    };

    const getTipBadge = (tip) => {
        return (
            <Badge bg={tip === 'gelen' ? 'info' : 'primary'}>
                {tip === 'gelen' ? 'Gelen' : 'Giden'}
            </Badge>
        );
    };

    return (
        <Container fluid>
            <Row className="mb-4">
                <Col>
                    <h2>Sevkiyat Yönetimi</h2>
                </Col>
            </Row>

            {/* Alerts */}
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                </Alert>
            )}
            
            {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            {/* Filtreleme Paneli */}
            <Card className="mb-3">
                <Card.Header>
                    <h5>Filtreleme ve Arama</h5>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Tip</Form.Label>
                                <Form.Select
                                    name="tip"
                                    value={filters.tip}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Tümü</option>
                                    <option value="gelen">Gelen</option>
                                    <option value="giden">Giden</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Firma</Form.Label>
                                <Form.Select
                                    name="firma_id"
                                    value={filters.firma_id}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Tüm Firmalar</option>
                                    {firmalar.map(firma => (
                                        <option key={firma.id} value={firma.id}>
                                            {firma.firma_adi}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Lokasyon</Form.Label>
                                <Form.Select
                                    name="lokasyon_id"
                                    value={filters.lokasyon_id}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Tüm Lokasyonlar</option>
                                    {lokasyonlar.map(lokasyon => (
                                        <option key={lokasyon.id} value={lokasyon.id}>
                                            {lokasyon.lokasyon_adi}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Durum</Form.Label>
                                <Form.Select
                                    name="durum"
                                    value={filters.durum}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Tüm Durumlar</option>
                                    <option value="taslak">Taslak</option>
                                    <option value="beklemede">Beklemede</option>
                                    <option value="tamamlandi">Tamamlandı</option>
                                    <option value="iptal">İptal</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Başlangıç Tarihi</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="tarih_baslangic"
                                    value={filters.tarih_baslangic}
                                    onChange={handleFilterChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Bitiş Tarihi</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="tarih_bitis"
                                    value={filters.tarih_bitis}
                                    onChange={handleFilterChange}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mt-3">
                        <Col>
                            <Button variant="secondary" onClick={clearFilters} className="me-2">
                                Filtreleri Temizle
                            </Button>
                            <Button variant="success" onClick={exportToExcel}>
                                <FaFileExcel className="me-1" />
                                Excel İndir
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Hızlı Eylem Butonları */}
            <Card className="mb-3">
                <Card.Body>
                    <Button
                        variant="primary"
                        onClick={() => {
                            setEditingSevkiyat(null);
                            setShowForm(true);
                        }}
                        className="me-2"
                    >
                        <FaPlus className="me-1" />
                        Yeni Sevkiyat
                    </Button>
                    <Button
                        variant="success"
                        onClick={handleTopluSevkiyatOlustur}
                        className="me-2"
                    >
                        <FaPlus className="me-1" />
                        Toplu Sevkiyat Oluştur
                    </Button>
                    <Button
                        variant="outline-secondary"
                        onClick={() => navigate('/ic-sevkiyatlar')}
                    >
                        İç Sevkiyatlar
                    </Button>
                    <Button
                        variant="info"
                        onClick={() => navigate('/tedarik/firma-yonetimi')}
                        className="me-2"
                    >
                        <FaBuilding className="me-1" />
                        Firma Yönetimi
                    </Button>
                    <Button
                        variant="warning"
                        onClick={() => setShowLokasyonYonetimModal(true)}
                        className="me-2"
                    >
                        <FaMapMarkerAlt className="me-1" />
                        Lokasyon Yönetimi
                    </Button>
                </Card.Body>
            </Card>

            {/* Sevkiyat Listesi */}
            <Card>
                <Card.Header>
                    <Row>
                        <Col>
                            <h5>Sevkiyat Listesi ({pagination.total} kayıt)</h5>
                        </Col>
                    </Row>
                </Card.Header>
                <Card.Body>
                    {loading ? (
                        <div className="text-center">
                            <Spinner animation="border" />
                            <p className="mt-2">Yükleniyor...</p>
                        </div>
                    ) : (
                        <>
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Sevkiyat No</th>
                                        <th>Tip</th>
                                        <th>Firma</th>
                        <th>Lokasyon</th>
                                        <th>Adet</th>
                                        <th>Tarih</th>
                                        <th>Durum</th>
                                        <th>Resimler</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sevkiyatlar.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="text-center">
                                                Sevkiyat bulunamadı
                                            </td>
                                        </tr>
                                    ) : (
                                        sevkiyatlar.map(sevkiyat => (
                                            <tr key={sevkiyat.id}>
                                                <td>
                                                    <strong>{sevkiyat.sevkiyat_no}</strong>
                                                </td>
                                                <td>{getTipBadge(sevkiyat.tip)}</td>
                                                <td>{sevkiyat.firma_adi}</td>
                                                <td>{sevkiyat.lokasyon_adi}</td>
                                                <td>
                                                    <span className="badge bg-info">
                                                        {parseFloat(sevkiyat.toplam_adet || 0).toLocaleString('tr-TR')}
                                                    </span>
                                                </td>
                                                <td>
                                                    {new Date(sevkiyat.tarih).toLocaleDateString('tr-TR', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </td>
                                                <td>{getDurumBadge(sevkiyat.durum)}</td>
                                                <td>
                                                    <Button
                                                        variant="outline-info"
                                                        size="sm"
                                                        onClick={() => handleShowResimler(sevkiyat)}
                                                        disabled={sevkiyat.resim_sayisi === 0}
                                                    >
                                                        <FaImage className="me-1" />
                                                        {sevkiyat.resim_sayisi}
                                                    </Button>
                                                </td>
                                                <td>
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => handleEdit(sevkiyat)}
                                                        className="me-1"
                                                    >
                                                        <FaEdit />
                                                    </Button>
                                                    {/* Sadece beklemede veya yolda durumundaki sevkiyatlarda teslim alma butonu */}
                                                    {(sevkiyat.durum === 'beklemede' || sevkiyat.durum === 'yolda') && (
                                                        <Button
                                                            variant="outline-success"
                                                            size="sm"
                                                            onClick={() => handleTeslimAl(sevkiyat)}
                                                            className="me-1"
                                                        >
                                                            Teslim Al
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleDelete(sevkiyat.id)}
                                                    >
                                                        <FaTrash />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>

                            {/* Sayfalama */}
                            {pagination.pages > 1 && (
                                <Row className="mt-3">
                                    <Col>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span>
                                                Sayfa {pagination.page} / {pagination.pages}
                                            </span>
                                            <div>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    disabled={pagination.page === 1}
                                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                                    className="me-1"
                                                >
                                                    Önceki
                                                </Button>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    disabled={pagination.page === pagination.pages}
                                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                                >
                                                    Sonraki
                                                </Button>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            )}
                        </>
                    )}
                </Card.Body>
            </Card>

            {/* Sevkiyat Form Modal */}
            <SevkiyatForm
                show={showForm}
                onHide={() => {
                    setShowForm(false);
                    setEditingSevkiyat(null);
                }}
                sevkiyat={editingSevkiyat}
                onSuccess={() => {
                    setSuccess(editingSevkiyat ? 'Sevkiyat başarıyla güncellendi' : 'Sevkiyat başarıyla oluşturuldu');
                    loadData();
                }}
                onError={setError}
            />

            {/* Resim Modal */}
            <SevkiyatResimModal
                show={showResimModal}
                onHide={() => {
                    setShowResimModal(false);
                    setSelectedSevkiyat(null);
                }}
                sevkiyat={selectedSevkiyat}
                onSuccess={() => {
                    setSuccess('Resim işlemi başarılı');
                    loadData(); // Resim sayısını güncellemek için
                }}
                onError={setError}
            />

            {/* Teslim Alma Modal */}
            <SevkiyatTeslimAlModal
                open={showTeslimAlModal}
                onClose={() => {
                    setShowTeslimAlModal(false);
                    setSelectedSevkiyat(null);
                }}
                onSuccess={handleTeslimAlSuccess}
                sevkiyatId={selectedSevkiyat?.id}
            />

            {/* Lokasyon Yönetim Modal */}
            <LokasyonYonetimModal
                show={showLokasyonYonetimModal}
                onHide={() => setShowLokasyonYonetimModal(false)}
                onSuccess={() => {
                    setSuccess('Lokasyon işlemi başarılı');
                    loadLokasyonlar(); // Lokasyon listesini yenile
                }}
                onError={setError}
            />
        </Container>
    );
};

export default SevkiyatListesi;
