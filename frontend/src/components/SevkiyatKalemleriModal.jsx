import React, { useState, useEffect } from 'react';
import { 
    Modal, 
    Form, 
    Button, 
    Row, 
    Col, 
    Table, 
    Badge, 
    Alert,
    Spinner,
    InputGroup,
    Card
} from 'react-bootstrap';
import { 
    FaPlus, 
    FaEdit, 
    FaTrash, 
    FaSearch, 
    FaBox, 
    FaCog 
} from 'react-icons/fa';
import axios from 'axios';


import apiClient from '../utils/apiClient';const SevkiyatKalemleriModal = ({ show, onHide, sevkiyat, onSuccess, onError }) => {
    const [kalemler, setKalemler] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        kalem_tipi: 'stok_karti',
        stok_karti_id: '',
        parca_kodu: '',
        adet: 1,
        birim_fiyati: '',
        aciklama: ''
    });
    const [editingKalem, setEditingKalem] = useState(null);
    const [showForm, setShowForm] = useState(false);
    
    // Arama için state'ler
    const [stokKartlari, setStokKartlari] = useState([]);
    const [parcalar, setParcalar] = useState([]);
    const [aramaMetni, setAramaMetni] = useState('');
    const [aramaLoading, setAramaLoading] = useState(false);
    const [showArama, setShowArama] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

    useEffect(() => {
        if (show && sevkiyat) {
            loadKalemler();
        }
    }, [show, sevkiyat]);

    const loadKalemler = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/sevkiyat/${sevkiyat.id}/kalemler`);
            setKalemler(response.data);
        } catch (err) {
            console.error('Kalemler yüklenirken hata:', err);
            onError('Kalemler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const aramaYap = async (searchTerm) => {
        if (!searchTerm.trim()) {
            setStokKartlari([]);
            setParcalar([]);
            return;
        }

        try {
            setAramaLoading(true);
            
            if (formData.kalem_tipi === 'stok_karti') {
                const response = await axios.get(`${API_BASE_URL}/sevkiyat/stok-kartlari-arama`, {
                    params: { q: searchTerm, limit: 10 }
                });
                setStokKartlari(response.data);
                setParcalar([]);
            } else {
                const response = await axios.get(`${API_BASE_URL}/sevkiyat/parcalar-arama`, {
                    params: { q: searchTerm, limit: 10 }
                });
                setParcalar(response.data);
                setStokKartlari([]);
            }
        } catch (err) {
            console.error('Arama hatası:', err);
        } finally {
            setAramaLoading(false);
        }
    };

    const handleAramaChange = (e) => {
        const value = e.target.value;
        setAramaMetni(value);
        
        // Debounce arama
        clearTimeout(window.aramaTimer);
        window.aramaTimer = setTimeout(() => {
            aramaYap(value);
        }, 300);
    };

    const handleKalemSec = (item) => {
        if (formData.kalem_tipi === 'stok_karti') {
            setFormData(prev => ({
                ...prev,
                stok_karti_id: item.id,
                parca_kodu: ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                parca_kodu: item.parca_kodu,
                stok_karti_id: ''
            }));
        }
        setShowArama(false);
        setAramaMetni('');
        setStokKartlari([]);
        setParcalar([]);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleKalemTipiChange = (e) => {
        setFormData({
            kalem_tipi: e.target.value,
            stok_karti_id: '',
            parca_kodu: '',
            adet: 1,
            birim_fiyati: '',
            aciklama: ''
        });
        setAramaMetni('');
        setStokKartlari([]);
        setParcalar([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            if (editingKalem) {
                // Güncelleme
                await axios.put(`${API_BASE_URL}/sevkiyat/${sevkiyat.id}/kalemler/${editingKalem.id}`, {
                    adet: formData.adet,
                    birim_fiyati: formData.birim_fiyati,
                    aciklama: formData.aciklama
                });
                onSuccess('Kalem başarıyla güncellendi');
            } else {
                // Yeni ekleme
                await axios.post(`${API_BASE_URL}/sevkiyat/${sevkiyat.id}/kalemler`, formData);
                onSuccess('Kalem başarıyla eklendi');
            }
            
            handleFormClose();
            loadKalemler();
        } catch (err) {
            console.error('Kalem kaydetme hatası:', err);
            onError(editingKalem ? 'Kalem güncellenirken hata oluştu' : 'Kalem eklenirken hata oluştu');
        }
    };

    const handleEdit = (kalem) => {
        setEditingKalem(kalem);
        setFormData({
            kalem_tipi: kalem.kalem_tipi,
            stok_karti_id: kalem.stok_karti_id || '',
            parca_kodu: kalem.parca_kodu || '',
            adet: kalem.adet,
            birim_fiyati: kalem.birim_fiyati || '',
            aciklama: kalem.aciklama || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (kalemId) => {
        if (!window.confirm('Bu kalemi silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            await axios.delete(`${API_BASE_URL}/sevkiyat/${sevkiyat.id}/kalemler/${kalemId}`);
            onSuccess('Kalem başarıyla silindi');
            loadKalemler();
        } catch (err) {
            console.error('Kalem silme hatası:', err);
            onError('Kalem silinirken hata oluştu');
        }
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingKalem(null);
        setFormData({
            kalem_tipi: 'stok_karti',
            stok_karti_id: '',
            parca_kodu: '',
            adet: 1,
            birim_fiyati: '',
            aciklama: ''
        });
        setAramaMetni('');
        setStokKartlari([]);
        setParcalar([]);
        setShowArama(false);
    };

    const getKalemTipiBadge = (tip) => {
        return tip === 'stok_karti' ? 
            <Badge bg="primary">Stok Kartı</Badge> : 
            <Badge bg="success">Parça</Badge>;
    };

    const getSelectedKalemInfo = () => {
        if (formData.kalem_tipi === 'stok_karti' && formData.stok_karti_id) {
            const selected = stokKartlari.find(s => s.id == formData.stok_karti_id);
            return selected ? `${selected.olculeriFormatted} - ${selected.malzeme_cinsi}` : 'Seçili';
        }
        
        if (formData.kalem_tipi === 'parca' && formData.parca_kodu) {
            const selected = parcalar.find(p => p.parca_kodu === formData.parca_kodu);
            return selected ? `${selected.parca_kodu} - ${selected.parca_adi}` : 'Seçili';
        }
        
        return 'Seçiniz';
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    Sevkiyat Kalemleri - {sevkiyat?.sevkiyat_no}
                </Modal.Title>
            </Modal.Header>
            
            <Modal.Body>
                {/* Kalem Ekleme Formu */}
                {showForm && (
                    <Card className="mb-3">
                        <Card.Header>
                            <h6 className="mb-0">
                                {editingKalem ? 'Kalem Düzenle' : 'Yeni Kalem Ekle'}
                            </h6>
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleSubmit}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Kalem Tipi</Form.Label>
                                            <Form.Select
                                                name="kalem_tipi"
                                                value={formData.kalem_tipi}
                                                onChange={handleKalemTipiChange}
                                                disabled={editingKalem}
                                            >
                                                <option value="stok_karti">Stok Kartı</option>
                                                <option value="parca">Parça</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Adet</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="adet"
                                                value={formData.adet}
                                                onChange={handleInputChange}
                                                min="1"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {!editingKalem && (
                                    <Row>
                                        <Col md={12}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>
                                                    {formData.kalem_tipi === 'stok_karti' ? 'Stok Kartı' : 'Parça'} Seç
                                                </Form.Label>
                                                <InputGroup>
                                                    <Button 
                                                        variant="outline-secondary"
                                                        onClick={() => setShowArama(!showArama)}
                                                    >
                                                        <FaSearch /> Ara
                                                    </Button>
                                                    <Form.Control
                                                        type="text"
                                                        value={getSelectedKalemInfo()}
                                                        readOnly
                                                        placeholder={`${formData.kalem_tipi === 'stok_karti' ? 'Stok kartı' : 'Parça'} seçiniz`}
                                                    />
                                                </InputGroup>
                                            </Form.Group>

                                            {showArama && (
                                                <div className="border p-3 mb-3 rounded">
                                                    <Form.Group className="mb-2">
                                                        <Form.Control
                                                            type="text"
                                                            placeholder={`${formData.kalem_tipi === 'stok_karti' ? 'Stok kartı' : 'Parça'} ara...`}
                                                            value={aramaMetni}
                                                            onChange={handleAramaChange}
                                                        />
                                                    </Form.Group>
                                                    
                                                    {aramaLoading && (
                                                        <div className="text-center">
                                                            <Spinner animation="border" size="sm" />
                                                        </div>
                                                    )}
                                                    
                                                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                        {formData.kalem_tipi === 'stok_karti' ? 
                                                            stokKartlari.map(stok => (
                                                                <div 
                                                                    key={stok.id}
                                                                    className="p-2 border-bottom cursor-pointer hover-bg-light"
                                                                    onClick={() => handleKalemSec(stok)}
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    <strong>{stok.olculeriFormatted}</strong><br />
                                                                    <small>{stok.malzeme_cinsi} - Stok: {stok.adet}</small>
                                                                </div>
                                                            )) :
                                                            parcalar.map(parca => (
                                                                <div 
                                                                    key={parca.parca_kodu}
                                                                    className="p-2 border-bottom cursor-pointer hover-bg-light"
                                                                    onClick={() => handleKalemSec(parca)}
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    <strong>{parca.parca_kodu}</strong><br />
                                                                    <small>{parca.parca_adi} - Stok: {parca.stok_adeti}</small>
                                                                </div>
                                                            ))
                                                        }
                                                        
                                                        {aramaMetni && !aramaLoading && 
                                                         (stokKartlari.length === 0 && parcalar.length === 0) && (
                                                            <div className="text-center text-muted p-2">
                                                                Sonuç bulunamadı
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </Col>
                                    </Row>
                                )}

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Birim Fiyatı</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                name="birim_fiyati"
                                                value={formData.birim_fiyati}
                                                onChange={handleInputChange}
                                                placeholder="İsteğe bağlı"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Açıklama</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="aciklama"
                                                value={formData.aciklama}
                                                onChange={handleInputChange}
                                                placeholder="İsteğe bağlı"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <div className="d-flex gap-2">
                                    <Button type="submit" variant="primary">
                                        {editingKalem ? 'Güncelle' : 'Ekle'}
                                    </Button>
                                    <Button type="button" variant="secondary" onClick={handleFormClose}>
                                        İptal
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                )}

                {/* Kalem Listesi */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6>Sevkiyat Kalemleri ({kalemler.length})</h6>
                    {!showForm && (
                        <Button variant="success" size="sm" onClick={() => setShowForm(true)}>
                            <FaPlus /> Yeni Kalem
                        </Button>
                    )}
                </div>

                {loading ? (
                    <div className="text-center">
                        <Spinner animation="border" />
                        <p className="mt-2">Kalemler yükleniyor...</p>
                    </div>
                ) : kalemler.length === 0 ? (
                    <Alert variant="info">
                        Bu sevkiyata henüz kalem eklenmemiş.
                    </Alert>
                ) : (
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Tip</th>
                                <th>Kalem</th>
                                <th>Adet</th>
                                <th>Birim Fiyat</th>
                                <th>Toplam</th>
                                <th>Mevcut Stok</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {kalemler.map(kalem => (
                                <tr key={kalem.id}>
                                    <td>{getKalemTipiBadge(kalem.kalem_tipi)}</td>
                                    <td>
                                        <div>
                                            <strong>{kalem.kalem_adi}</strong>
                                            {kalem.kalem_detay && (
                                                <div>
                                                    <small className="text-muted">{kalem.kalem_detay}</small>
                                                </div>
                                            )}
                                            {kalem.aciklama && (
                                                <div>
                                                    <small className="text-info">{kalem.aciklama}</small>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>{kalem.adet}</td>
                                    <td>
                                        {kalem.birim_fiyati ? `₺${Number(kalem.birim_fiyati).toFixed(2)}` : '-'}
                                    </td>
                                    <td>
                                        {kalem.toplam_fiyat ? `₺${Number(kalem.toplam_fiyat).toFixed(2)}` : '-'}
                                    </td>
                                    <td>
                                        <span className={kalem.mevcut_stok <= 0 ? 'text-danger' : 'text-success'}>
                                            {kalem.mevcut_stok || 0}
                                        </span>
                                    </td>
                                    <td>
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            className="me-1"
                                            onClick={() => handleEdit(kalem)}
                                        >
                                            <FaEdit />
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleDelete(kalem.id)}
                                        >
                                            <FaTrash />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Modal.Body>
            
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Kapat
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default SevkiyatKalemleriModal;
