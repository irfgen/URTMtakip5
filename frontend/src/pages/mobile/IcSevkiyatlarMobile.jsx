import React, { useEffect, useState } from 'react';
import { Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


import apiClient from '../../utils/apiClient';const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

function IcSevkiyatlarMobile() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const resp = await axios.get(`${API_BASE_URL}/toplu-sevkiyat?page=1&limit=50`);
      setItems(resp.data.data);
    } catch (e) { /* noop */ }
  };

  useEffect(() => { loadData(); }, []);

  const yeniToplu = async () => {
    try {
      const resp = await axios.post(`${API_BASE_URL}/toplu-sevkiyat`, { olusturan_kullanici: 'mobile' });
      navigate(`/sevkiyat/toplu-yeni/${resp.data.id}`);
    } catch { /* noop */ }
  };

  return (
    <div>
      <div className="d-flex justify-content-end mb-2">
        <Button variant="success" onClick={yeniToplu}>Toplu Sevkiyat Oluştur</Button>
      </div>
      {items.map(it => (
        <Card key={it.id} className="mb-2" onClick={() => navigate(`/sevkiyat/toplu-yeni/${it.id}`)}>
          <Card.Body>
            <div className="d-flex justify-content-between">
              <div>
                <div className="fw-bold">{it.toplu_no}</div>
                <div className="text-muted small">{new Date(it.tarih).toLocaleString('tr-TR')}</div>
                <div className="small">{it.nereden_lokasyon_adi || '-'} → {it.nereye_lokasyon_adi || '-'}</div>
              </div>
              <div className="text-end">
                <div className="small">Kalem: {it.kalem_sayisi}</div>
                <div className="small">Durum: {it.durum}</div>
              </div>
            </div>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}

export default IcSevkiyatlarMobile;


