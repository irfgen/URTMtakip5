// Firma Ekleme Modal Bileşeni
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import axios from 'axios';


import apiClient from '../utils/apiClient';const FirmaEkleModal = ({ show, onHide, onSuccess, onError, firma }) => {
    const [formData, setFormData] = useState({
        firma_adi: '',
        tip: 'dis',
        adres: '',
        telefon: '',
        yetkili_kisi: '',
        aktif: true
    });
    
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

    // Form verilerini firma prop'una göre ayarla
    useEffect(() => {
        if (show) {
            if (firma) {
                // Düzenleme modu
                setFormData({
                    firma_adi: firma.firma_adi,
                    tip: firma.tip,
                    adres: firma.adres || '',
                    telefon: firma.telefon || '',
                    yetkili_kisi: firma.yetkili_kisi || '',
                    aktif: firma.aktif
                });
            } else {
                // Yeni ekleme modu
                setFormData({
                    firma_adi: '',
                    tip: 'dis',
                    adres: '',
                    telefon: '',
                    yetkili_kisi: '',
                    aktif: true
                });
            }
            setErrors({});
        }
    }, [show, firma]);

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

        if (!formData.firma_adi.trim()) {
            newErrors.firma_adi = 'Firma adı zorunludur';
        }

        if (!formData.tip) {
            newErrors.tip = 'Firma tipi seçiniz';
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
            if (firma) {
                // Güncelleme
                await axios.put(`${API_BASE_URL}/firmalar/${firma.id}`, formData);
            } else {
                // Yeni ekleme
                await axios.post(`${API_BASE_URL}/firmalar`, formData);
            }
            onSuccess();
            handleClose();
        } catch (err) {
            console.error('Firma oluşturulurken hata:', err);
            
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                onError(err.response?.data?.error || 'Firma oluşturulamadı');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            firma_adi: '',
            tip: 'dis',
            adres: '',
            telefon: '',
            yetkili_kisi: '',
            aktif: true
        });
        setErrors({});
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{firma ? 'Firma Düzenle' : 'Yeni Firma Ekle'}</Modal.Title>
            </Modal.Header>
            
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Firma Adı *</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="firma_adi"
                                    value={formData.firma_adi}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.firma_adi}
                                    placeholder="Firma adını giriniz"
                                    disabled={loading}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.firma_adi}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Firma Tipi *</Form.Label>
                                <Form.Select
                                    name="tip"
                                    value={formData.tip || 'dis'}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.tip}
                                    disabled={loading}
                                >
                                    <option value="">Tip Seçiniz</option>
                                    <option value="ic">İç Firma</option>
                                    <option value="dis">Dış Firma</option>
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.tip}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Telefon</Form.Label>
                                <Form.Control
                                    type="tel"
                                    name="telefon"
                                    value={formData.telefon}
                                    onChange={handleInputChange}
                                    placeholder="0212 555 0000"
                                    disabled={loading}
                                />
                            </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Yetkili Kişi</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="yetkili_kisi"
                                    value={formData.yetkili_kisi}
                                    onChange={handleInputChange}
                                    placeholder="Yetkili kişi adı"
                                    disabled={loading}
                                />
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
                                    placeholder="Firma adresi..."
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
                                    label="Firma aktif durumda"
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
                            firma ? 'Firma Güncelle' : 'Firma Ekle'
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default FirmaEkleModal;
