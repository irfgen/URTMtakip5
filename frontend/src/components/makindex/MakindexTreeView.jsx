import React, { useEffect, memo, useState, useMemo } from 'react';
import {
  Box,
  Collapse,
  IconButton,
  Typography,
  Tooltip,
  CircularProgress,
  Fade,
  Switch,
  FormControlLabel,
  Paper,
  Chip,
} from '@mui/material';
import {
  ExpandMore,
  ChevronRight,
  Folder,
  Business,
  Description,
  Build,
  Warning,
  ViewList,
  ViewStream,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMakinalarBySinifId,
  fetchGruplarByMakinaId,
  fetchParcalarByGrupId,
  toggleNodeExpansion,
} from '../../store/slices/makindexSlice';
import MakinaSinifiNode from './MakinaSinifiNode';
import MakinaNode from './MakinaNode';
import GrupNode from './GrupNode';
import ParcaNode from './ParcaNode';
import VirtualizedTreeView from './VirtualizedTreeView';

const MakindexTreeView = memo(({
  mobile = false,
  height = 600,
  onNodeSelect,
  onEditSinif,
  onDeleteSinif,
  showActions = false,
}) => {
  const dispatch = useDispatch();
  const [useVirtualScroll, setUseVirtualScroll] = useState(false);
  const {
    siniflar,
    makinalar,
    gruplar,
    parcalar,
    expandedNodes,
    selectedNode,
    loading,
    filters
  } = useSelector((state) => state.makindex);

  // Filter data based on current filters
  const filteredSiniflar = useMemo(() => {
    return siniflar.filter(sinif => {
      if (filters.makinaSinifi !== 'hepsi' && sinif.ad !== filters.makinaSinifi) {
        return false;
      }
      return true;
    });
  }, [siniflar, filters.makinaSinifi]);

  // Calculate total node count for performance optimization
  const totalNodeCount = useMemo(() => {
    let count = 0;

    filteredSiniflar.forEach(sinif => {
      count++;
      const sinifNodeId = `sinif-${sinif.id}`;

      if (expandedNodes.has(sinifNodeId) && makinalar[sinif.id]) {
        makinalar[sinif.id].forEach(makina => {
          count++;
          const makinaNodeId = `makina-${makina.makina_id}`;

          if (expandedNodes.has(makinaNodeId) && gruplar[makina.makina_id]) {
            gruplar[makina.makina_id].forEach(grup => {
              count++;
              const grupNodeId = `grup-${grup.id}`;

              if (expandedNodes.has(grupNodeId) && parcalar[grup.id]) {
                count += parcalar[grup.id].length;
              }
            });
          }
        });
      }
    });

    return count;
  }, [filteredSiniflar, makinalar, gruplar, parcalar, expandedNodes]);

  // Auto-enable virtual scrolling for large trees
  // TEMPORARILY DISABLED for RFRO_BASKI debugging
  useEffect(() => {
    // Virtual scroll disabled to investigate RFRO_BASKI error
    setUseVirtualScroll(false);

    // Original logic (disabled):
    // if (totalNodeCount > 100 && !mobile) {
    //   setUseVirtualScroll(true);
    // } else if (totalNodeCount <= 100) {
    //   setUseVirtualScroll(false);
    // }
  }, [totalNodeCount, mobile]);

  // Restore expanded nodes on mount
  useEffect(() => {
    dispatch({ type: 'makindex/restoreExpandedNodes' });
  }, [dispatch]);

  // Handle node expansion
  const handleNodeToggle = (nodeId, isExpanded) => {
    dispatch(toggleNodeExpansion(nodeId));

    // Lazy load data when expanding
    if (!isExpanded) {
      const nodeType = nodeId.split('-')[0];
      const id = nodeId.split('-').slice(1).join('-'); // Tüm ID'yi al, sadece ilk kısmı değil

      console.log('🔄 Node tıklandı, nodeId:', nodeId);
      console.log('🔄 nodeType:', nodeType);
      console.log('🔄 id:', id);

      switch (nodeType) {
        case 'sinif':
          dispatch(fetchMakinalarBySinifId(id));
          break;
        case 'makina':
          dispatch(fetchGruplarByMakinaId(id));
          break;
        case 'grup':
          dispatch(fetchParcalarByGrupId(id));
          break;
      }
    }
  };

  // Check if node has children (for showing expand icon)
  const hasChildren = (nodeType) => {
    switch (nodeType) {
      case 'sinif':
        return true; // Siniflar her zaman makinalar içerebilir
      case 'makina':
        return true; // Makinalar her zaman grup içerebilir
      case 'grup':
        return true; // Gruplar her zaman parçalar içerebilir
      default:
        return false;
    }
  };

  
  // Mobile-friendly styling
  const mobileStyles = mobile ? {
    py: 0.5,
    touchAction: 'pan-y',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  } : { py: 1 };

  const itemHeight = mobile ? 56 : 48; // Larger touch targets for mobile
  const indentSize = mobile ? 16 : 24; // Less indentation for mobile

  return (
    <Box sx={{ width: '100%', ...mobileStyles }}>
      {/* Performance controls and info */}
      {!mobile && (
        <Paper sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={useVirtualScroll}
                    onChange={(e) => setUseVirtualScroll(e.target.checked)}
                    disabled={mobile}
                    size="small"
                  />
                }
                label="Sanal Kaydırma"
              />
              <Chip
                icon={useVirtualScroll ? <ViewStream /> : <ViewList />}
                label={`${totalNodeCount} düğüm`}
                size="small"
                color={totalNodeCount > 100 ? 'warning' : 'default'}
                variant="outlined"
              />
              {totalNodeCount > 100 && (
                <Chip
                  label="Performans modu"
                  size="small"
                  color="info"
                  variant="filled"
                />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {useVirtualScroll ? 'Sanal kaydırma aktif (hızlı)' : 'Normal mod (tam ağaç)'}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Render tree items */}
      {!useVirtualScroll && filteredSiniflar.map((sinif) => {
        const nodeId = `sinif-${sinif.id}`;
        const isExpanded = expandedNodes.has(nodeId);
        const hasChildrenNodes = hasChildren('sinif');

        return (
          <Box key={nodeId} sx={{ mb: 0.5 }}>
            <MakinaSinifiNode
              sinif={sinif}
              isExpanded={isExpanded}
              hasChildren={hasChildrenNodes}
              isSelected={selectedNode?.id === nodeId && selectedNode?.type === 'sinif'}
              onToggle={() => handleNodeToggle(nodeId, isExpanded)}
              onEdit={onEditSinif}
              onDelete={onDeleteSinif}
              showActions={showActions}
              mobile={mobile}
              height={itemHeight}
            />

            {/* Render makinalar when expanded */}
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ ml: mobile ? 2 : 3, pl: mobile ? 1 : 2, borderLeft: '2px solid #e0e0e0' }}>
                {loading.makinalar[sinif.id] ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      Makinalar yükleniyor...
                    </Typography>
                  </Box>
                ) : (
                  makinalar[sinif.id]?.map((makina) => {
                    const makinaNodeId = `makina-${makina.makina_id}`;
                    const isMakinaExpanded = expandedNodes.has(makinaNodeId);
                    const hasMakinaChildren = hasChildren('makina');

                    return (
                      <Box key={makinaNodeId} sx={{ mb: 0.5 }}>
                        <MakinaNode
                          makina={makina}
                          isExpanded={isMakinaExpanded}
                          hasChildren={hasMakinaChildren}
                          isSelected={selectedNode?.id === makinaNodeId && selectedNode?.type === 'makina'}
                          onToggle={() => handleNodeToggle(makinaNodeId, isMakinaExpanded)}
                          mobile={mobile}
                          height={itemHeight}
                        />

                        {/* Render BOMs when makina expanded */}
                        <Collapse in={isMakinaExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ ml: mobile ? 2 : 3, pl: mobile ? 1 : 2, borderLeft: '2px solid #e0e0e0' }}>
                            {loading.gruplar[makina.makina_id] ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
                                <CircularProgress size={20} />
                                <Typography variant="body2" sx={{ ml: 2 }}>
                                  Gruplar yükleniyor...
                                </Typography>
                              </Box>
                            ) : (
                              (() => {
                                const makinaGruplar = gruplar[makina.makina_id];
                                console.log('🏭 Makina ID:', makina.makina_id);
                                console.log('🏭 Makina Adı:', makina.name);
                                console.log('📊 Grup sayısı:', makinaGruplar?.length || 0);
                                console.log('📊 Gruplar:', makinaGruplar);

                                return makinaGruplar?.map((grup) => {
                                  const grupNodeId = `grup-${grup.id}`;
                                  const isGrupExpanded = expandedNodes.has(grupNodeId);
                                  const hasGrupChildren = hasChildren('grup');

                                  return (
                                    <Box key={grupNodeId} sx={{ mb: 0.5 }}>
                                      <GrupNode
                                        grup={grup}
                                        isExpanded={isGrupExpanded}
                                        hasChildren={hasGrupChildren}
                                        isSelected={selectedNode?.id === grupNodeId && selectedNode?.type === 'grup'}
                                        onToggle={() => handleNodeToggle(grupNodeId, isGrupExpanded)}
                                        mobile={mobile}
                                        height={itemHeight}
                                      />

                                      {/* Render parçalar when grup expanded */}
                                      <Collapse in={isGrupExpanded} timeout="auto" unmountOnExit>
                                        <Box sx={{ ml: mobile ? 2 : 3, pl: mobile ? 1 : 2, borderLeft: '2px solid #e0e0e0' }}>
                                          {loading.parcalar[grup.id] ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
                                              <CircularProgress size={20} />
                                              <Typography variant="body2" sx={{ ml: 2 }}>
                                                Parçalar yükleniyor...
                                              </Typography>
                                            </Box>
                                          ) : (
                                            parcalar[grup.id]?.map((parca) => (
                                              <Box key={`parca-${parca.id}_${grup.id}`} sx={{ mb: 0.5 }}>
                                                <ParcaNode
                                                  parca={parca}
                                                  isSelected={selectedNode?.id === parca.parcaKodu && selectedNode?.type === 'parca'}
                                                  mobile={mobile}
                                                  height={itemHeight}
                                                  onSelect={() => {
                                                    // Handle parça selection with callback
                                                    if (onNodeSelect) {
                                                      onNodeSelect('parca', parca.parcaKodu, parca);
                                                    } else {
                                                      // Fallback behavior
                                                      if (mobile) {
                                                        window.location.href = `/mobile/parcalar/${parca.parcaKodu}`;
                                                      } else {
                                                        window.open(`/parcalar/${parca.parcaKodu}`, '_blank');
                                                      }
                                                    }
                                                  }}
                                                />
                                              </Box>
                                            ))
                                          )}
                                        </Box>
                                      </Collapse>
                                    </Box>
                                  );
                                }) || [];
                              })()
                            )}
                          </Box>
                        </Collapse>
                      </Box>
                    );
                  })
                )}
              </Box>
            </Collapse>
          </Box>
        );
      })}

      {/* Use virtual scrolling for large datasets */}
      {useVirtualScroll && !mobile && (
        <VirtualizedTreeView
          height={height || 600}
          mobile={mobile}
          onNodeSelect={onNodeSelect}
        />
      )}

      {/* Show empty state */}
      {filteredSiniflar.length === 0 && !loading.siniflar && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
            color: 'text.secondary',
          }}
        >
          <Build sx={{ fontSize: 48, mb: 2, color: 'text.disabled' }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Makina sınıfı bulunamadı
          </Typography>
          <Typography variant="body2" color="text.disabled">
            {filters.makinaSinifi !== 'hepsi'
              ? `'${filters.makinaSinifi}' filtresine uygun sınıf bulunmuyor`
              : 'Henüz makina sınıfı eklenmemiş'
            }
          </Typography>
        </Box>
      )}

      {/* Show loading state */}
      {loading.siniflar && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
          }}
        >
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Makina sınıfları yükleniyor...
          </Typography>
        </Box>
      )}
    </Box>
  );
});

MakindexTreeView.displayName = 'MakindexTreeView';

export default MakindexTreeView;