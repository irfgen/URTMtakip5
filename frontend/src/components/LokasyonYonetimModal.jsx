// Lokasyon Yönetim Modal Bileşeni
import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, Form, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import axios from 'axios';
import LokasyonEkleModal from './LokasyonEkleModal';


import apiClient from '../utils/apiClient';const LokasyonYonetimModal = ({ show, onHide, onSuccess, onError }) => {
    const [lokasyonlar, setLokasyonlar] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showLokasyonEkleModal, setShowLokasyonEkleModal] = useState(false);
    const [editingLokasyon, setEditingLokasyon] = useState(null);
    const [filters, setFilters] = useState({
        tip: '',
        aktif: ''
    });

    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

    useEffect(() => {
        if (show) {
            loadLokasyonlar();
        }
    }, [show, filters]);

    const loadLokasyonlar = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.tip) params.append('tip', filters.tip);
            if (filters.aktif) params.append('aktif', filters.aktif);
            
            const response = await axios.get(`${API_BASE_URL}/sevkiyat/lokasyonlar?${params}`);
            setLokasyonlar(response.data);
        } catch (err) {
            console.error('Lokasyonlar yüklenirken hata:', err);
            onError('Lokasyonlar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (lokasyon) => {
        setEditingLokasyon(lokasyon);
        setShowLokasyonEkleModal(true);
    };

    const handleDelete = async (id, lokasyonAdi) => {
        if (!window.confirm(`"${lokasyonAdi}" lokasyonunu silmek istediğinizden emin misiniz?`)) {
            return;
        }

        try {
            await axios.delete(`${API_BASE_URL}/sevkiyat/lokasyonlar/${id}`);
            onSuccess();
            loadLokasyonlar();
        } catch (err) {
            console.error('Lokasyon silinirken hata:', err);
            onError(err.response?.data?.error || 'Lokasyon silinemedi');
        }
    };

    const handleToggleAktif = async (id) => {
        try {
            await axios.put(`${API_BASE_URL}/sevkiyat/lokasyonlar/${id}/toggle-aktif`);
            onSuccess();
            loadLokasyonlar();
        } catch (err) {
            console.error('Lokasyon durumu değiştirilirken hata:', err);
            onError('Lokasyon durumu değiştirilemedi');
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({ tip: '', aktif: '' });
    };

    const getTipBadge = (tip) => {
        return (
            <Badge bg={tip === 'ic' ? 'success' : 'primary'}>
                {tip === 'ic' ? 'İç Lokasyon' : 'Dış Lokasyon'}
            </Badge>
        );
    };

    const getAktifBadge = (aktif) => {
        return (
            <Badge bg={aktif ? 'success' : 'secondary'}>
                {aktif ? 'Aktif' : 'Pasif'}
            </Badge>
        );
    };

    return (
        <>
            <Modal show={show} onHide={onHide} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>Lokasyon Yönetimi</Modal.Title>
                </Modal.Header>
                
                <Modal.Body>
                    {/* Filtreleme */}
                    <Row className="mb-3">
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Lokasyon Tipi</Form.Label>
                                <Form.Select
                                    name="tip"
                                    value={filters.tip}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Tümü</option>
                                    <option value="ic">İç Lokasyon</option>
                                    <option value="dis">Dış Lokasyon</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Durum</Form.Label>
                                <Form.Select
                                    name="aktif"
                                    value={filters.aktif}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Tümü</option>
                                    <option value="true">Aktif</option>
                                    <option value="false">Pasif</option>
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
                                    setEditingLokasyon(null);
                                    setShowLokasyonEkleModal(true);
                                }}
                            >
                                <FaPlus className="me-1" />
                                Yeni Lokasyon
                            </Button>
                        </Col>
                    </Row>

                    {/* Lokasyon Listesi */}
                    {loading ? (
                        <div className="text-center">
                            <Spinner animation="border" />
                            <p className="mt-2">Yükleniyor...</p>
                        </div>
                    ) : (
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>Lokasyon Adı</th>
                                    <th>Tip</th>
                                    <th>Adres</th>
                                    <th>Durum</th>
                                    <th>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lokasyonlar.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center">
                                            Lokasyon bulunamadı
                                        </td>
                                    </tr>
                                ) : (
                                    lokasyonlar.map(lokasyon => (
                                        <tr key={lokasyon.id}>
                                            <td>
                                                <strong>{lokasyon.lokasyon_adi}</strong>
                                            </td>
                                            <td>{getTipBadge(lokasyon.tip)}</td>
                                            <td>
                                                {lokasyon.adres ? (
                                                    <span title={lokasyon.adres}>
                                                        {lokasyon.adres.substring(0, 50)}
                                                        {lokasyon.adres.length > 50 ? '...' : ''}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td>{getAktifBadge(lokasyon.aktif)}</td>
                                            <td>
                                                <div className="d-flex gap-1">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => handleEdit(lokasyon)}
                                                        title="Düzenle"
                                                    >
                                                        <FaEdit />
                                                    </Button>
                                                    <Button
                                                        variant={lokasyon.aktif ? "outline-warning" : "outline-success"}
                                                        size="sm"
                                                        onClick={() => handleToggleAktif(lokasyon.id)}
                                                        title={lokasyon.aktif ? "Pasif Yap" : "Aktif Yap"}
                                                    >
                                                        {lokasyon.aktif ? <FaToggleOff /> : <FaToggleOn />}
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleDelete(lokasyon.id, lokasyon.lokasyon_adi)}
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

            {/* Lokasyon Ekleme/Düzenleme Modal */}
            <LokasyonEkleModal
                show={showLokasyonEkleModal}
                onHide={() => {
                    setShowLokasyonEkleModal(false);
                    setEditingLokasyon(null);
                }}
                lokasyon={editingLokasyon}
                onSuccess={() => {
                    onSuccess();
                    loadLokasyonlar();
                }}
                onError={onError}
            />
        </>
    );
};

export default LokasyonYonetimModal;
