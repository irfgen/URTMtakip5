#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ÜRTM Takip - Dizin Tarama Client - Selection Management Module
v1.2.0 - Parça seçim yönetimi
"""

from typing import Dict, List, Set, Any, Optional
import logging


class SelectionManager:
    """
    Parça seçim durumunu yöneten sınıf
    """

    def __init__(self):
        """SelectionManager başlatıcısı"""
        self.selected_parts: Set[str] = set()
        self.part_data: Dict[str, Dict] = {}
        self.selection_callbacks: List[callable] = []

        # Logger kurulumu
        self.logger = logging.getLogger(f'{__name__}.SelectionManager')

    def add_callback(self, callback: callable) -> None:
        """
        Seçim değişikliği callback'i ekle

        Args:
            callback: Seçim değiştiğinde çağrılacak fonksiyon
        """
        if callback not in self.selection_callbacks:
            self.selection_callbacks.append(callback)

    def remove_callback(self, callback: callable) -> None:
        """Callback'i kaldır"""
        if callback in self.selection_callbacks:
            self.selection_callbacks.remove(callback)

    def _notify_callbacks(self) -> None:
        """Tüm callback'leri bilgilendir"""
        for callback in self.selection_callbacks:
            try:
                callback(self.get_selection_stats())
            except Exception as e:
                self.logger.error(f"Callback hata: {str(e)}")

    def set_part_data(self, part_name: str, data: Dict[str, Any]) -> None:
        """
        Parça verilerini kaydet

        Args:
            part_name: Parça adı
            data: Parça verileri (has3D, hasDrawing, hasPDF, vs.)
        """
        self.part_data[part_name] = data.copy()

    def toggle_part_selection(self, part_name: str) -> bool:
        """
        Parça seçim durumunu değiştir

        Args:
            part_name: Parça adı

        Returns:
            bool: Yeni seçim durumu (True=seçili, False=seçili değil)
        """
        if part_name in self.selected_parts:
            self.selected_parts.remove(part_name)
            selected = False
            self.logger.debug(f"Parça seçimi kaldırıldı: {part_name}")
        else:
            self.selected_parts.add(part_name)
            selected = True
            self.logger.debug(f"Parça seçildi: {part_name}")

        self._notify_callbacks()
        return selected

    def set_part_selection(self, part_name: str, selected: bool) -> None:
        """
        Parça seçim durumunu ayarla

        Args:
            part_name: Parça adı
            selected: Seçili olsun mu?
        """
        if selected:
            if part_name not in self.selected_parts:
                self.selected_parts.add(part_name)
                self._notify_callbacks()
        else:
            if part_name in self.selected_parts:
                self.selected_parts.remove(part_name)
                self._notify_callbacks()

    def is_part_selected(self, part_name: str) -> bool:
        """Parça seçili mi?"""
        return part_name in self.selected_parts

    def select_all_parts(self) -> int:
        """
        Tüm parçaları seç

        Returns:
            int: Seçilen parça sayısı
        """
        initial_count = len(self.selected_parts)
        self.selected_parts.update(self.part_data.keys())
        final_count = len(self.selected_parts)

        if final_count > initial_count:
            self.logger.info(f"Tüm parçalar seçildi: {final_count} parça")
            self._notify_callbacks()

        return final_count

    def clear_all_selections(self) -> int:
        """
        Tüm seçimleri kaldır

        Returns:
            int: Kaldırılan parça sayısı
        """
        cleared_count = len(self.selected_parts)
        self.selected_parts.clear()

        if cleared_count > 0:
            self.logger.info(f"Tüm seçimler kaldırıldı: {cleared_count} parça")
            self._notify_callbacks()

        return cleared_count

    def select_parts_by_status(self, status: str) -> int:
        """
        Durum bazlı parça seçimi

        Args:
            status: 'complete' (tam), 'partial' (kısmi), 'incomplete' (eksik)

        Returns:
            int: Seçilen parça sayısı
        """
        initial_count = len(self.selected_parts)

        for part_name, data in self.part_data.items():
            has3d = data.get('has3D', False)
            has_drawing = data.get('hasDrawing', False)
            has_pdf = data.get('hasPDF', False)

            if status == 'complete' and has3d and has_drawing and has_pdf:
                self.selected_parts.add(part_name)
            elif status == 'partial' and has3d and (has_drawing or has_pdf) and not (has_drawing and has_pdf):
                self.selected_parts.add(part_name)
            elif status == 'incomplete' and has3d and not has_drawing and not has_pdf:
                self.selected_parts.add(part_name)

        final_count = len(self.selected_parts)
        selected_count = final_count - initial_count

        if selected_count > 0:
            self.logger.info(f"{status} durumundaki parçalar seçildi: {selected_count} yeni parça")
            self._notify_callbacks()

        return selected_count

    def get_selected_parts(self) -> List[str]:
        """Seçili parçaların listesini getir"""
        return sorted(list(self.selected_parts))

    def get_selected_parts_data(self) -> List[Dict[str, Any]]:
        """
        Seçili parçaların veri listesini getir

        Returns:
            List[Dict]: Seçili parçaların tam verileri
        """
        selected_data = []
        for part_name in sorted(self.selected_parts):
            if part_name in self.part_data:
                data = self.part_data[part_name].copy()
                data['selected'] = True
                data['parcaAdi'] = part_name  # Missing key for PartDetailWindow
                selected_data.append(data)

        return selected_data

    def get_selection_stats(self) -> Dict[str, Any]:
        """
        Seçim istatistiklerini hesapla

        Returns:
            Dict: Detaylı seçim istatistikleri
        """
        total_parts = len(self.part_data)
        selected_count = len(self.selected_parts)

        if selected_count == 0:
            return {
                'total_parts': total_parts,
                'selected_count': 0,
                'selection_rate': 0.0,
                'breakdown': {
                    'complete': 0,
                    'partial': 0,
                    'incomplete': 0
                },
                'file_types': {
                    'sldprt': 0,
                    'slddrw': 0,
                    'pdf': 0
                }
            }

        # Seçili parçaları analiz et
        complete_count = 0
        partial_count = 0
        incomplete_count = 0

        sldprt_count = 0
        slddrw_count = 0
        pdf_count = 0

        for part_name in self.selected_parts:
            if part_name not in self.part_data:
                continue

            data = self.part_data[part_name]
            has3d = data.get('has3D', False)
            has_drawing = data.get('hasDrawing', False)
            has_pdf = data.get('hasPDF', False)

            # Durum analizi
            if has3d and has_drawing and has_pdf:
                complete_count += 1
            elif has3d and (has_drawing or has_pdf):
                partial_count += 1
            else:
                incomplete_count += 1

            # Dosya türü analizi
            if has3d:
                sldprt_count += 1
            if has_drawing:
                slddrw_count += 1
            if has_pdf:
                pdf_count += 1

        return {
            'total_parts': total_parts,
            'selected_count': selected_count,
            'selection_rate': selected_count / total_parts if total_parts > 0 else 0.0,
            'breakdown': {
                'complete': complete_count,
                'partial': partial_count,
                'incomplete': incomplete_count
            },
            'file_types': {
                'sldprt': sldprt_count,
                'slddrw': slddrw_count,
                'pdf': pdf_count
            }
        }

    def validate_selection(self) -> Dict[str, Any]:
        """
        Seçim durumunu doğrula

        Returns:
            Dict: Doğrulama sonucu
        """
        selected_count = len(self.selected_parts)

        if selected_count == 0:
            return {
                'valid': False,
                'message': 'En az bir parça seçilmelidir',
                'code': 'NO_PARTS_SELECTED'
            }

        # Maksimum seçim limiti (isteğe bağlı)
        max_selection = 1000000  # Config'den alınabilir
        if selected_count > max_selection:
            return {
                'valid': False,
                'message': f'En fazla {max_selection} parça seçilebilir (seçili: {selected_count})',
                'code': 'TOO_MANY_PARTS_SELECTED'
            }

        return {
            'valid': True,
            'message': f'{selected_count} parça seçili - devam edilebilir',
            'code': 'SELECTION_VALID'
        }

    def export_selection_state(self) -> Dict[str, Any]:
        """
        Seçim durumunu export et (kaydetmek için)

        Returns:
            Dict: Export edilmiş seçim durumu
        """
        return {
            'selected_parts': list(self.selected_parts),
            'part_data': self.part_data.copy(),
            'stats': self.get_selection_stats(),
            'timestamp': None  # Çağıran tarafından set edilebilir
        }

    def import_selection_state(self, state: Dict[str, Any]) -> bool:
        """
        Seçim durumunu import et

        Args:
            state: Import edilecek state

        Returns:
            bool: Import başarılı mı?
        """
        try:
            self.selected_parts = set(state.get('selected_parts', []))
            self.part_data = state.get('part_data', {}).copy()

            self.logger.info(f"Seçim durumu import edildi: {len(self.selected_parts)} seçili parça")
            self._notify_callbacks()
            return True

        except Exception as e:
            self.logger.error(f"Seçim durumu import hatası: {str(e)}")
            return False

    def clear_all_data(self) -> None:
        """Tüm verileri temizle"""
        self.selected_parts.clear()
        self.part_data.clear()
        self._notify_callbacks()
        self.logger.info("SelectionManager verileri temizlendi")


