import React, { useEffect, memo, useMemo, useCallback, useState } from 'react';
import { List } from 'react-window';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  CircularProgress,
  Container,
  Paper,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import {
  fetchMakinalarBySinifId,
  fetchGruplarByMakinaId,
  fetchParcalarByGrupId,
  toggleNodeExpansion,
} from '../../store/slices/makindexSlice';

// Helper function to build flat tree data
const buildFlatTreeData = (siniflar, makinalar, gruplar, parcalar, expandedNodes) => {
  const flatData = [];

  // Guard against undefined/null parameters
  if (!siniflar || !Array.isArray(siniflar)) {
    console.warn('buildFlatTreeData: siniflar is invalid');
    return flatData;
  }

  if (!makinalar) {
    console.warn('buildFlatTreeData: makinalar is invalid');
    return flatData;
  }

  if (!gruplar) {
    console.warn('buildFlatTreeData: gruplar is invalid');
    return flatData;
  }

  if (!parcalar) {
    console.warn('buildFlatTreeData: parcalar is invalid');
    return flatData;
  }

  if (!expandedNodes) {
    console.warn('buildFlatTreeData: expandedNodes is invalid');
    return flatData;
  }

  siniflar.forEach((sinif) => {
    const sinifNodeId = `sinif-${sinif.id}`;
    const isSinifExpanded = expandedNodes.has(sinifNodeId);

    // Add sınıf node
    flatData.push({
      id: sinifNodeId,
      type: 'sinif',
      data: sinif,
      level: 0,
      hasChildren: true,
      isExpanded: isSinifExpanded,
    });

    // Add children if expanded
    if (isSinifExpanded && makinalar[sinif.id]) {
      makinalar[sinif.id].forEach((makina) => {
        const makinaNodeId = `makina-${makina.makina_id}`;
        const isMakinaExpanded = expandedNodes.has(makinaNodeId);

        // Add makina node
        flatData.push({
          id: makinaNodeId,
          type: 'makina',
          data: makina,
          level: 1,
          hasChildren: true,
          isExpanded: isMakinaExpanded,
          parentId: sinifNodeId,
        });

        // Add grup children if expanded
        if (isMakinaExpanded && gruplar[makina.makina_id]) {
          gruplar[makina.makina_id].forEach((grup) => {
            const grupNodeId = `grup-${grup.id}`;
            const isGrupExpanded = expandedNodes.has(grupNodeId);

            // Add grup node
            flatData.push({
              id: grupNodeId,
              type: 'grup',
              data: grup,
              level: 2,
              hasChildren: true,
              isExpanded: isGrupExpanded,
              parentId: makinaNodeId,
            });

            // Add parça children if expanded
            if (isGrupExpanded && parcalar[grup.id]) {
              // Log parça data for debugging RFRO_BASKI
              if (grup.ad && grup.ad.includes('RFRO_BASKI')) {
                console.log('🔍 RFRO_BASKI parça sayısı:', parcalar[grup.id].length);
                console.log('🔍 RFRO_BASKI parcalar:', parcalar[grup.id]);
              }

              parcalar[grup.id].forEach((parca, idx) => {
                // Validate parça object before adding
                if (!parca || typeof parca !== 'object') {
                  console.error(`❌ Invalid parça at index ${idx} in grup ${grup.id}:`, parca);
                  return; // Skip this parça
                }

                if (!parca.id) {
                  console.error(`❌ Parça missing id at index ${idx} in grup ${grup.id}:`, parca);
                  return; // Skip this parça
                }

                // Benzersiz ID için parca.id (bom_parcalar tablosundan gelen unique ID) kullan
                flatData.push({
                  id: `parca-${parca.id}_${grup.id}`,
                  type: 'parca',
                  data: parca,
                  level: 3,
                  hasChildren: false,
                  isExpanded: false,
                  parentId: grupNodeId,
                });
              });
            }
          });
        }
      });
    }
  });

  return flatData;
};;

