import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Table, Spinner, Alert, Badge } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


import apiClient from '../utils/apiClient';const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

function IcSevkiyatlar() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: pagination.page.toString(), limit: pagination.limit.toString() });
      const resp = await axios.get(`${API_BASE_URL}/toplu-sevkiyat?${params}`);
      setItems(resp.data.data);
      setPagination(resp.data.pagination);
    } catch (e) {
      setError('İç sevkiyatlar yüklenemedi');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [pagination.page]);

  const durumBadge = (durum) => {
    const variants = { taslak: 'secondary', beklemede: 'warning', tamamlandi: 'success', iptal: 'danger' };
    const labels = { taslak: 'Taslak', beklemede: 'Beklemede', tamamlandi: 'Tamamlandı', iptal: 'İptal' };
    return <Badge bg={variants[durum] || 'secondary'}>{labels[durum] || durum}</Badge>;
  };

  const yeniToplu = async () => {
    try {
      const resp = await axios.post(`${API_BASE_URL}/toplu-sevkiyat`, { olusturan_kullanici: 'web' });
      navigate(`/sevkiyat/toplu-yeni/${resp.data.id}`);
    } catch {
      setError('Toplu sevkiyat oluşturulamadı');
    }
  };

  return (
    <Container fluid>
      <Row className="mb-3"><Col><h3>İç Sevkiyatlar</h3></Col></Row>
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      <Card className="mb-3">
        <Card.Body>
          <Button variant="success" onClick={yeniToplu}><FaPlus className="me-1" /> Toplu Sevkiyat Oluştur</Button>
        </Card.Body>
      </Card>
      <Card>
        <Card.Header>Toplu Sevkiyat Listesi ({pagination.total})</Card.Header>
        <Card.Body>
          {loading ? (<div className="text-center"><Spinner animation="border" /></div>) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tarih</th>
                  <th>Nereden</th>
                  <th>Nereye</th>
                  <th>Kalem</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (<tr><td colSpan={6} className="text-center">Kayıt yok</td></tr>) : items.map(it => (
                  <tr key={it.id} onClick={() => navigate(`/sevkiyat/toplu-yeni/${it.id}`)} style={{ cursor: 'pointer' }}>
                    <td>{it.toplu_no}</td>
                    <td>{new Date(it.tarih).toLocaleString('tr-TR')}</td>
                    <td>{it.nereden_lokasyon_adi || '-'}</td>
                    <td>{it.nereye_lokasyon_adi || '-'}</td>
                    <td>{it.kalem_sayisi}</td>
                    <td>{durumBadge(it.durum)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default IcSevkiyatlar;


