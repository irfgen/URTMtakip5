import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Card, CardContent, Grid, MenuItem, TextField, Typography, Chip, IconButton, Tooltip, Divider, Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { uretimPlanlariV2 } from '../services/uretimPlanlariV2';
import api from '../services/api';

const durumOptions = ['Planlandı', 'Üretimde', 'Tamamlandı', 'İptal'];

const UretimPlaniV2Form = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const editMode = !!id;

	const [values, setValues] = useState({
		uretim_plani_adi: '',
		is_emirleri_listesi: [],
		teslim_tarihi: '',
		durum: 'Planlandı',
		aciklama: ''
	});

	const [newItem, setNewItem] = useState({ tip: 'is_emri', id: '', is_emri_no: '', fason_no: '', durum: '' });
	const [saving, setSaving] = useState(false);

	// Kalem arama modalı
	const [pickerOpen, setPickerOpen] = useState(false);
	const [pickerTip, setPickerTip] = useState('is_emri');
	const [pickerSearch, setPickerSearch] = useState('');
	const [pickerResults, setPickerResults] = useState([]);
	const [picking, setPicking] = useState(false);

	const runPickerSearch = async () => {
		setPicking(true);
		try {
			if (pickerTip === 'is_emri') {
				const res = await api.get('/is-emirleri', { params: { flat: 'true', search: pickerSearch, showAssigned: 'true' } });
				setPickerResults(res.data || []);
			} else {
				const res = await api.get('/fason/is-emirleri/selectable', { params: { search: pickerSearch, excludePlanId: id || undefined } });
				setPickerResults((res.data && res.data.data) || []);
			}
		} finally {
			setPicking(false);
		}
	};

	useEffect(() => {
		if (editMode) {
			uretimPlanlariV2.get(id).then((data) => {
				setValues({
					uretim_plani_adi: data.uretim_plani_adi || '',
					is_emirleri_listesi: Array.isArray(data.is_emirleri_listesi) ? data.is_emirleri_listesi : [],
					teslim_tarihi: data.teslim_tarihi ? new Date(data.teslim_tarihi).toISOString().slice(0, 10) : '',
					durum: data.durum || 'Planlandı',
					aciklama: data.aciklama || ''
				});
			});
		}
	}, [editMode, id]);

	const handleChange = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));

	const addItem = () => {
		if (!newItem.id) return;
		const item = { tip: newItem.tip, id: isNaN(Number(newItem.id)) ? newItem.id : Number(newItem.id) };
		if (newItem.tip === 'is_emri') {
			if (newItem.is_emri_no) item.is_emri_no = newItem.is_emri_no;
		} else {
			if (newItem.fason_no) item.fason_no = newItem.fason_no;
		}
		if (newItem.durum) item.durum = newItem.durum;
		setValues((v) => ({ ...v, is_emirleri_listesi: [...(v.is_emirleri_listesi || []), item] }));
		setNewItem({ tip: 'is_emri', id: '', is_emri_no: '', fason_no: '', durum: '' });
	};

	const addPicked = (row) => {
		if (pickerTip === 'is_emri') {
			const item = { tip: 'is_emri', id: row.is_emri_id || row.id || row.is_emri_no, is_emri_no: row.is_emri_no, durum: row.durum };
			setValues((v) => ({ ...v, is_emirleri_listesi: [...(v.is_emirleri_listesi || []), item] }));
		} else {
			const item = { tip: 'fason', id: row.fason_is_emri_id || row.id, fason_no: row.is_emri_no || row.fason_no, durum: row.durum };
			setValues((v) => ({ ...v, is_emirleri_listesi: [...(v.is_emirleri_listesi || []), item] }));
		}
	};

	const removeItemAt = (idx) => {
		setValues((v) => ({ ...v, is_emirleri_listesi: v.is_emirleri_listesi.filter((_, i) => i !== idx) }));
	};

	const onSave = async () => {
		setSaving(true);
		try {
			const payload = {
				...values,
				teslim_tarihi: values.teslim_tarihi || new Date().toISOString().slice(0, 10)
			};
			if (editMode) {
				await uretimPlanlariV2.update(id, payload);
				navigate(`/uretim-planlari/${id}`);
			} else {
				const created = await uretimPlanlariV2.create(payload);
				navigate(`/uretim-planlari/${created.uretim_plani_id}`);
			}
		} finally {
			setSaving(false);
		}
	};

	return (
		<Box>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
				<IconButton onClick={() => navigate(-1)}><ArrowBackIcon /></IconButton>
				<Typography variant="h5">{editMode ? 'Planı Düzenle' : 'Yeni Üretim Planı'}</Typography>
			</Box>

			<Card sx={{ mb: 3 }}>
				<CardContent>
					<Grid container spacing={2}>
						<Grid item xs={12} md={6}>
							<TextField fullWidth label="Plan Adı" value={values.uretim_plani_adi} onChange={handleChange('uretim_plani_adi')} />
						</Grid>
						<Grid item xs={12} md={3}>
							<TextField fullWidth type="date" label="Teslim Tarihi" InputLabelProps={{ shrink: true }} value={values.teslim_tarihi} onChange={handleChange('teslim_tarihi')} />
						</Grid>
						<Grid item xs={12} md={3}>
							<TextField select fullWidth label="Durum" value={values.durum} onChange={handleChange('durum')}>
								{durumOptions.map((d) => (<MenuItem key={d} value={d}>{d}</MenuItem>))}
							</TextField>
						</Grid>
						<Grid item xs={12}>
							<TextField fullWidth multiline minRows={2} label="Açıklama" value={values.aciklama} onChange={handleChange('aciklama')} />
						</Grid>
					</Grid>
				</CardContent>
			</Card>

			<Card sx={{ mb: 3 }}>
				<CardContent>
					<Typography variant="h6" sx={{ mb: 2 }}>Plan Kalemleri</Typography>
					<Grid container spacing={1} alignItems="center">
						<Grid item xs={12} md={2}>
							<TextField select fullWidth label="Tip" value={newItem.tip} onChange={(e) => setNewItem((ni) => ({ ...ni, tip: e.target.value }))}>
								<MenuItem value="is_emri">İş Emri</MenuItem>
								<MenuItem value="fason">Fason</MenuItem>
							</TextField>
						</Grid>
						<Grid item xs={12} md={2}>
							<TextField fullWidth label="ID" value={newItem.id} onChange={(e) => setNewItem((ni) => ({ ...ni, id: e.target.value }))} />
						</Grid>
						<Grid item xs={12} md={3}>
							{newItem.tip === 'is_emri' ? (
								<TextField fullWidth label="İş Emri No" value={newItem.is_emri_no} onChange={(e) => setNewItem((ni) => ({ ...ni, is_emri_no: e.target.value }))} />
							) : (
								<TextField fullWidth label="Fason No" value={newItem.fason_no} onChange={(e) => setNewItem((ni) => ({ ...ni, fason_no: e.target.value }))} />
							)}
						</Grid>
						<Grid item xs={12} md={3}>
							<TextField fullWidth label="Durum (opsiyonel)" value={newItem.durum} onChange={(e) => setNewItem((ni) => ({ ...ni, durum: e.target.value }))} />
						</Grid>
						<Grid item xs={12} md={2}>
							<Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={addItem}>Ekle</Button>
						</Grid>
					</Grid>

					<Box sx={{ mt: 1 }}>
					<Button size="small" variant="outlined" onClick={() => { setPickerTip('is_emri'); setPickerOpen(true); setPickerResults([]); setPickerSearch(''); }}>İş Emri Seç</Button>
					<Button size="small" variant="outlined" sx={{ ml: 1 }} onClick={() => { setPickerTip('fason'); setPickerOpen(true); setPickerResults([]); setPickerSearch(''); }}>Fason Seç</Button>
					</Box>

					<Divider sx={{ my: 2 }} />

					<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
						{(values.is_emirleri_listesi || []).map((k, i) => (
							<Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, border: '1px solid', borderColor: 'divider', p: 1, borderRadius: 1 }}>
								<DragIndicatorIcon fontSize="small" sx={{ color: 'text.disabled' }} />
								<Chip label={k.tip} size="small" />
								<Typography variant="body2">{k.is_emri_no || k.fason_no || k.id}</Typography>
								{(k.durum) ? <Chip label={k.durum} size="small" /> : null}
								<Tooltip title="Kaldır"><IconButton color="error" size="small" onClick={() => removeItemAt(i)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
							</Box>
						))}
					</Box>
				</CardContent>
			</Card>

			<Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
				<Button variant="outlined" onClick={() => navigate(-1)}>Vazgeç</Button>
				<Button variant="contained" startIcon={<SaveIcon />} disabled={saving || !values.uretim_plani_adi} onClick={onSave}>{editMode ? 'Güncelle' : 'Oluştur'}</Button>
			</Box>
		</Box>
	);
};

