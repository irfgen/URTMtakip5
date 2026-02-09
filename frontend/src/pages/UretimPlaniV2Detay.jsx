import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Chip, Divider, Tab, Tabs, Typography, Button } from '@mui/material';
import { uretimPlanlariV2 } from '../services/uretimPlanlariV2';

const normalize = (s) => String(s || '').toLocaleLowerCase('tr-TR');

const UretimPlaniV2Detay = () => {
	const { id } = useParams();
	const [plan, setPlan] = useState(null);
	const [tab, setTab] = useState(0);

	useEffect(() => {
		uretimPlanlariV2.get(id).then(setPlan);
	}, [id]);

	const { tamamlananlar, fasonIsler, digerIsEmirleri } = useMemo(() => {
		const list = Array.isArray(plan?.is_emirleri_listesi) ? plan.is_emirleri_listesi : [];
		const tamam = list.filter(k => k.tip === 'is_emri' && normalize(k.durum) === 'tamamlandı');
		const fason = list.filter(k => k.tip === 'fason' || (k.tip === 'is_emri' && normalize(k.durum) === 'fason'));
		const diger = list.filter(k => k.tip === 'is_emri' && !tamam.includes(k) && !fason.includes(k));
		return { tamamlananlar: tamam, fasonIsler: fason, digerIsEmirleri: diger };
	}, [plan]);

	if (!plan) return null;

	return (
		<Box>
			<Typography variant="h5">{plan.uretim_plani_adi}</Typography>
			<Typography variant="body2" sx={{ color: 'text.secondary' }}>{plan.aciklama || '-'}</Typography>
			<Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
				<Chip label={`Durum: ${plan.durum}`} />
				<Chip label={`Teslim: ${plan.teslim_tarihi ? new Date(plan.teslim_tarihi).toLocaleDateString('tr-TR') : '-'}`} />
				<Chip label={`Kalem: ${Array.isArray(plan.is_emirleri_listesi) ? plan.is_emirleri_listesi.length : 0}`} />
			</Box>
			<Divider sx={{ my: 2 }} />
			<Tabs value={tab} onChange={(_, v) => setTab(v)}>
				<Tab label={`İş Emirleri (${digerIsEmirleri.length})`} />
				<Tab label={`Fason İşler (${fasonIsler.length})`} />
				<Tab label={`Tamamlananlar (${tamamlananlar.length})`} />
			</Tabs>
			<Box sx={{ mt: 2 }}>
				{tab === 0 && digerIsEmirleri.map((k, i) => (<div key={i}>{k.is_emri_no || k.id}</div>))}
				{tab === 1 && fasonIsler.map((k, i) => (<div key={i}>{k.fason_no || k.id}</div>))}
				{tab === 2 && tamamlananlar.map((k, i) => (<div key={i}>{k.is_emri_no || k.id}</div>))}
			</Box>
		</Box>
	);
};

export default UretimPlaniV2Detay;