// Virtual tree node component
const VirtualTreeNode = memo(({ index, style, data }) => {
  // Guard against undefined/null data - return empty div instead of null
  if (!data || !data.flatData) {
    console.warn('VirtualTreeNode: data is invalid', { data });
    return <div style={style} />;
  }

  const { flatData, dispatch, expandedNodes, selectedNode, onNodeSelect, onToggle } = data;
  const node = flatData[index];

  if (!node) {
    // Index out of bounds - return empty div instead of null
    return <div style={style} />;
  }

  const { type, data: nodeData, level, hasChildren, isExpanded } = node;
  const nodeId = node.id;

  // Extra validation for nodeData - prevent Object.values() errors
  if (!nodeData || typeof nodeData !== 'object') {
    console.error('❌ VirtualTreeNode: nodeData is invalid for node:', nodeId, nodeData);
    return <div style={style} />;
  }

  // Parça tipi için isSelected kontrolü - node ID artık grup ID'sini içeriyor
  // Use optional chaining for safer access
  const parcaKodu = nodeData?.parcaKodu || nodeData?.id || '';
  const isSelected = type === 'parca'
    ? selectedNode?.id === parcaKodu && selectedNode?.type === type
    : selectedNode?.id === nodeId && selectedNode?.type === type;

  const handleToggle = useCallback(() => {
    if (hasChildren && onToggle) {
      onToggle(nodeId, type);
    }
  }, [nodeId, type, hasChildren, onToggle]);

  const handleSelect = useCallback(() => {
    // Safely access parcaKodu with fallback
    const parcaKodu = nodeData?.parcaKodu || nodeData?.id || '';

    if (type === 'parca' && onNodeSelect) {
      onNodeSelect(type, parcaKodu, nodeData);
    } else if (type === 'parca') {
      // Fallback behavior
      window.open(`/parcalar/${parcaKodu}`, '_blank');
    }
  }, [type, nodeData, onNodeSelect]);

  const renderNodeContent = () => {
    const paddingLeft = level * 24 + 16;

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: 48,
          paddingLeft: paddingLeft,
          paddingRight: 2,
          backgroundColor: isSelected ? 'action.selected' : 'transparent',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
          cursor: type === 'parca' ? 'pointer' : 'default',
        }}
        onClick={type === 'parca' ? handleSelect : undefined}
      >
        {/* Expand/Collapse Button */}
        {hasChildren && (
          <IconButton
            size="small"
            onClick={handleToggle}
            sx={{
              marginRight: 1,
              padding: 0.5,
            }}
          >
            {isExpanded ? (
              <ExpandMoreIcon fontSize="small" />
            ) : (
              <ChevronRightIcon fontSize="small" />
            )}
          </IconButton>
        )}

        {!hasChildren && (
          <Box sx={{ width: 24, marginRight: 1 }} />
        )}

        {/* Node Icon */}
        <Box sx={{ marginRight: 1, fontSize: 16 }}>
          {getNodeIcon(type)}
        </Box>

        {/* Node Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: level === 0 ? 'bold' : 'normal',
              color: getNodeColor(type),
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {getNodeLabel(type, nodeData)}
          </Typography>

          {/* Additional info for certain types */}
          {type === 'parca' && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Stok: {nodeData?.stokAdeti || 0}
              {nodeData?.kritikStok && (
                <Box component="span" sx={{ color: 'error.main', ml: 1 }}>
                  ◉ Kritik
                </Box>
              )}
            </Typography>
          )}

          {type === 'makina' && nodeData?.durum && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Durum: {nodeData.durum}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <div style={style}>
      {renderNodeContent()}
    </div>
  );
});

VirtualTreeNode.displayName = 'VirtualTreeNode';

// Helper functions
const getNodeIcon = (type) => {
  switch (type) {
    case 'sinif':
      return '🏭';
    case 'makina':
      return '⚙️';
    case 'grup':
      return '📋';
    case 'parca':
      return '🔩';
    default:
      return '📁';
  }
};

const getNodeColor = (type) => {
  switch (type) {
    case 'sinif':
      return 'primary.main';
    case 'makina':
      return 'text.primary';
    case 'grup':
      return 'info.main';
    case 'parca':
      return 'success.main';
    default:
      return 'text.primary';
  }
};

const getNodeLabel = (type, data) => {
  if (!data || typeof data !== 'object') {
    return 'Unknown';
  }

  switch (type) {
    case 'sinif':
      return data?.ad || 'Sınıf';
    case 'makina':
      return data?.ad || data?.name || 'Makina';
    case 'grup':
      return data?.ad || data?.name || 'Grup';
    case 'parca':
      return data?.parcaAdi || data?.parcaKodu || data?.id || 'Parça';
    default:
      return 'Unknown';
  }
};

