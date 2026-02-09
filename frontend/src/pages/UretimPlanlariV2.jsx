import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, Chip, Grid, IconButton, InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography, Paper, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
 import { uretimPlanlariV2 } from '../services/uretimPlanlariV2';

function getDurumColor(durum) {
	switch (durum) {
		case 'Planlandı': return 'info';
		case 'Üretimde': return 'warning';
		case 'Tamamlandı': return 'success';
		case 'İptal': return 'error';
		default: return 'default';
	}
}

 const UretimPlanlariV2 = () => {
	const navigate = useNavigate();
	const [records, setRecords] = useState([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState('');
	const [durum, setDurum] = useState('');
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
 	const [deleteTarget, setDeleteTarget] = useState(null);

	const fetchData = async (params = {}) => {
		setLoading(true);
		try {
			const data = await uretimPlanlariV2.list(params);
			setRecords(Array.isArray(data.records) ? data.records : data);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		const params = {};
		if (search) params.search = search;
		if (durum) params.durum = durum;
		if (startDate) params.startDate = startDate;
		if (endDate) params.endDate = endDate;
		fetchData(params);
	}, [search, durum, startDate, endDate]);

	const filtered = useMemo(() => {
		const q = (search || '').toLocaleLowerCase('tr-TR');
		if (!q) return records;
		return records.filter(r => (
			(r.uretim_plani_adi || '').toLocaleLowerCase('tr-TR').includes(q) ||
			(r.durum || '').toLocaleLowerCase('tr-TR').includes(q) ||
			(r.aciklama || '').toLocaleLowerCase('tr-TR').includes(q)
		));
	}, [records, search]);

	return (
		<Box>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
				<Typography variant="h5">Üretim Planları (V2)</Typography>
				<Box sx={{ display: 'flex', gap: 2 }}>
					<Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/uretim-planlari/ekle')}>Yeni Plan</Button>
				</Box>
			</Box>

			<Card sx={{ mb: 3 }}>
				<CardContent>
					<Grid container spacing={2}>
						<Grid item xs={12} md={8}>
							<TextField fullWidth value={search} onChange={e => setSearch(e.target.value)} label="Ara (ad, durum, açıklama)" InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
						</Grid>
						<Grid item xs={12} md={4}>
							<TextField select fullWidth label="Durum" value={durum} onChange={(e) => setDurum(e.target.value)}>
								<option value="">Hepsi</option>
								<option value="Planlandı">Planlandı</option>
								<option value="Üretimde">Üretimde</option>
								<option value="Tamamlandı">Tamamlandı</option>
								<option value="İptal">İptal</option>
							</TextField>
						</Grid>
						<Grid item xs={12} md={2}>
							<TextField fullWidth type="date" label="Başlangıç" InputLabelProps={{ shrink: true }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
						</Grid>
						<Grid item xs={12} md={2}>
							<TextField fullWidth type="date" label="Bitiş" InputLabelProps={{ shrink: true }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
						</Grid>
					</Grid>
				</CardContent>
			</Card>

			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>İşlemler</TableCell>
							<TableCell>Plan Adı</TableCell>
							<TableCell>Teslim Tarihi</TableCell>
							<TableCell>Durum</TableCell>
							<TableCell>Kalem Sayısı</TableCell>
							<TableCell>Oluşturma</TableCell>
						</TableRow>
					</TableHead>
						<TableBody>
							{filtered.map((r) => (
								<TableRow key={r.uretim_plani_id}>
									<TableCell>
										<Tooltip title="Detaylar"><span><IconButton color="info" onClick={() => navigate(`/uretim-planlari/${r.uretim_plani_id}`)}><VisibilityIcon /></IconButton></span></Tooltip>
										<Tooltip title="Düzenle"><span><IconButton color="primary" onClick={() => navigate(`/uretim-planlari/duzenle/${r.uretim_plani_id}`)}><EditIcon /></IconButton></span></Tooltip>
										<Tooltip title="Sil"><span><IconButton color="error" onClick={() => setDeleteTarget(r)}><DeleteIcon /></IconButton></span></Tooltip>
									</TableCell>
									<TableCell>{r.uretim_plani_adi}</TableCell>
									<TableCell>{r.teslim_tarihi ? new Date(r.teslim_tarihi).toLocaleDateString('tr-TR') : '-'}</TableCell>
									<TableCell><Chip label={r.durum} color={getDurumColor(r.durum)} size="small" /></TableCell>
									<TableCell>{Array.isArray(r.is_emirleri_listesi) ? r.is_emirleri_listesi.length : 0}</TableCell>
									<TableCell>{r.olusturma_tarihi ? new Date(r.olusturma_tarihi).toLocaleString('tr-TR') : '-'}</TableCell>
								</TableRow>
							))}
						</TableBody>
				</Table>
			</TableContainer>

				<Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
					<DialogTitle>Planı sil</DialogTitle>
					<DialogContent>
						{deleteTarget ? `${deleteTarget.uretim_plani_adi} planını silmek istediğinize emin misiniz?` : ''}
					</DialogContent>
					<DialogActions>
						<Button onClick={() => setDeleteTarget(null)}>Vazgeç</Button>
						<Button color="error" onClick={async () => {
							if (!deleteTarget) return;
							await uretimPlanlariV2.remove(deleteTarget.uretim_plani_id);
							setDeleteTarget(null);
							fetchData(search ? { search } : {});
						}}>Sil</Button>
					</DialogActions>
				</Dialog>
		</Box>
	);
};

export default UretimPlanlariV2;


