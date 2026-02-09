// Lokasyon Ekleme Modal Bileşeni
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import axios from 'axios';


import apiClient from '../utils/apiClient';const LokasyonEkleModal = ({ show, onHide, onSuccess, onError, lokasyon }) => {
    const [formData, setFormData] = useState({
        lokasyon_adi: '',
        tip: 'ic',
        adres: '',
        aktif: true
    });
    
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

    // Form verilerini lokasyon prop'una göre ayarla
    useEffect(() => {
        if (show) {
            if (lokasyon) {
                // Düzenleme modu
                setFormData({
                    lokasyon_adi: lokasyon.lokasyon_adi,
                    tip: lokasyon.tip,
                    adres: lokasyon.adres || '',
                    aktif: lokasyon.aktif
                });
            } else {
                // Yeni ekleme modu
                setFormData({
                    lokasyon_adi: '',
                    tip: 'ic',
                    adres: '',
                    aktif: true
                });
            }
            setErrors({});
        }
    }, [show, lokasyon]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
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

        if (!formData.lokasyon_adi.trim()) {
            newErrors.lokasyon_adi = 'Lokasyon adı zorunludur';
        }

        if (!formData.tip) {
            newErrors.tip = 'Lokasyon tipi seçiniz';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        
        try {
            if (lokasyon) {
                // Güncelleme
                await axios.put(`${API_BASE_URL}/sevkiyat/lokasyonlar/${lokasyon.id}`, formData);
            } else {
                // Yeni ekleme
                await axios.post(`${API_BASE_URL}/sevkiyat/lokasyonlar`, formData);
            }
            onSuccess();
            handleClose();
        } catch (err) {
            console.error('Lokasyon oluşturulurken hata:', err);
            
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                onError(err.response?.data?.error || 'Lokasyon oluşturulamadı');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            lokasyon_adi: '',
            tip: 'ic',
            adres: '',
            aktif: true
        });
        setErrors({});
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{lokasyon ? 'Lokasyon Düzenle' : 'Yeni Lokasyon Ekle'}</Modal.Title>
            </Modal.Header>
            
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Lokasyon Adı *</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="lokasyon_adi"
                                    value={formData.lokasyon_adi}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.lokasyon_adi}
                                    placeholder="Lokasyon adını giriniz"
                                    disabled={loading}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.lokasyon_adi}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Lokasyon Tipi *</Form.Label>
                                <Form.Select
                                    name="tip"
                                    value={formData.tip}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.tip}
                                    disabled={loading}
                                >
                                    <option value="">Tip Seçiniz</option>
                                    <option value="ic">İç Lokasyon</option>
                                    <option value="dis">Dış Lokasyon</option>
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.tip}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label>Adres</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="adres"
                                    value={formData.adres}
                                    onChange={handleInputChange}
                                    placeholder="Lokasyon adresi..."
                                    disabled={loading}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="checkbox"
                                    name="aktif"
                                    checked={formData.aktif}
                                    onChange={handleInputChange}
                                    label="Lokasyon aktif durumda"
                                    disabled={loading}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
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
                            lokasyon ? 'Lokasyon Güncelle' : 'Lokasyon Ekle'
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default LokasyonEkleModal;
