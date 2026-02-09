import sqlite3
import json
import os
import sys
import argparse
from datetime import datetime
import hashlib

class SQLiteSynchronizer:
    def __init__(self, db_path):
        self.db_path = db_path
        
    def _connect_db(self):
        """Veritabanına bağlan ve connection döndür"""
        try:
            # WAL modundaki veritabanı için pragmaları ayarla
            conn = sqlite3.connect(self.db_path)
            conn.execute('PRAGMA journal_mode=WAL;')
            conn.row_factory = sqlite3.Row
            return conn
        except sqlite3.Error as e:
            print(f"Veritabanı bağlantı hatası: {e}")
            sys.exit(1)
    
    def get_table_schema(self, conn, table_name):
        """Tablo şemasını al"""
        cursor = conn.cursor()
        cursor.execute(f"PRAGMA table_info({table_name})")
        return cursor.fetchall()
    
    def get_tables(self, conn):
        """Veritabanındaki tüm tabloları listele"""
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        return [row['name'] for row in cursor.fetchall()]

    def export_data(self, output_file):
        """Veritabanı verilerini JSON formatında dışa aktar"""
        conn = self._connect_db()
        
        # Tüm verileri ve şemaları saklamak için yapı
        export_data = {
            'metadata': {
                'export_date': datetime.now().isoformat(),
                'source_db': self.db_path
            },
            'tables': {}
        }
        
        tables = self.get_tables(conn)
        
        for table_name in tables:
            print(f"Tablo işleniyor: {table_name}")
            
            # Tablo şeması al
            schema = self.get_table_schema(conn, table_name)
            column_names = [col['name'] for col in schema]
            primary_keys = [col['name'] for col in schema if col['pk'] == 1]
            
            # Tablo verilerini al
            cursor = conn.cursor()
            cursor.execute(f"SELECT * FROM {table_name}")
            rows = cursor.fetchall()
            
            # Tabloyu JSON'a ekle
            export_data['tables'][table_name] = {
                'schema': [dict(col) for col in schema],
                'primary_keys': primary_keys,
                'data': [dict(row) for row in rows]
            }
        
        conn.close()
        
        # JSON dosyasına kaydet
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, ensure_ascii=False, indent=2)
            
        print(f"Veriler başarıyla dışa aktarıldı: {output_file}")
        return export_data

    def import_data(self, input_file):
        """JSON dosyasından verileri içe aktar, sadece yeni kayıtları ekle"""
        # JSON verisini oku
        with open(input_file, 'r', encoding='utf-8') as f:
            import_data = json.load(f)
        
        conn = self._connect_db()
        
        for table_name, table_info in import_data['tables'].items():
            print(f"Tablo içe aktarılıyor: {table_name}")
            
            # Tablo şeması ve verileri al
            schema = table_info['schema']
            primary_keys = table_info['primary_keys']
            data = table_info['data']
            
            # Tablonun varlığını kontrol et, yoksa oluştur
            cursor = conn.cursor()
            cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
            table_exists = cursor.fetchone() is not None
            
            if not table_exists:
                # Tablo oluştur
                columns = []
                for col in schema:
                    col_def = f"{col['name']} {col['type']}"
                    if col['pk'] == 1:
                        col_def += " PRIMARY KEY"
                    if col['notnull'] == 1:
                        col_def += " NOT NULL"
                    columns.append(col_def)
                
                create_table_sql = f"CREATE TABLE {table_name} ({', '.join(columns)})"
                conn.execute(create_table_sql)
                print(f"Tablo oluşturuldu: {table_name}")
            
            # Her kayıt için, eğer yoksa ekle
            for row in data:
                if not primary_keys:
                    # Primary key yoksa tüm sütunları kullanarak kontrol et
                    condition_parts = []
                    params = []
                    
                    for col_name, value in row.items():
                        # SQL reserved keywords için köşeli parantez kullan
                        safe_col_name = f"[{col_name}]"
                        if value is not None:
                            condition_parts.append(f"{safe_col_name}=?")
                            params.append(value)
                        else:
                            condition_parts.append(f"{safe_col_name} IS NULL")
                    
                    condition = " AND ".join(condition_parts)
                else:
                    # Primary key varsa sadece primary key ile kontrol et
                    condition_parts = []
                    params = []
                    
                    for pk in primary_keys:
                        # SQL reserved keywords için köşeli parantez kullan
                        safe_pk_name = f"[{pk}]"
                        if row[pk] is not None:
                            condition_parts.append(f"{safe_pk_name}=?")
                            params.append(row[pk])
                        else:
                            condition_parts.append(f"{safe_pk_name} IS NULL")
                    
                    condition = " AND ".join(condition_parts)
                
                # Kayıt var mı kontrol et
                check_sql = f"SELECT 1 FROM {table_name} WHERE {condition}"
                cursor.execute(check_sql, params)
                exists = cursor.fetchone() is not None
                
                if not exists:
                    # Yeni kayıt ekle
                    column_names = list(row.keys())
                    # SQL reserved keywords için köşeli parantez kullan
                    safe_column_names = [f"[{col}]" for col in column_names]
                    placeholders = ["?" for _ in column_names]
                    values = [row[col] for col in column_names]
                    
                    insert_sql = f"INSERT INTO {table_name} ({', '.join(safe_column_names)}) VALUES ({', '.join(placeholders)})"
                    try:
                        cursor.execute(insert_sql, values)
                        print(f"Yeni kayıt eklendi: {table_name}")
                    except sqlite3.Error as e:
                        print(f"Kayıt eklenirken hata: {e}")
        
        conn.commit()
        conn.close()
        print(f"İçe aktarma tamamlandı: {self.db_path}")

def main():
    parser = argparse.ArgumentParser(description='SQLite veritabanı senkronizasyon aracı')
    parser.add_argument('--mode', choices=['export', 'import'], required=True, help='İşlem modu: export veya import')
    parser.add_argument('--db', required=True, help='SQLite veritabanı yolu')
    parser.add_argument('--file', required=True, help='Export/import edilecek JSON dosyası')
    
    args = parser.parse_args()
    
    synchronizer = SQLiteSynchronizer(args.db)
    
    if args.mode == 'export':
        synchronizer.export_data(args.file)
    else:
        synchronizer.import_data(args.file)

if __name__ == "__main__":
    main()