import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ImageWithFallback from './ImageWithFallback';
import getFotoPath from './getFotoPath';
import IsEmriEkleForm from './IsEmriEkleForm';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box, Button, Card, CardContent, Typography, TextField, Grid, IconButton,
    List, ListItem, ListItemText, ListItemSecondaryAction, Autocomplete,
    Select, MenuItem, FormControl, InputLabel, CircularProgress, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WorkIcon from '@mui/icons-material/Work';
import debounce from 'lodash.debounce';
import ParcaSecici from './ParcaSecici';

const BomForm = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Düzenleme modu için BOM ID'si
    const isEditMode = !!id;

    const [bomData, setBomData] = useState({
        name: '',
        description: '',
        uretim_maliyeti: '',
        tedarik_maliyeti: '',
        tedarikci_firma: ''
    });
    const [items, setItems] = useState([]); // BOM içeriği: { id: string, name: string, type: 'PART' | 'BOM', quantity: number }

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Öğe ekleme alanı state'leri
    const [itemTypeToAdd, setItemTypeToAdd] = useState('PART'); // 'PART' or 'BOM'
    const [searchOptions, setSearchOptions] = useState([]);
    const [selectedItemToAdd, setSelectedItemToAdd] = useState(null); // Seçilen Autocomplete öğesi
    const [itemQuantity, setItemQuantity] = useState(1);
    const [itemSearchTerm, setItemSearchTerm] = useState('');
    const [searching, setSearching] = useState(false);
    const [allParts, setAllParts] = useState([]);
    const [allGroups, setAllGroups] = useState([]);
    const [selectedParcaObj, setSelectedParcaObj] = useState(null);
    
    // İş emri oluşturma dialog state'leri
    const [isEmriDialogOpen, setIsEmriDialogOpen] = useState(false);
    const [selectedParcaForIsEmri, setSelectedParcaForIsEmri] = useState(null);

    // Maliyet bilgileri state'i
    const [bomCostData, setBomCostData] = useState(null);
    const [itemCosts, setItemCosts] = useState({});
    const [calculatedProductionCost, setCalculatedProductionCost] = useState(0);

    // Düzenleme modunda BOM detaylarını yükle
    useEffect(() => {
        if (isEditMode) {
            setLoading(true);
            axios.get(`/api/boms/${id}`)
                .then(response => {
                    setBomData({
                        name: response.data.name || '',
                        description: response.data.bom_aciklamasi || '',
                        uretim_maliyeti: response.data.uretim_maliyeti || '',
                        tedarik_maliyeti: response.data.tedarik_maliyeti || '',
                        tedarikci_firma: response.data.tedarikci_firma || ''
                    });

                    // Items parsing
                    let parsedItems = response.data.items || [];
                    if (typeof parsedItems === 'string') {
                        try {
                            parsedItems = JSON.parse(parsedItems);
                        } catch (e) {
                            console.warn('Items JSON parse hatası:', e);
                            parsedItems = [];
                        }
                    }
                    if (!Array.isArray(parsedItems)) {
                        parsedItems = [];
                    }
                    setItems(parsedItems);

                    // Maliyet bilgilerini sakla
                    setBomCostData(response.data);

                    // BOM yanıtındaki maliyet bilgilerini işle
                    processCostsFromBOMResponse(parsedItems);
                    setError(null);
                })
                .catch(err => {
                    console.error('BOM detayı yüklenirken hata:', err);
                    setError('BOM detayı yüklenirken bir hata oluştu.');
                })
                .finally(() => setLoading(false));
        }
    }, [id, isEditMode]);

    // Tüm parçaları ve grupları yükleme
    useEffect(() => {
        setSearching(true);
        
        // Tüm parçaları yükle
        axios.get('/api/parcalar')
            .then(response => {
                const dataArr = Array.isArray(response.data) ? response.data : response.data.parcalar || [];
                const options = dataArr.map(item => ({
                    id: item.parcaKodu,
                    name: item.parcaKodu, // Sadece parça kodu gösteriliyor
                    type: 'PART'
                }));
                setAllParts(options);
                if (itemTypeToAdd === 'PART') {
                    setSearchOptions(options);
                }
                setSearching(false);
            })
            .catch(err => {
                console.error('Parçalar yüklenirken hata:', err);
                setSearching(false);
            });

        // Tüm grupları yükle
        if (itemTypeToAdd === 'BOM') {
            setSearching(true);
            axios.get('/api/boms')
                .then(response => {
                    const options = response.data
                        .filter(item => !isEditMode || item.bom_id !== parseInt(id)) // Kendi kendini eklemeyi önle
                        .map(item => ({
                            id: item.bom_id,
                            name: item.name,
                            type: 'BOM'
                        }));
                    
                    setAllGroups(options);
                    if (itemTypeToAdd === 'BOM') {
                        setSearchOptions(options);
                    }
                    setSearching(false);
                })
                .catch(err => {
                    console.error('BOM grupları yüklenirken hata:', err);
                    setSearching(false);
                });
        }
    }, [id, isEditMode, itemTypeToAdd]);

    // Öğe tipi değiştiğinde ilgili listeyi göster
    useEffect(() => {
        if (itemTypeToAdd === 'PART') {
            setSearchOptions(allParts);
        } else {
            setSearchOptions(allGroups);
        }
    }, [itemTypeToAdd, allParts, allGroups]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setBomData(prev => ({ ...prev, [name]: value }));
    };

    // Parça maliyet bilgilerini BOM yanıtından kullan - GÜNCELLENMİŞ MANTIK
    const processCostsFromBOMResponse = (itemsList) => {
        if (!itemsList || itemsList.length === 0) return;

        const costs = {};

        for (const item of itemsList) {
            if (item.type === 'PART' || item.type === 'PARCA') {
                const parcaKodu = item.name; // BOM yanıtında name alanı parça kodunu içeriyor

                if (parcaKodu && item.unitCostInfo) {
                    // BOM yanıtındaki hazır maliyet bilgilerini kullan
                    const unitCostInfo = item.unitCostInfo;
                    const costDetails = unitCostInfo.costDetails || {};

                    // CostDetails içindeki değerleri çıkar
                    let internalCost = 0;
                    let subcontractCost = 0;
                    let procurementCost = 0;

                    if (costDetails.source === 'sirket_ici') {
                        internalCost = costDetails.internalCost || 0;
                    } else if (costDetails.source === 'fason') {
                        subcontractCost = costDetails.subcontractCost || 0;
                    } else if (costDetails.source === 'tedarik') {
                        procurementCost = costDetails.procurementCost || 0;
                    }

                    costs[parcaKodu] = {
                        unitCostUSD: unitCostInfo.unitCostUSD || 0,
                        costSource: costDetails.source === 'sirket_ici' ? 'Şirket İçi' :
                                   costDetails.source === 'fason' ? 'Fason' :
                                   costDetails.source === 'tedarik' ? 'Tedarik' : 'Bilinmiyor',
                        isManufactured: unitCostInfo.isManufactured || false,
                        costType: unitCostInfo.costType || 'unknown',
                        details: {
                            procurementCost: procurementCost,
                            internalCost: internalCost,
                            subcontractCost: subcontractCost,
                            cncProcessingTime: 0 // Bu bilgi BOM yanıtında yok
                        }
                    };
                } else if (parcaKodu) {
                    // Maliyet bilgisi yoksa varsayılan değerler
                    costs[parcaKodu] = {
                        unitCostUSD: 0,
                        costSource: 'Bilinmiyor',
                        isManufactured: false,
                        costType: 'unknown',
                        details: {
                            procurementCost: 0,
                            internalCost: 0,
                            subcontractCost: 0,
                            cncProcessingTime: 0
                        }
                    };
                }
            }
        }

        setItemCosts(costs);
        calculateTotalProductionCost(itemsList, costs);
    };

    // Toplam üretim maliyeti hesaplama fonksiyonu - GÜNCELLENMİŞ MANTIK
    const calculateTotalProductionCost = (itemsList, costs) => {
        let totalProductionCost = 0;

        itemsList.forEach(item => {
            if (item.type === 'PART' || item.type === 'PARCA') {
                const parcaKodu = item.name; // BOM yanıtında name alanı parça kodunu içeriyor
                const costInfo = costs[parcaKodu];
                if (costInfo && costInfo.unitCostUSD) {
                    const itemTotalCost = costInfo.unitCostUSD * (item.quantity || 1);
                    totalProductionCost += itemTotalCost;
                }
            }
        });

        setCalculatedProductionCost(totalProductionCost);

        // BOM data'yı da güncelle
        setBomData(prev => ({
            ...prev,
            uretim_maliyeti: totalProductionCost.toFixed(2)
        }));
    };

    const handleAddItem = () => {
        if (!selectedItemToAdd || itemQuantity <= 0) {
            alert('Lütfen geçerli bir öğe seçin ve miktar girin.');
            return;
        }

        // Zaten ekli mi kontrol et
        const existingIndex = items.findIndex(item => item.id === selectedItemToAdd.id && item.type === selectedItemToAdd.type);
        let updatedItems;

        if (existingIndex > -1) {
            // Eğer zaten varsa, miktarını güncelle
            updatedItems = [...items];
            updatedItems[existingIndex].quantity += itemQuantity;
            setItems(updatedItems);
        } else {
            // Yeni öğe olarak ekle
            const newItem = { ...selectedItemToAdd, quantity: itemQuantity };
            updatedItems = [...items, newItem];
            setItems(updatedItems);

            // Yeni eklenen parça için mevcut maliyet bilgilerini kullan (API çağrısı kaldırıldı)
            // Not: Yeni eklenen parçalar için maliyet bilgisi henüz mevcut değil, bu normal
        }

        // Toplam üretim maliyetini yeniden hesapla
        setTimeout(() => {
            calculateTotalProductionCost(updatedItems, itemCosts);
        }, 100);

        // Formu sıfırla
        setSelectedItemToAdd(null);
        setItemSearchTerm('');
        setItemQuantity(1);
    };

    const handleRemoveItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);

        // Toplam üretim maliyetini yeniden hesapla
        setTimeout(() => {
            calculateTotalProductionCost(newItems, itemCosts);
        }, 100);
    };

    const handleQuantityChange = (index, newQuantity) => {
        const quantity = Math.max(1, parseInt(newQuantity) || 1); // Minimum 1 adet
        const newItems = items.map((item, i) => i === index ? { ...item, quantity } : item);
        setItems(newItems);

        // Toplam üretim maliyetini yeniden hesapla
        calculateTotalProductionCost(newItems, itemCosts);
    };

    // Parça detayına gitme fonksiyonu
    const handleGoToPartDetail = (parca) => {
        const partCode = parca?.name || parca?.id;
        if (partCode) {
            navigate(`/parcalar/${encodeURIComponent(partCode)}`);
        }
    };

    // İş emri oluşturma fonksiyonları
    const handleOpenIsEmriDialog = (parca) => {
        setSelectedParcaForIsEmri(parca);
        setIsEmriDialogOpen(true);
    };

    const handleCloseIsEmriDialog = () => {
        setIsEmriDialogOpen(false);
        setSelectedParcaForIsEmri(null);
    };

    const handleIsEmriCreated = () => {
        handleCloseIsEmriDialog();
        // Başarı mesajı göster (opsiyonel)
        alert('İş emri başarıyla oluşturuldu!');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!bomData.name) {
            setError('BOM adı zorunludur.');
            return;
        }
        setSaving(true);
        setError(null);

        const payload = {
            name: bomData.name,
            bom_aciklamasi: bomData.description,
            items: items,
            uretim_maliyeti: calculatedProductionCost,
            tedarik_maliyeti: bomData.tedarik_maliyeti ? parseFloat(bomData.tedarik_maliyeti) : null,
            tedarikci_firma: bomData.tedarikci_firma || null
        };

        try {
            if (isEditMode) {
                await axios.put(`/api/boms/${id}`, payload);
            } else {
                await axios.post('/api/boms', payload);
            }
            navigate('/boms');
        } catch (err) {
            console.error('BOM kaydedilirken hata:', err);
            setError(`BOM kaydedilirken bir hata oluştu: ${err.response?.data?.message || err.message}`);
            setSaving(false);
        }
    };

    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/boms')}
                    sx={{ mr: 2 }}
                >
                    Geri
                </Button>
                <Typography variant="h5" component="h1">
                    {isEditMode ? 'BOM Düzenle' : 'Yeni BOM Ekle'}
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    {/* Sol Taraf: BOM Bilgileri */}
                    <Grid item xs={12} md={5}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>BOM Bilgileri</Typography>
                                <TextField
                                    name="name"
                                    label="BOM Adı"
                                    value={bomData.name}
                                    onChange={handleInputChange}
                                    fullWidth
                                    required
                                    margin="normal"
                                />
                                <TextField
                                    name="description"
                                    label="Açıklama"
                                    value={bomData.description}
                                    onChange={handleInputChange}
                                    fullWidth
                                    multiline
                                    rows={4}
                                    margin="normal"
                                />

                                {/* Maliyet Bilgileri */}
                                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                                    Maliyet Bilgileri
                                </Typography>
                                <Typography variant="caption" color="info.main" sx={{ mb: 2, display: 'block' }}>
                                    💡 Üretim maliyeti BOM içeriğindeki parçaların toplam maliyeti olarak otomatik hesaplanır
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            name="uretim_maliyeti"
                                            label="Üretim Maliyeti ($) - Otomatik Hesaplanan"
                                            type="number"
                                            value={calculatedProductionCost.toFixed(2)}
                                            fullWidth
                                            inputProps={{
                                                readOnly: true
                                            }}
                                            margin="normal"
                                            helperText="Bu değer BOM içeriğindeki parça maliyetlerinin toplamıdır"
                                            sx={{
                                                '& .MuiInputBase-input': {
                                                    backgroundColor: '#f5f5f5',
                                                    color: '#1976d2',
                                                    fontWeight: 'bold'
                                                }
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            name="tedarik_maliyeti"
                                            label="Tedarik Maliyeti ($)"
                                            type="number"
                                            value={bomData.tedarik_maliyeti}
                                            onChange={handleInputChange}
                                            fullWidth
                                            inputProps={{
                                                min: 0,
                                                step: "0.01"
                                            }}
                                            margin="normal"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            name="tedarikci_firma"
                                            label="Tedarikçi Firma"
                                            value={bomData.tedarikci_firma}
                                            onChange={handleInputChange}
                                            fullWidth
                                            margin="normal"
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Sağ Taraf: İçerik Yönetimi */}
                    <Grid item xs={12} md={7}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>BOM İçeriği</Typography>

                                {/* Öğe Ekleme Alanı */}
                                <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                    <Grid item xs={12} sm={3}>
                                        <FormControl fullWidth margin="none">
                                            <InputLabel>Öğe Tipi</InputLabel>
                                            <Select
                                                value={itemTypeToAdd}
                                                label="Öğe Tipi"
                                                onChange={(e) => {
                                                    setItemTypeToAdd(e.target.value);
                                                    setSelectedItemToAdd(null);
                                                    setItemSearchTerm('');
                                                    setSelectedParcaObj(null);
                                                }}
                                            >
                                                <MenuItem value="PART">Parça</MenuItem>
                                                <MenuItem value="BOM">BOM (Grup)</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={5}>
                                        {itemTypeToAdd === 'PART' ? (
                                            <ParcaSecici
                                                selectedParca={selectedParcaObj}
                                                onSec={(parca) => {
                                                    setSelectedParcaObj(parca);
                                                    const kod = parca?.parcaKodu || parca?.parca_kodu;
                                                    if (kod) {
                                                        setSelectedItemToAdd({
                                                            id: kod,
                                                            name: kod,
                                                            type: 'PART'
                                                        });
                                                    } else {
                                                        setSelectedItemToAdd(null);
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <Autocomplete
                                                fullWidth
                                                options={searchOptions}
                                                getOptionLabel={(option) => option.name || ''}
                                                isOptionEqualToValue={(option, value) => option.id === value.id && option.type === value.type}
                                                value={selectedItemToAdd}
                                                inputValue={itemSearchTerm}
                                                onInputChange={(event, newInputValue) => {
                                                    setItemSearchTerm(newInputValue);
                                                }}
                                                onChange={(event, newValue) => {
                                                    setSelectedItemToAdd(newValue);
                                                }}
                                                loading={searching}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label={itemTypeToAdd === 'PART' ? 'Parça Ara (Kod)' : 'BOM Ara (İsim)'}
                                                        InputProps={{
                                                            ...params.InputProps,
                                                            endAdornment: (
                                                                <>
                                                                    {searching ? <CircularProgress color="inherit" size={20} /> : null}
                                                                    {params.InputProps.endAdornment}
                                                                </>
                                                            ),
                                                        }}
                                                    />
                                                )}
                                                disableListWrap
                                                openOnFocus
                                                filterOptions={(options, state) => {
                                                    if (state.inputValue === '') return options;
                                                    return options.filter(option =>
                                                        option.name.toLowerCase().includes(state.inputValue.toLowerCase())
                                                    );
                                                }}
                                                popupIcon={null}
                                            />
                                        )}
                                    </Grid>
                                    <Grid item xs={6} sm={2}>
                                        <TextField
                                            label="Adet"
                                            type="number"
                                            value={itemQuantity}
                                            onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                            InputProps={{ inputProps: { min: 1 } }}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid item xs={6} sm={2}>
                                        <Button
                                            variant="contained"
                                            startIcon={<AddIcon />}
                                            onClick={handleAddItem}
                                            disabled={!selectedItemToAdd || saving}
                                            fullWidth
                                            sx={{
                                                height: '56px',
                                                backgroundColor: (!selectedItemToAdd || saving) ? undefined : 'success.main',
                                                '&:hover': {
                                                    backgroundColor: (!selectedItemToAdd || saving) ? undefined : 'success.dark'
                                                }
                                            }}
                                        >
                                            {!selectedItemToAdd ? 'Parça Seçin' : saving ? 'Kaydediliyor...' : 'Ekle'}
                                        </Button>
                                    </Grid>
                                </Grid>

                                {/* Eklenen Öğeler Listesi */}
                                <Typography variant="subtitle1" sx={{ mt: 2 }}>Eklenen Öğeler:</Typography>
                                {items.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary">Henüz öğe eklenmedi.</Typography>
                                ) : (
                                    <List dense>
                                        {items.map((item, index) => (
                                            <ListItem
                                                key={`${item.type}-${item.name || item.id}-${index}`}
                                                divider
                                                sx={{ 
                                                    display: 'flex', 
                                                    alignItems: 'flex-start',
                                                    py: 2,
                                                    minHeight: 420
                                                }}
                                            >
                                                {/* Parça resmi sadece PART/PARCA için göster */}
                                                {(item.type === 'PART' || item.type === 'PARCA') && (
                                                    <div style={{ 
                                                        marginRight: 24, 
                                                        flexShrink: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <BomPartImage parcaKodu={item.name || item.id} parcaAdi={item.name} />
                                                    </div>
                                                )}
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flexDirection: 'column' }}>
                                                            <Typography
                                                                component="span"
                                                                sx={{
                                                                    cursor: (item.type === 'PART' || item.type === 'PARCA') ? 'pointer' : 'default',
                                                                    color: (item.type === 'PART' || item.type === 'PARCA') ? 'primary.main' : 'inherit',
                                                                    textDecoration: (item.type === 'PART' || item.type === 'PARCA') ? 'underline' : 'none',
                                                                    '&:hover': (item.type === 'PART' || item.type === 'PARCA') ? {
                                                                        backgroundColor: 'rgba(25, 118, 210, 0.04)'
                                                                    } : {}
                                                                }}
                                                                onClick={() => {
                                                                    if (item.type === 'PART' || item.type === 'PARCA') {
                                                                        handleGoToPartDetail(item);
                                                                    }
                                                                }}
                                                            >
                                                                {item.name}
                                                            </Typography>
                                                            {(item.type === 'PART' || item.type === 'PARCA') && (
                                                                <IconButton
                                                                    size="small"
                                                                    color="primary"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenIsEmriDialog(item);
                                                                    }}
                                                                    sx={{ ml: 1 }}
                                                                    title="İş Emri Oluştur"
                                                                >
                                                                    <WorkIcon fontSize="small" />
                                                                </IconButton>
                                                            )}
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <Box>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {(item.type === 'PART' || item.type === 'PARCA') ? 'Parça - Detay için tıklayın' : 'BOM (Grup)'}
                                                            </Typography>
                                                            {/* Maliyet bilgilerini göster - GÜNCELLENMİŞ MANTIK */}
                                                            {(item.type === 'PART' || item.type === 'PARCA') && (() => {
                                                                const parcaKodu = item.name; // BOM yanıtında name alanı parça kodunu içeriyor
                                                                const costInfo = itemCosts[parcaKodu];
                                                                return (
                                                                    <Box sx={{ mt: 1 }}>
                                                                        <Typography variant="caption" color="primary.main" sx={{ fontWeight: 'bold' }}>
                                                                            💰 Birim Maliyet: ${costInfo?.unitCostUSD?.toFixed(2) || '0.00'}
                                                                            {costInfo?.costSource && ` (${costInfo.costSource})`}
                                                                            {costInfo?.isManufactured !== undefined ?
                                                                                (costInfo.isManufactured ?
                                                                                    ' (İmal)' :
                                                                                    ' (Tedarik)') :
                                                                                ' (Hesaplanıyor...)'
                                                                            }
                                                                        </Typography>
                                                                        <br />
                                                                        <Typography variant="caption" color="success.main" sx={{ fontWeight: 'bold' }}>
                                                                            📊 Toplam: ${((costInfo?.unitCostUSD || 0) * (item.quantity || 1)).toFixed(2)}
                                                                        </Typography>
                                                                        {/* Maliyet detaylarını göster */}
                                                                        {costInfo?.details && (
                                                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', mt: 0.5 }}>
                                                                                {costInfo.details.internalCost > 0 && `Şirket İçi: $${costInfo.details.internalCost} `}
                                                                                {costInfo.details.subcontractCost > 0 && `Fason: $${costInfo.details.subcontractCost} `}
                                                                                {costInfo.details.procurementCost > 0 && `Tedarik: $${costInfo.details.procurementCost}`}
                                                                            </Typography>
                                                                        )}
                                                                    </Box>
                                                                );
                                                            })()}
                                                        </Box>
                                                    }
                                                    sx={{ flexGrow: 1, mr: 2 }}
                                                />
                                                <TextField
                                                    label="Adet"
                                                    type="number"
                                                    size="small"
                                                    value={item.quantity}
                                                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                    InputProps={{ inputProps: { min: 1 } }}
                                                    sx={{ width: '80px', mr: 1 }}
                                                    disabled={saving}
                                                />
                                                <ListItemSecondaryAction>
                                                    <IconButton
                                                        edge="end"
                                                        aria-label="delete"
                                                        onClick={() => handleRemoveItem(index)}
                                                        disabled={saving}
                                                        color="error"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                        ))}
                                    </List>
                                )}

                                {/* Toplam Maliyet Özeti - YENİ MANTIK */}
                                {items.length > 0 && (() => {
                                    let totalManufacturingCost = 0;
                                    let totalProcurementCost = 0;

                                    items.forEach(item => {
                                        if (item.type === 'PART' || item.type === 'PARCA') {
                                            const parcaKodu = item.name; // BOM yanıtında name alanı parça kodunu içeriyor
                                            const costInfo = itemCosts[parcaKodu];
                                            if (costInfo) {
                                                const itemTotalCost = (costInfo.unitCostUSD || 0) * (item.quantity || 1);
                                                if (costInfo.isManufactured) {
                                                    totalManufacturingCost += itemTotalCost;
                                                } else {
                                                    totalProcurementCost += itemTotalCost;
                                                }
                                            }
                                        }
                                    });

                                    const totalCost = totalManufacturingCost + totalProcurementCost;

                                    return (
                                        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                            <Typography variant="h6" gutterBottom color="primary.main">
                                                📊 Maliyet Özeti
                                            </Typography>
                                            <Grid container spacing={2}>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2">
                                                        <strong>Üretim Maliyeti:</strong> ${totalManufacturingCost.toFixed(2)}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2">
                                                        <strong>Tedarik Maliyeti:</strong> ${totalProcurementCost.toFixed(2)}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Typography variant="h6" color="success.main">
                                                        <strong>Toplam BOM Maliyeti: ${totalCost.toFixed(2)}</strong>
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                    </Grid>
                    {/* Kaydet Butonu */}
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                            disabled={saving || !bomData.name}
                        >
                            {saving ? 'Kaydediliyor...' : (isEditMode ? 'Güncelle' : 'Kaydet')}
                        </Button>
                    </Grid>
                </Grid>
            </form>
            
            {/* İş Emri Oluşturma Dialog'u */}
            {isEmriDialogOpen && selectedParcaForIsEmri && (
                <IsEmriEkleForm
                    open={isEmriDialogOpen}
                    onClose={handleCloseIsEmriDialog}
                    onSubmit={handleIsEmriCreated}
                    preSelectedParcaKodu={selectedParcaForIsEmri.name || selectedParcaForIsEmri.id}
                />
            )}
        </Box>
    );
}

// Parça resmi getiren ve popup açan yardımcı bileşen
function BomPartImage({ parcaKodu, parcaAdi }) {
  const [foto, setFoto] = React.useState(null);
  const [popupOpen, setPopupOpen] = React.useState(false);
  const [popupAnchor, setPopupAnchor] = React.useState(null);
  const popupTimer = React.useRef();

  React.useEffect(() => {
    let aktif = true;
    if (!parcaKodu) {
      console.log('BomPartImage: parcaKodu boş, çıkıyorum');
      return;
    }
    console.log('BomPartImage: Fetching image for parcaKodu:', parcaKodu, 'parcaAdi:', parcaAdi);
    axios.get(`/api/parcalar?aramaMetni=${encodeURIComponent(parcaKodu)}`)
      .then(res => {
        console.log('BomPartImage: API response:', res.data);
        let arr = Array.isArray(res.data) ? res.data : res.data.parcalar || [];
        console.log('BomPartImage: Parsed array:', arr.length, 'items');
        const matched = arr.find(p => p.parcaKodu === parcaKodu || p.parcaAdi === parcaAdi) || arr[0];
        console.log('BomPartImage: Matched part:', matched);
        if (matched && matched.foto_path && aktif) {
          const fotoPath = getFotoPath(matched.foto_path);
          console.log('BomPartImage: Setting foto path:', fotoPath);
          setFoto(fotoPath);
        } else if (matched && aktif) {
          console.log('BomPartImage: Part found but no foto_path');
        } else if (aktif) {
          console.log('BomPartImage: No matching part found');
        }
      })
      .catch(err => {
        console.error('BomPartImage: Error fetching part image:', err);
      });
    return () => { aktif = false; };
  }, [parcaKodu, parcaAdi]);

  const handleMouseEnter = (e) => {
    clearTimeout(popupTimer.current); // Önceki timer'ı temizle
    popupTimer.current = setTimeout(() => {
      setPopupAnchor(e.currentTarget);
      setPopupOpen(true);
    }, 300); // Daha hızlı yanıt için 0.3 saniye
  };
  const handleMouseLeave = () => {
    clearTimeout(popupTimer.current);
    // Popup'tan mouse çıkınca kısa gecikme ile kapat
    setTimeout(() => {
      setPopupOpen(false);
      setPopupAnchor(null);
    }, 100);
  };

  if (!foto) return (
    <div style={{ 
      width: 400, 
      height: 400, 
      background: 'linear-gradient(45deg, #f5f5f5, #e0e0e0)', 
      borderRadius: 4, 
      border: '1px solid #ccc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '48px',
      color: '#999'
    }}>
      📷
    </div>
  );

  return (
    <>
      <img
        src={foto}
        alt={parcaKodu}
        style={{ 
          width: 400, 
          height: 400, 
          objectFit: 'contain', 
          borderRadius: 4, 
          border: '1px solid #ccc', 
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          background: '#f5f5f5'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      {popupOpen && popupAnchor && (
        <div
          style={{
            position: 'fixed',
            zIndex: 2000,
            left: Math.min(popupAnchor.getBoundingClientRect().right + 16, window.innerWidth - 520), // Ekran sınırlarını kontrol et
            top: Math.max(16, Math.min(popupAnchor.getBoundingClientRect().top, window.innerHeight - 520)), // Dikey sınır kontrolü
            background: 'white',
            border: '2px solid #1976d2',
            borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            padding: 12,
            width: 500, // Daha büyük genişlik
            height: 500, // Daha büyük yükseklik
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={() => {
            clearTimeout(popupTimer.current);
            setPopupOpen(true);
          }}
          onMouseLeave={handleMouseLeave}
        >
          <img
            src={foto}
            alt={`${parcaKodu} - ${parcaAdi}`}
            style={{ 
              maxWidth: '100%', 
              maxHeight: '85%', 
              objectFit: 'contain', 
              borderRadius: 6,
              border: '1px solid #ddd',
              background: '#f9f9f9'
            }}
          />
          <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', color: '#666' }}>
            {parcaKodu} - {parcaAdi}
          </Typography>
        </div>
      )}
    </>
  );
}

export default BomForm;