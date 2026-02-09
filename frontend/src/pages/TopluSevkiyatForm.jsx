import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Form, Image, Modal, Alert, Spinner } from 'react-bootstrap';
import { FaPlus, FaTrash, FaEdit, FaSave, FaCamera, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import StokKartiSecimModal from '../components/StokKartiSecimModal';
import ParcaSecimFormu from '../components/ParcaSecimFormu';


import apiClient from '../utils/apiClient';const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

function TopluSevkiyatForm() {
  const { sevkiyatId } = useParams();
  const navigate = useNavigate();
  const [sevkiyat, setSevkiyat] = useState(null);
  const [kalemler, setKalemler] = useState([]);
  const [lokasyonlar, setLokasyonlar] = useState([]);
  const [tarihStr, setTarihStr] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showKalemModal, setShowKalemModal] = useState(false);
  const [modalState, setModalState] = useState({
    kalem_tipi: '',
    stok_karti: null,
    parca: null,
    adet: 1,
    resimler: [],
    mode: 'create', // create | edit
    editKalemId: null,
    mevcutResimler: []
  });
  const [stokModalOpen, setStokModalOpen] = useState(false);
  const [parcaModalOpen, setParcaModalOpen] = useState(false);

  const fetchSevkiyat = async () => {
    try {
      // Geçici: eski endpoint ile uyumlu kal; sonraki adımda route bu sayfayı /toplu-sevkiyat/:id'ye yönlendirecek
      const resp = await axios.get(`${API_BASE_URL}/toplu-sevkiyat/${sevkiyatId}`);
      setSevkiyat(resp.data);
    } catch (e) {
      setError('Toplu sevkiyat bilgisi alınamadı');
    }
  };

  const [kalemIlkResimMap, setKalemIlkResimMap] = useState({}); // { [kalemId]: filename }

  const fetchKalemler = async () => {
    try {
      const resp = await axios.get(`${API_BASE_URL}/toplu-sevkiyat/${sevkiyatId}/kalemler`);
      const kalemlerList = resp.data;
      setKalemler(kalemlerList);
      // Her kalemin ilk resmini getir
      const pairs = await Promise.all(
        kalemlerList.map(async (k) => {
          try {
            const r = await axios.get(`${API_BASE_URL}/sevkiyat/resimler/toplu/${sevkiyatId}/kalem/${k.id}`);
            const first = (r.data || [])[0];
            if (first && first.resim_yolu) {
              const filename = first.resim_yolu.split('/').pop();
              return [k.id, filename];
            }
            return [k.id, null];
          } catch (_) {
            return [k.id, null];
          }
        })
      );
      const mapObj = Object.fromEntries(pairs);
      setKalemIlkResimMap(mapObj);
    } catch (e) {
      setError('Kalemler alınamadı');
    }
  };

  const fetchLookups = async () => {
    try {
      const lRes = await axios.get(`${API_BASE_URL}/sevkiyat/lokasyonlar?aktif=true`);
      setLokasyonlar(lRes.data);
    } catch (e) {
      // noop
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchSevkiyat(), fetchKalemler(), fetchLookups()])
      .finally(() => setLoading(false));
  }, [sevkiyatId]);

  const temsilGorselUrl = (kalem) => {
    // Kalem bazlı ilk resim; API: /api/sevkiyat/:sevkiyatId/kalem/:kalemId/resimler
    const [first] = kalem.kalem_resimleri || [];
    return first ? `${API_BASE_URL}/sevkiyat/resimler/dosya/${first.resim_yolu.split('/').pop()}` : '/no-image.png';
  };

  const handleYeniKalem = () => {
    setModalState({ kalem_tipi: '', stok_karti: null, parca: null, adet: 1, resimler: [], mode: 'create', editKalemId: null, mevcutResimler: [] });
    setShowKalemModal(true);
  };

  const uploadKalemResimleri = async (kalem_id, files) => {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    for (const f of files) formData.append('resimler', f);
    await axios.post(`${API_BASE_URL}/sevkiyat/resimler/toplu/${sevkiyatId}/kalem/${kalem_id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  };

  const deleteKalemResmi = async (resimId) => {
    await axios.delete(`${API_BASE_URL}/sevkiyat/resimler/${resimId}`);
  };

  const handleKalemKaydet = async () => {
    try {
      if (modalState.mode === 'create') {
        const inferredType = modalState.stok_karti ? 'stok_karti' : (modalState.parca ? 'parca' : null);
        const body = {
          kalem_tipi: inferredType,
          stok_karti_id: inferredType === 'stok_karti' ? modalState.stok_karti?.id : null,
          parca_kodu: inferredType === 'parca' ? modalState.parca?.parca_kodu : null,
          adet: modalState.adet
        };
      const resp = await axios.post(`${API_BASE_URL}/toplu-sevkiyat/${sevkiyatId}/kalemler`, body);
        const kalem_id = resp.data.id || resp.data.kalem_id;
        await uploadKalemResimleri(kalem_id, modalState.resimler);
        setShowKalemModal(false);
        setSuccess('Kalem eklendi');
        await fetchKalemler();
      } else {
        // Edit mode: sadece adet ve aciklama güncelle; resimleri ekle
        const kalem_id = modalState.editKalemId;
        await axios.put(`${API_BASE_URL}/toplu-sevkiyat/${sevkiyatId}/kalemler/${kalem_id}`, {
          adet: modalState.adet,
          birim_fiyati: null,
          aciklama: null
        });
        await uploadKalemResimleri(kalem_id, modalState.resimler);
        setShowKalemModal(false);
        setSuccess('Kalem güncellendi');
        await fetchKalemler();
      }
    } catch (e) {
      setError('Kalem eklenemedi');
    }
  };

  const handleGenelKaydet = async () => {
    try {
      const hasLokasyonlar = !!sevkiyat?.nereden_lokasyon_id && !!sevkiyat?.nereye_lokasyon_id;
      const hedefDurum = hasLokasyonlar ? 'beklemede' : 'taslak';

      await axios.put(`${API_BASE_URL}/toplu-sevkiyat/${sevkiyatId}`, {
        nereden_lokasyon_id: sevkiyat.nereden_lokasyon_id || null,
        nereye_lokasyon_id: sevkiyat.nereye_lokasyon_id || null,
        tarih: sevkiyat.tarih || new Date().toISOString(),
        durum: hedefDurum,
        aciklama: sevkiyat.aciklama || null
      });

      if (hasLokasyonlar) {
        await axios.put(`${API_BASE_URL}/toplu-sevkiyat/${sevkiyatId}/durum`, { durum: 'beklemede' });
        setSuccess('Sevkiyat kaydedildi');
      } else {
        setSuccess('Taslak olarak kaydedildi. Nereden/Nereye seçince finalize edebilirsiniz.');
      }

      navigate('/ic-sevkiyatlar');
    } catch (e) {
      setError('Sevkiyat kaydedilemedi');
    }
  };

  const temsilResimKaynaklari = useMemo(() => ({}), []);

  if (loading) {
    return (
      <Container className="mt-4"><Spinner animation="border" /></Container>
    );
  }

  return (
    <Container fluid className="mt-3">
      <Row className="mb-3">
        <Col>
          <Button variant="outline-secondary" onClick={() => navigate(-1)} className="me-2">
            <FaArrowLeft className="me-1" /> Geri
          </Button>
          <h3 className="d-inline">Toplu Sevkiyat: {sevkiyat?.sevkiyat_no}</h3>
        </Col>
      </Row>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      <Card className="mb-3">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <div>Kalemler</div>
            <Button variant="primary" onClick={handleYeniKalem}>
              <FaPlus className="me-1" /> Yeni Sevkiyat Kalemi
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Table responsive bordered hover>
            <thead>
              <tr>
                <th>Görsel</th>
                <th>Kalem</th>
                <th>Adet</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {kalemler.length === 0 ? (
                <tr><td colSpan={4} className="text-center">Kalem yok</td></tr>
              ) : kalemler.map(k => (
                <tr key={k.id}>
                  <td style={{ width: 90 }}>
                    {(() => {
                      const filename = (k.temsil_resim_yolu && k.temsil_resim_yolu.split('/').pop()) || kalemIlkResimMap[k.id];
                      const src = filename ? `${API_BASE_URL}/sevkiyat/resimler/dosya/${filename}` : '/no-image.png';
                      return <img src={src} alt="temsil" style={{ width: 64, height: 64, objectFit: 'cover' }} />;
                    })()}
                  </td>
                  <td>
                    <div><strong>{k.kalem_tipi === 'stok_karti' ? `Stok #${k.stok_karti_id ?? ''}` : k.parca_kodu}</strong></div>
                    <div className="text-muted small">{k.kalem_tipi}</div>
                  </td>
                  <td style={{ width: 120 }}>{k.adet}</td>
                  <td style={{ width: 160 }}>
                    <Button size="sm" variant="outline-primary" className="me-2" onClick={async () => {
                      // Düzenleme modali
                      try {
                        const r = await axios.get(`${API_BASE_URL}/sevkiyat/resimler/toplu/${sevkiyatId}/kalem/${k.id}`);
                        setModalState({
                          mode: 'edit',
                          editKalemId: k.id,
                          kalem_tipi: k.kalem_tipi,
                          stok_karti: k.kalem_tipi === 'stok_karti' ? { id: k.stok_karti_id } : null,
                          parca: k.kalem_tipi === 'parca' ? { parca_kodu: k.parca_kodu } : null,
                          adet: k.adet,
                          resimler: [],
                          mevcutResimler: r.data || []
                        });
                        setShowKalemModal(true);
                      } catch (_) {
                        setError('Kalem resimleri alınamadı');
                      }
                    }}>
                      <FaEdit />
                    </Button>
                    <Button size="sm" variant="outline-danger" className="me-2" onClick={async () => {
                      try {
                        await axios.delete(`${API_BASE_URL}/toplu-sevkiyat/${sevkiyatId}/kalemler/${k.id}`);
                        await fetchKalemler();
                      } catch (e) {
                        setError('Kalem silinemedi');
                      }
                    }}>
                      <FaTrash />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>Lokasyon ve Onay</Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Tip</Form.Label>
                <Form.Select value={sevkiyat?.tip || 'giden'} onChange={(e) => setSevkiyat(s => ({ ...s, tip: e.target.value }))}>
                  <option value="gelen">Gelen</option>
                  <option value="giden">Giden</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Nereden</Form.Label>
                <Form.Select value={sevkiyat?.nereden_lokasyon_id || ''} onChange={(e) => setSevkiyat(s => ({ ...s, nereden_lokasyon_id: Number(e.target.value) }))}>
                  <option value="">Seçiniz</option>
                  {lokasyonlar.map(l => <option key={l.id} value={l.id}>{l.lokasyon_adi}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Nereye</Form.Label>
                <Form.Select value={sevkiyat?.nereye_lokasyon_id || ''} onChange={(e) => setSevkiyat(s => ({ ...s, nereye_lokasyon_id: Number(e.target.value) }))}>
                  <option value="">Seçiniz</option>
                  {lokasyonlar.map(l => <option key={l.id} value={l.id}>{l.lokasyon_adi}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Tarih</Form.Label>
                <Form.Control type="datetime-local" value={sevkiyat?.tarih ? new Date(sevkiyat.tarih).toISOString().slice(0,16) : ''}
                  onChange={(e) => setSevkiyat(s => ({ ...s, tarih: new Date(e.target.value).toISOString() }))}
                />
              </Form.Group>
            </Col>
          </Row>
          <div className="d-flex justify-content-end">
            <Button variant="success" onClick={handleGenelKaydet}>
              <FaSave className="me-1" /> Kaydet
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Yeni Kalem Modal */}
      <Modal show={showKalemModal} onHide={() => setShowKalemModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{modalState.mode === 'edit' ? 'Sevkiyat Kalemi Düzenle' : 'Yeni Sevkiyat Kalemi'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={12}>
              <Row className="mb-3">
                <Col md={5}>
                  <div className="border rounded p-3 h-100">
                    <h6 className="text-center mb-3">Stok Kartı</h6>
                    {modalState.stok_karti ? (
                      <div className="selected-item">
                        <div className="border rounded p-2 mb-2 bg-light">
                          <small className="text-muted">Seçilen Stok Kartı:</small>
                          <div><strong>{modalState.stok_karti.malzeme_cinsi || ''} {modalState.stok_karti.kesit || ''}</strong></div>
                        </div>
                        <Button variant="outline-danger" size="sm" onClick={() => setModalState(s => ({ ...s, stok_karti: null }))} className="w-100">Kaldır</Button>
                      </div>
                    ) : (
                      <Button variant="outline-primary" onClick={() => setStokModalOpen(true)} className="w-100">Malzeme Stok Kartı Ekle / Değiştir</Button>
                    )}
                  </div>
                </Col>
                <Col md={2} className="d-flex align-items-center justify-content-center"><strong>VEYA</strong></Col>
                <Col md={5}>
                  <div className="border rounded p-3 h-100">
                    <h6 className="text-center mb-3">Parça</h6>
                    {modalState.parca ? (
                      <div className="selected-item">
                        <div className="border rounded p-2 mb-2 bg-light">
                          <small className="text-muted">Seçilen Parça:</small>
                          <div><strong>{modalState.parca.parca_kodu || ''} {modalState.parca.parca_adi || ''}</strong></div>
                        </div>
                        <Button variant="outline-danger" size="sm" onClick={() => setModalState(s => ({ ...s, parca: null }))} className="w-100">Kaldır</Button>
                      </div>
                    ) : (
                      <Button variant="outline-success" onClick={() => setParcaModalOpen(true)} className="w-100">Parça Seç</Button>
                    )}
                  </div>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={4} className="ms-auto">
                  <Form.Group>
                    <Form.Label>Adet</Form.Label>
                    <Form.Control type="number" min={1} value={modalState.adet} onChange={(e) => setModalState(s => ({ ...s, adet: Number(e.target.value) }))} />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-2">
                <Form.Label>Resimler</Form.Label>
                <Form.Control type="file" multiple accept="image/*" onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setModalState(s => ({ ...s, resimler: files }));
                }} />
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {(modalState.resimler || []).map((f, idx) => (
                    <Image key={idx} src={URL.createObjectURL(f)} thumbnail width={96} height={96} style={{ objectFit: 'cover' }} />
                  ))}
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowKalemModal(false)}>İptal</Button>
          <Button variant="primary" onClick={handleKalemKaydet}><FaSave className="me-1" /> Kaydet</Button>
        </Modal.Footer>
      </Modal>
      <StokKartiSecimModal
        open={stokModalOpen}
        onClose={() => setStokModalOpen(false)}
        onSelect={(stok) => { setModalState(s => ({ ...s, stok_karti: stok, parca: null, kalem_tipi: 'stok_karti' })); setStokModalOpen(false); }}
        selectedStokKarti={modalState.stok_karti}
      />
      <ParcaSecimFormu
        open={parcaModalOpen}
        onClose={() => setParcaModalOpen(false)}
        onSec={(parca) => { setModalState(s => ({ ...s, parca, stok_karti: null, kalem_tipi: 'parca' })); setParcaModalOpen(false); }}
      />
    </Container>
  );
}

export default TopluSevkiyatForm;