# Test fonksiyonu
def test_selection_manager():
    """SelectionManager test fonksiyonu"""
    manager = SelectionManager()

    # Test verileri ekle
    test_parts = {
        'PART_001': {'has3D': True, 'hasDrawing': True, 'hasPDF': True},
        'PART_002': {'has3D': True, 'hasDrawing': False, 'hasPDF': True},
        'PART_003': {'has3D': True, 'hasDrawing': False, 'hasPDF': False},
        'PART_004': {'has3D': True, 'hasDrawing': True, 'hasPDF': False},
    }

    for part_name, data in test_parts.items():
        manager.set_part_data(part_name, data)

    print("📊 Test verileri eklendi")
    print(f"İstatistikler: {manager.get_selection_stats()}")

    # Seçim testleri
    print("\n🔄 Seçim testleri:")
    manager.toggle_part_selection('PART_001')
    manager.toggle_part_selection('PART_002')
    print(f"2 parça seçildi: {manager.get_selection_stats()}")

    print("\n✅ Tam parçaları seç:")
    manager.select_parts_by_status('complete')
    print(f"Tam parça seçimi: {manager.get_selection_stats()}")

    print("\n🔍 Doğrulama:")
    validation = manager.validate_selection()
    print(f"Doğrulama sonucu: {validation}")


if __name__ == "__main__":
    test_selection_manager()