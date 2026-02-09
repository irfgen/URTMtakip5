// Firma Yönetim Modal Bileşeni
import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, Form, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import axios from 'axios';
import FirmaEkleModal from './FirmaEkleModal';


import apiClient from '../utils/apiClient';const FirmaYonetimModal = ({ show, onHide, onSuccess, onError }) => {
    const [firmalar, setFirmalar] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showFirmaEkleModal, setShowFirmaEkleModal] = useState(false);
    const [editingFirma, setEditingFirma] = useState(null);
    const [filters, setFilters] = useState({
        tip: '',
        durum: ''
    });

    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

    useEffect(() => {
        if (show) {
            loadFirmalar();
        }
    }, [show, filters]);

    const loadFirmalar = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.tip) params.append('tip', filters.tip);
            if (filters.durum) params.append('durum', filters.durum);
            
            const response = await axios.get(`${API_BASE_URL}/firmalar?${params}`);
            setFirmalar(response.data.data || response.data);
        } catch (err) {
            console.error('Firmalar yüklenirken hata:', err);
            onError('Firmalar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (firma) => {
        setEditingFirma(firma);
        setShowFirmaEkleModal(true);
    };

    const handleDelete = async (id, firmaAdi) => {
        if (!window.confirm(`"${firmaAdi}" firmasını silmek istediğinizden emin misiniz?`)) {
            return;
        }

        try {
            await axios.delete(`${API_BASE_URL}/firmalar/${id}`);
            onSuccess();
            loadFirmalar();
        } catch (err) {
            console.error('Firma silinirken hata:', err);
            onError(err.response?.data?.error || 'Firma silinemedi');
        }
    };

    const handleToggleAktif = async (id, currentDurum) => {
        try {
            const yeniDurum = currentDurum === 'aktif' ? 'pasif' : 'aktif';
            await axios.patch(`${API_BASE_URL}/firmalar/${id}/durum`, { durum: yeniDurum });
            onSuccess();
            loadFirmalar();
        } catch (err) {
            console.error('Firma durumu değiştirilirken hata:', err);
            onError('Firma durumu değiştirilemedi');
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({ tip: '', durum: '' });
    };

    const getTipBadge = (tip) => {
        return (
            <Badge bg={tip === 'ic' ? 'success' : 'primary'}>
                {tip === 'ic' ? 'İç Firma' : 'Dış Firma'}
            </Badge>
        );
    };

    const getAktifBadge = (durum) => {
        return (
            <Badge bg={durum === 'aktif' ? 'success' : 'secondary'}>
                {durum === 'aktif' ? 'Aktif' : 'Pasif'}
            </Badge>
        );
    };

    return (
        <>
            <Modal show={show} onHide={onHide} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>Firma Yönetimi</Modal.Title>
                </Modal.Header>
                
                <Modal.Body>
                    {/* Filtreleme */}
                    <Row className="mb-3">
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Firma Tipi</Form.Label>
                                <Form.Select
                                    name="tip"
                                    value={filters.tip}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Tümü</option>
                                    <option value="ic">İç Firma</option>
                                    <option value="dis">Dış Firma</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Durum</Form.Label>
                                <Form.Select
                                    name="durum"
                                    value={filters.durum}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Tümü</option>
                                    <option value="aktif">Aktif</option>
                                    <option value="pasif">Pasif</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6} className="d-flex align-items-end">
                            <Button variant="secondary" onClick={clearFilters} className="me-2">
                                Temizle
                            </Button>
                            <Button
                                variant="success"
                                onClick={() => {
                                    setEditingFirma(null);
                                    setShowFirmaEkleModal(true);
                                }}
                            >
                                <FaPlus className="me-1" />
                                Yeni Firma
                            </Button>
                        </Col>
                    </Row>

                    {/* Firma Listesi */}
                    {loading ? (
                        <div className="text-center">
                            <Spinner animation="border" />
                            <p className="mt-2">Yükleniyor...</p>
                        </div>
                    ) : (
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>Firma Adı</th>
                                    <th>Tip</th>
                                    <th>Telefon</th>
                                    <th>Yetkili Kişi</th>
                                    <th>Durum</th>
                                    <th>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {firmalar.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center">
                                            Firma bulunamadı
                                        </td>
                                    </tr>
                                ) : (
                                    firmalar.map(firma => (
                                        <tr key={firma.id}>
                                            <td>
                                                <strong>{firma.firma_adi}</strong>
                                                {firma.adres && (
                                                    <small className="d-block text-muted">
                                                        {firma.adres.substring(0, 50)}
                                                        {firma.adres.length > 50 ? '...' : ''}
                                                    </small>
                                                )}
                                            </td>
                                            <td>{getTipBadge(firma.tip)}</td>
                                            <td>{firma.telefon || '-'}</td>
                                            <td>{firma.yetkili_kisi || '-'}</td>
                                            <td>{getAktifBadge(firma.durum)}</td>
                                            <td>
                                                <div className="d-flex gap-1">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => handleEdit(firma)}
                                                        title="Düzenle"
                                                    >
                                                        <FaEdit />
                                                    </Button>
                                                    <Button
                                                        variant={firma.durum === 'aktif' ? "outline-warning" : "outline-success"}
                                                        size="sm"
                                                        onClick={() => handleToggleAktif(firma.id, firma.durum)}
                                                        title={firma.durum === 'aktif' ? "Pasif Yap" : "Aktif Yap"}
                                                    >
                                                        {firma.durum === 'aktif' ? <FaToggleOff /> : <FaToggleOn />}
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleDelete(firma.id, firma.firma_adi)}
                                                        title="Sil"
                                                    >
                                                        <FaTrash />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
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

            {/* Firma Ekleme/Düzenleme Modal */}
            <FirmaEkleModal
                show={showFirmaEkleModal}
                onHide={() => {
                    setShowFirmaEkleModal(false);
                    setEditingFirma(null);
                }}
                firma={editingFirma}
                onSuccess={() => {
                    onSuccess();
                    loadFirmalar();
                }}
                onError={onError}
            />
        </>
    );
};

export default FirmaYonetimModal;
