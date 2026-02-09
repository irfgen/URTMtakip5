#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ÜRTM Takip - Dizin Tarama Client - Database Integration Module
v1.2.0 - Parça bilgisi API entegrasyonu
"""

import requests
import json
import logging
from typing import Dict, List, Optional, Any
import time
from urllib.parse import urljoin

class DatabaseClient:
    """
    ÜRTM Takip sunucusu ile parça bilgisi entegrasyonu
    """

    def __init__(self, base_url: str, timeout: int = 30):
        """
        DatabaseClient başlatıcısı

        Args:
            base_url: API base URL (örn: "http://192.168.1.100:3000")
            timeout: Request timeout süreleri
        """
        self.base_url = base_url.rstrip('/')
        self.api_base = f"{self.base_url}/api/dizin-tarama"
        self.timeout = timeout
        self.session = requests.Session()

        # Headers ayarlama
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'URTM-DizinTarama-Client/1.2.14'
        })

        # Logger kurulumu
        self.logger = logging.getLogger(f'{__name__}.DatabaseClient')

        # Cache yapısı (basit memory cache)
        self._cache = {}
        self._cache_ttl = {}
        self._cache_duration = 300  # 5 dakika cache süresi

    def test_connection(self) -> Dict[str, Any]:
        """
        Sunucu bağlantısını test et

        Returns:
            Dict: Bağlantı durumu bilgileri
        """
        try:
            response = self.session.get(
                f"{self.base_url}/api/health",
                timeout=self.timeout
            )

            if response.status_code == 200:
                # Dizin tarama health check
                dt_response = self.session.get(
                    f"{self.api_base}/health",
                    timeout=self.timeout
                )

                if dt_response.status_code == 200:
                    return {
                        'status': 'success',
                        'server_reachable': True,
                        'dizin_tarama_active': True,
                        'response_time': response.elapsed.total_seconds(),
                        'message': 'Sunucu ve dizin tarama servisi aktif'
                    }
                else:
                    return {
                        'status': 'partial',
                        'server_reachable': True,
                        'dizin_tarama_active': False,
                        'message': 'Sunucu erişilebilir ama dizin tarama servisi aktif değil'
                    }
            else:
                return {
                    'status': 'error',
                    'server_reachable': False,
                    'message': f'Sunucu yanıt vermiyor: HTTP {response.status_code}'
                }

        except requests.exceptions.ConnectionError:
            return {
                'status': 'error',
                'server_reachable': False,
                'message': 'Sunucuya bağlanılamıyor - bağlantı hatası'
            }
        except requests.exceptions.Timeout:
            return {
                'status': 'error',
                'server_reachable': False,
                'message': 'Sunucuya bağlanılamıyor - zaman aşımı'
            }
        except Exception as e:
            return {
                'status': 'error',
                'server_reachable': False,
                'message': f'Beklenmeyen hata: {str(e)}'
            }

    def _is_cache_valid(self, key: str) -> bool:
        """Cache geçerliliğini kontrol et"""
        if key not in self._cache:
            return False

        if key not in self._cache_ttl:
            return False

        return time.time() < self._cache_ttl[key]

    def _set_cache(self, key: str, data: Any) -> None:
        """Cache'e veri kaydet"""
        self._cache[key] = data
        self._cache_ttl[key] = time.time() + self._cache_duration

    def _get_cache(self, key: str) -> Optional[Any]:
        """Cache'den veri oku"""
        if self._is_cache_valid(key):
            return self._cache[key]
        return None

    def get_part_info(self, part_name: str, use_cache: bool = True) -> Dict[str, Any]:
        """
        Tek parça bilgisini getir

        Args:
            part_name: Parça adı
            use_cache: Cache kullanılsın mı

        Returns:
            Dict: Parça bilgisi response
        """
        try:
            # Cache kontrolü
            cache_key = f"part_info_{part_name.lower()}"
            if use_cache:
                cached_data = self._get_cache(cache_key)
                if cached_data:
                    self.logger.debug(f"Cache'den parça bilgisi döndürüldü: {part_name}")
                    return cached_data

            self.logger.info(f"Parça bilgisi sorgulanıyor: {part_name}")

            # API çağrısı
            response = self.session.post(
                f"{self.api_base}/part-info",
                json={'partName': part_name},
                timeout=self.timeout
            )

            if response.status_code == 200:
                data = response.json()

                # Cache'e kaydet
                if use_cache and data.get('success'):
                    self._set_cache(cache_key, data)

                return data
            else:
                return {
                    'success': False,
                    'error': {
                        'code': f'HTTP_{response.status_code}',
                        'message': f'API hatası: {response.status_code}'
                    }
                }

        except requests.exceptions.Timeout:
            return {
                'success': False,
                'error': {
                    'code': 'TIMEOUT',
                    'message': 'API çağrısı zaman aşımına uğradı'
                }
            }
        except requests.exceptions.ConnectionError:
            return {
                'success': False,
                'error': {
                    'code': 'CONNECTION_ERROR',
                    'message': 'Sunucuya bağlanılamıyor'
                }
            }
        except Exception as e:
            self.logger.error(f"Parça bilgisi getirme hatası: {str(e)}")
            return {
                'success': False,
                'error': {
                    'code': 'UNKNOWN_ERROR',
                    'message': f'Bilinmeyen hata: {str(e)}'
                }
            }

    def get_bulk_part_info(self, part_names: List[str], use_cache: bool = True) -> Dict[str, Any]:
        """
        Toplu parça bilgisi getir

        Args:
            part_names: Parça adları listesi
            use_cache: Cache kullanılsın mı

        Returns:
            Dict: Toplu parça bilgisi response
        """
        try:
            if not part_names:
                return {
                    'success': False,
                    'error': {
                        'code': 'EMPTY_PART_LIST',
                        'message': 'Parça listesi boş'
                    }
                }

            # 1.000.000 parça limiti
            if len(part_names) > 1000000:
                return {
                    'success': False,
                    'error': {
                        'code': 'TOO_MANY_PARTS',
                        'message': f'En fazla 1.000.000 parça sorgulanabilir (gönderilen: {len(part_names)})'
                    }
                }

            # Cache kontrolü (tüm parçalar için)
            cached_parts = {}
            uncached_parts = []

            if use_cache:
                for part_name in part_names:
                    cache_key = f"part_info_{part_name.lower()}"
                    cached_data = self._get_cache(cache_key)
                    if cached_data and cached_data.get('success') and cached_data.get('data', {}).get('found'):
                        cached_parts[part_name] = cached_data['data']
                    else:
                        uncached_parts.append(part_name)
            else:
                uncached_parts = part_names.copy()

            self.logger.info(f"Toplu parça bilgisi sorgulanıyor: {len(part_names)} parça ({len(cached_parts)} cache'den, {len(uncached_parts)} API'den)")

            # API'den getirilecek parçalar varsa çağrı yap
            api_results = {}
            if uncached_parts:
                response = self.session.post(
                    f"{self.api_base}/bulk-part-info",
                    json={'partNames': uncached_parts},
                    timeout=self.timeout * 2  # Toplu işlem için daha uzun timeout
                )

                if response.status_code == 200:
                    api_data = response.json()
                    if api_data.get('success'):
                        # API sonuçlarını cache'e kaydet
                        for part_result in api_data.get('data', {}).get('parts', []):
                            part_name = part_result.get('partName')
                            if part_name and use_cache:
                                cache_key = f"part_info_{part_name.lower()}"
                                cache_data = {
                                    'success': True,
                                    'data': part_result
                                }
                                self._set_cache(cache_key, cache_data)

                            api_results[part_name] = part_result
                    else:
                        return api_data
                else:
                    # Daha detaylı hata mesajı
                    try:
                        error_data = response.json()
                        error_message = error_data.get('error', {}).get('message', f'HTTP {response.status_code} hatası')
                    except:
                        error_message = f'HTTP {response.status_code} hatası'

                    self.logger.error(f"Bulk API hatası {response.status_code}: {error_message}")
                    return {
                        'success': False,
                        'error': {
                            'code': f'HTTP_{response.status_code}',
                            'message': f'Sunucu hatası ({response.status_code}): {error_message}. Lütfen sunucu loglarını kontrol edin.'
                        }
                    }

            # Sonuçları birleştir
            all_results = []
            for part_name in part_names:
                if part_name in cached_parts:
                    all_results.append(cached_parts[part_name])
                elif part_name in api_results:
                    all_results.append(api_results[part_name])
                else:
                    # Hiç bulunamayan parça
                    all_results.append({
                        'partName': part_name,
                        'found': False,
                        'reason': 'API yanıtında bulunamadı'
                    })

            # İstatistikleri hesapla
            found_count = sum(1 for r in all_results if r.get('found'))
            not_found_count = len(all_results) - found_count

            return {
                'success': True,
                'data': {
                    'requestedCount': len(part_names),
                    'foundCount': found_count,
                    'notFoundCount': not_found_count,
                    'parts': all_results,
                    'statistics': {
                        'cacheHitCount': len(cached_parts),
                        'apiCallCount': len(uncached_parts)
                    }
                }
            }

        except requests.exceptions.Timeout:
            return {
                'success': False,
                'error': {
                    'code': 'TIMEOUT',
                    'message': 'Toplu API çağrısı zaman aşımına uğradı'
                }
            }
        except requests.exceptions.ConnectionError:
            return {
                'success': False,
                'error': {
                    'code': 'CONNECTION_ERROR',
                    'message': 'Sunucuya bağlanılamıyor'
                }
            }
        except Exception as e:
            self.logger.error(f"Toplu parça bilgisi getirme hatası: {str(e)}")
            return {
                'success': False,
                'error': {
                    'code': 'UNKNOWN_ERROR',
                    'message': f'Bilinmeyen hata: {str(e)}'
                }
            }

    def search_parts(self, search_term: str, limit: int = 10) -> Dict[str, Any]:
        """
        Parça arama yap

        Args:
            search_term: Arama terimi
            limit: Sonuç limiti

        Returns:
            Dict: Arama sonuçları
        """
        try:
            if not search_term or len(search_term) < 2:
                return {
                    'success': False,
                    'error': {
                        'code': 'INVALID_SEARCH_TERM',
                        'message': 'Arama terimi en az 2 karakter olmalı'
                    }
                }

            self.logger.info(f"Parça arama yapılıyor: {search_term}")

            response = self.session.post(
                f"{self.api_base}/search-parts",
                json={
                    'searchTerm': search_term,
                    'limit': min(limit, 1000000)
                },
                timeout=self.timeout
            )

            if response.status_code == 200:
                return response.json()
            else:
                return {
                    'success': False,
                    'error': {
                        'code': f'HTTP_{response.status_code}',
                        'message': f'Arama API hatası: {response.status_code}'
                    }
                }

        except Exception as e:
            self.logger.error(f"Parça arama hatası: {str(e)}")
            return {
                'success': False,
                'error': {
                    'code': 'SEARCH_ERROR',
                    'message': f'Arama hatası: {str(e)}'
                }
            }

    def clear_cache(self) -> None:
        """Cache'i temizle"""
        self._cache.clear()
        self._cache_ttl.clear()
        self.logger.info("Parça bilgisi cache'i temizlendi")

    def save_parts_to_database(self, parts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Seçili parçaları veritabanına kaydet

        Args:
            parts: Kaydedilecek parçalar listesi
                   Her parça: {fileName, parcaKodu, parcaAdi, kaynak}

        Returns:
            Dict: Kaydetme işlemi sonucu
        """
        try:
            self.logger.info(f"{len(parts)} parça veritabanına kaydediliyor...")

            # API isteği gönder
            response = self.session.post(
                f"{self.api_base}/save-parts",
                json={
                    "parts": parts
                },
                timeout=self.timeout * 2  # Bulk işlem için daha uzun timeout
            )

            if response.status_code == 200:
                result = response.json()
                self.logger.info(f"✅ {result.get('data', {}).get('successCount', 0)} parça başarıyla kaydedildi")
                return {
                    'status': 'success',
                    'data': result.get('data', {}),
                    'message': f"{result.get('data', {}).get('successCount', 0)} parça kaydedildi"
                }
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.logger.error(f"❌ Kaydetme hatası: {response.status_code} - {error_data}")
                return {
                    'status': 'error',
                    'error_code': response.status_code,
                    'message': error_data.get('error', {}).get('message', f'HTTP {response.status_code} hatası'),
                    'details': error_data
                }

        except requests.exceptions.Timeout:
            error_msg = "Kaydetme işlemi zaman aşımına uğradı"
            self.logger.error(f"❌ {error_msg}")
            return {
                'status': 'error',
                'error_code': 'TIMEOUT',
                'message': error_msg
            }
        except requests.exceptions.ConnectionError:
            error_msg = "Sunucuya bağlanılamadı"
            self.logger.error(f"❌ {error_msg}")
            return {
                'status': 'error',
                'error_code': 'CONNECTION_ERROR',
                'message': error_msg
            }
        except Exception as e:
            error_msg = f"Beklenmedik hata: {str(e)}"
            self.logger.error(f"❌ {error_msg}")
            return {
                'status': 'error',
                'error_code': 'UNKNOWN_ERROR',
                'message': error_msg
            }

    def get_cache_stats(self) -> Dict[str, Any]:
        """Cache istatistiklerini getir"""
        valid_entries = sum(1 for key in self._cache.keys() if self._is_cache_valid(key))

        return {
            'total_entries': len(self._cache),
            'valid_entries': valid_entries,
            'expired_entries': len(self._cache) - valid_entries,
            'cache_duration_seconds': self._cache_duration
        }

# Test fonksiyonu
def test_database_client():
    """
    DatabaseClient test fonksiyonu
    """
    import sys

    if len(sys.argv) < 2:
        print("Kullanım: python database_client.py <server_url>")
        print("Örnek: python database_client.py http://192.168.1.100:3000")
        return

    server_url = sys.argv[1]
    client = DatabaseClient(server_url)

    print("🔗 Sunucu bağlantısı test ediliyor...")
    connection_test = client.test_connection()
    print(f"Sonuç: {connection_test}")

    if connection_test['status'] == 'success':
        print("\n🔍 Test parçası sorgulanıyor...")
        part_info = client.get_part_info("TEST_PART")
        print(f"Sonuç: {json.dumps(part_info, indent=2, ensure_ascii=False)}")

        print("\n📊 Cache istatistikleri:")
        cache_stats = client.get_cache_stats()
        print(f"Sonuç: {cache_stats}")

if __name__ == "__main__":
    test_database_client()