export default UretimPlaniV2Form;

// Basit seçim modalı
export const UretimKalemiSeciciModal = ({ open, onClose, tip, search, setSearch, results, loading, onSearch, onPick }) => {
	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
			<DialogTitle>{tip === 'is_emri' ? 'İş Emri Seç' : 'Fason Seç'}</DialogTitle>
			<DialogContent>
				<TextField fullWidth placeholder="Ara..." value={search} onChange={(e) => setSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
				<Box sx={{ mt: 2, maxHeight: 400, overflow: 'auto' }}>
					{(results || []).map((row, idx) => (
						<Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
							<Box>
								<Typography variant="body2" sx={{ fontWeight: 600 }}>{tip === 'is_emri' ? (row.is_emri_no || row.is_adi) : (row.is_emri_no || row.fason_no)}</Typography>
								<Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.parca_kodu || row.parca?.parcaKodu || ''} {row.parca?.parcaAdi ? `- ${row.parca.parcaAdi}` : ''}</Typography>
							</Box>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								{row.durum ? <Chip size="small" label={row.durum} /> : null}
								<Button variant="outlined" size="small" onClick={() => onPick(row)}>Ekle</Button>
							</Box>
						</Box>
					))}
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Kapat</Button>
				<Button onClick={onSearch} disabled={loading} variant="contained" startIcon={<SearchIcon />}>Ara</Button>
			</DialogActions>
		</Dialog>
	);
};


