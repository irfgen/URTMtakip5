// Sevkiyat Resim Yönetimi Modal Bileşeni
import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Alert, Spinner, Card, Form } from 'react-bootstrap';
import { FaUpload, FaTrash, FaDownload, FaEye } from 'react-icons/fa';
import apiClient from '../utils/apiClient';
import { getFileUploadUrl } from '../utils/getApiBaseUrl';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const SevkiyatResimModal = ({ show, onHide, sevkiyat, onSuccess, onError }) => {
    const [resimler, setResimler] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        if (show && sevkiyat) {
            loadResimler();
        }
    }, [show, sevkiyat]);

    const loadResimler = async () => {
        if (!sevkiyat) return;

        try {
            setLoading(true);
            const response = await apiClient.get(`/sevkiyat/resimler/${sevkiyat.id}/resimler`);
            setResimler(response);
        } catch (err) {
            console.error('Resimler yüklenirken hata:', err);
            onError('Resimler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        
        // Dosya validasyonu
        const validFiles = files.filter(file => {
            const isValidType = file.type.startsWith('image/');
            const isValidSize = file.size <= 500 * 1024 * 1024; // 500MB
            
            if (!isValidType) {
                onError(`${file.name} geçerli bir resim dosyası değil`);
                return false;
            }
            
            if (!isValidSize) {
                onError(`${file.name} dosyası 500MB'dan büyük`);
                return false;
            }
            
            return true;
        });
        
        setSelectedFiles(validFiles);
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            onError('Lütfen en az bir resim seçiniz');
            return;
        }

        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('resimler', file);
        });

        try {
            setUploading(true);
            await axios.post(`${API_BASE_URL}/sevkiyat/resimler/${sevkiyat.id}/resimler`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            setSelectedFiles([]);
            document.getElementById('file-input').value = '';
            loadResimler();
            onSuccess();
        } catch (err) {
            console.error('Resim yükleme hatası:', err);
            onError(err.response?.data?.error || 'Resim yüklenemedi');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (resimId) => {
        if (!window.confirm('Bu resmi silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            await axios.delete(`${API_BASE_URL}/sevkiyat/resimler/${resimId}`);
            loadResimler();
            onSuccess();
        } catch (err) {
            console.error('Resim silme hatası:', err);
            onError('Resim silinemedi');
        }
    };

    const handleDownload = async (resim) => {
        try {
            // resim_yolu'ndan gerçek dosya adını al
            const savedFileName = resim.resim_yolu.split('/').pop();
            const response = await axios.get(`${API_BASE_URL}/sevkiyat/resimler/dosya/${savedFileName}`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', resim.resim_adi); // Orijinal dosya adıyla indir
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Resim indirme hatası:', err);
            onError('Resim indirilemedi');
        }
    };

    const handlePreview = (resim) => {
        // resim_yolu'ndan gerçek dosya adını al
        const savedFileName = resim.resim_yolu.split('/').pop();
        setPreviewImage(`${API_BASE_URL}/sevkiyat/resimler/dosya/${savedFileName}`);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleClose = () => {
        setSelectedFiles([]);
        setPreviewImage(null);
        onHide();
    };

    if (!sevkiyat) return null;

    return (
        <>
            <Modal show={show} onHide={handleClose} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>
                        Resim Yönetimi - {sevkiyat.sevkiyat_no}
                    </Modal.Title>
                </Modal.Header>
                
                <Modal.Body>
                    {/* Resim Yükleme Alanı */}
                    <Card className="mb-4">
                        <Card.Header>
                            <h6>Yeni Resim Yükle</h6>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={8}>
                                    <Form.Group>
                                        <Form.Control
                                            id="file-input"
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            disabled={uploading}
                                        />
                                        <Form.Text className="text-muted">
                                            Maksimum 500MB boyutunda, JPG, PNG, GIF formatlarında resimler yükleyebilirsiniz.
                                            Birden fazla resim seçebilirsiniz.
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Button
                                        variant="primary"
                                        onClick={handleUpload}
                                        disabled={selectedFiles.length === 0 || uploading}
                                        className="w-100"
                                    >
                                        {uploading ? (
                                            <>
                                                <Spinner
                                                    as="span"
                                                    animation="border"
                                                    size="sm"
                                                    role="status"
                                                    aria-hidden="true"
                                                    className="me-2"
                                                />
                                                Yükleniyor...
                                            </>
                                        ) : (
                                            <>
                                                <FaUpload className="me-1" />
                                                Yükle ({selectedFiles.length})
                                            </>
                                        )}
                                    </Button>
                                </Col>
                            </Row>
                            
                            {selectedFiles.length > 0 && (
                                <Row className="mt-3">
                                    <Col>
                                        <Alert variant="info">
                                            <strong>Seçilen dosyalar:</strong>
                                            <ul className="mb-0 mt-2">
                                                {selectedFiles.map((file, index) => (
                                                    <li key={index}>
                                                        {file.name} ({formatFileSize(file.size)})
                                                    </li>
                                                ))}
                                            </ul>
                                        </Alert>
                                    </Col>
                                </Row>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Mevcut Resimler */}
                    <Card>
                        <Card.Header>
                            <h6>Mevcut Resimler ({resimler.length})</h6>
                        </Card.Header>
                        <Card.Body>
                            {loading ? (
                                <div className="text-center">
                                    <Spinner animation="border" />
                                    <p className="mt-2">Resimler yükleniyor...</p>
                                </div>
                            ) : resimler.length === 0 ? (
                                <Alert variant="info" className="text-center">
                                    Bu sevkiyat için henüz resim yüklenmemiş.
                                </Alert>
                            ) : (
                                <Row>
                                    {resimler.map(resim => (
                                        <Col key={resim.id} md={4} lg={3} className="mb-3">
                                            <Card className="h-100">
                                                <div style={{ height: '200px', overflow: 'hidden' }}>
                                                    <Card.Img
                                                        variant="top"
                                                        src={`${API_BASE_URL}/sevkiyat/resimler/dosya/${resim.resim_yolu.split('/').pop()}`}
                                                        style={{
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={() => handlePreview(resim)}
                                                    />
                                                </div>
                                                <Card.Body className="p-2">
                                                    <Card.Title className="h6 mb-1" title={resim.resim_adi}>
                                                        {resim.resim_adi.length > 20 
                                                            ? `${resim.resim_adi.substring(0, 20)}...`
                                                            : resim.resim_adi
                                                        }
                                                    </Card.Title>
                                                    <Card.Text className="small text-muted mb-2">
                                                        {resim.dosya_boyutu && formatFileSize(resim.dosya_boyutu)}
                                                        <br />
                                                        {new Date(resim.yuklenme_tarihi).toLocaleDateString('tr-TR')}
                                                    </Card.Text>
                                                    <div className="d-flex gap-1">
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => handlePreview(resim)}
                                                            title="Önizle"
                                                        >
                                                            <FaEye />
                                                        </Button>
                                                        <Button
                                                            variant="outline-success"
                                                            size="sm"
                                                            onClick={() => handleDownload(resim)}
                                                            title="İndir"
                                                        >
                                                            <FaDownload />
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleDelete(resim.id)}
                                                            title="Sil"
                                                        >
                                                            <FaTrash />
                                                        </Button>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            )}
                        </Card.Body>
                    </Card>
                </Modal.Body>
                
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Kapat
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Resim Önizleme Modal */}
            <Modal
                show={!!previewImage}
                onHide={() => setPreviewImage(null)}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Resim Önizleme</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    {previewImage && (
                        <img
                            src={previewImage}
                            alt="Resim önizleme"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '80vh',
                                objectFit: 'contain'
                            }}
                        />
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setPreviewImage(null)}>
                        Kapat
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default SevkiyatResimModal;