const VirtualizedTreeView = memo(({ height = 600, mobile = false, onNodeSelect }) => {
  const dispatch = useDispatch();
  const {
    siniflar,
    makinalar,
    gruplar,
    parcalar,
    expandedNodes,
    selectedNode,
    loading,
    filters,
  } = useSelector((state) => {
    // Guard against undefined state
    if (!state || !state.makindex) {
      return {
        siniflar: [],
        makinalar: {},
        gruplar: {},
        parcalar: {},
        expandedNodes: new Set(),
        selectedNode: null,
        loading: { siniflar: false },
        filters: { makinaSinifi: 'hepsi' },
      };
    }
    return state.makindex;
  });

  // Restore expanded nodes on mount
  useEffect(() => {
    try {
      dispatch({ type: 'makindex/restoreExpandedNodes' });
    } catch (error) {
      console.error('restoreExpandedNodes hatası:', error);
    }
  }, [dispatch]);

  // Handle node toggle with lazy loading
  const handleToggle = useCallback((nodeId, nodeType) => {
    if (!nodeId || !nodeType) return;

    try {
      dispatch(toggleNodeExpansion(nodeId));

      // Lazy load data when expanding
      if (!expandedNodes.has(nodeId)) {
        const id = nodeId.split('-')[1];
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
    } catch (error) {
      console.error('handleToggle hatası:', error);
    }
  }, [dispatch, expandedNodes]);

  // Filter data based on current filters
  const filteredSiniflar = useMemo(() => {
    if (!siniflar || !Array.isArray(siniflar)) {
      return [];
    }

    return siniflar.filter(sinif => {
      if (filters.makinaSinifi !== 'hepsi' && sinif.ad !== filters.makinaSinifi) {
        return false;
      }
      return true;
    });
  }, [siniflar, filters.makinaSinifi]);

  // Build flat tree data for virtual list
  const flatData = useMemo(() => {
    try {
      const result = buildFlatTreeData(filteredSiniflar, makinalar, gruplar, parcalar, expandedNodes);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('buildFlatTreeData hatası:', error);
      return [];
    }
  }, [filteredSiniflar, makinalar, gruplar, parcalar, expandedNodes]);

  // Data for virtual list items - Ensure never returns undefined
  const listData = useMemo(() => {
    // Create safe object with all required properties - never undefined
    return {
      flatData: Array.isArray(flatData) ? flatData : [],
      dispatch: typeof dispatch === 'function' ? dispatch : () => {},
      expandedNodes: expandedNodes instanceof Set ? expandedNodes : new Set(),
      selectedNode: selectedNode && typeof selectedNode === 'object' ? selectedNode : null,
      onNodeSelect: typeof onNodeSelect === 'function' ? onNodeSelect : null,
      onToggle: typeof handleToggle === 'function' ? handleToggle : () => {},
    };
  }, [flatData, dispatch, expandedNodes, selectedNode, onNodeSelect, handleToggle]);

  // Show loading state
  if (loading && loading.siniflar) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height,
        }}
      >
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Makina sınıfları yükleniyor...
        </Typography>
      </Box>
    );
  }

  // Additional safety check before rendering List
  if (!Array.isArray(flatData) || flatData.length === 0) {
    return (
      <Paper sx={{ height, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
            textAlign: 'center',
            p: 3,
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {filteredSiniflar && filteredSiniflar.length === 0 ? 'Makina sınıfı bulunamadı' : 'Görüntülenecek veri bulunamadı'}
          </Typography>
          <Typography variant="body2" color="text.disabled">
            {filteredSiniflar && filteredSiniflar.length === 0 && filters && filters.makinaSinifi !== 'hepsi'
              ? `'${filters.makinaSinifi}' filtresine uygun sınıf bulunmuyor`
              : filteredSiniflar && filteredSiniflar.length === 0
              ? 'Henüz makina sınıfı eklenmemiş'
              : 'Ağaç yapısı boş veya yükleniyor'
            }
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Additional safety check for listData before passing to react-window
  if (!listData || !listData.flatData || listData.flatData.length === 0) {
    return (
      <Paper sx={{ height, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ color: 'text.secondary', p: 3 }}>
          <Typography variant="body2">Görüntülenecek veri bulunamadı</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ height, overflow: 'hidden' }}>
      <List
        height={height}
        width="100%"
        itemCount={flatData.length}
        itemSize={48}
        itemData={listData}
        overscanCount={5}
      >
        {VirtualTreeNode}
      </List>
    </Paper>
  );
});

VirtualizedTreeView.displayName = 'VirtualizedTreeView';

export default VirtualizedTreeView;