# ÜRTM Takip - Socket.IO Events Dokümantasyonu

## 🔌 Socket.IO Yapısı

Bu dokümantasyon ÜRTM Takip sisteminin WebSocket/Socket.IO olaylarını içerir.

**Socket.IO Version**: 4.x
**Namespaces**: 3 (main, cad-import, fatura-eslestirme)
**Event Sayısı**: 30+

---

## 📋 İçindekiler

1. [Main Namespace](#main-namespace-)
2. [CAD Import Namespace](#cad-import-namespace-cad-import)
3. [Fatura Eşleştirme Namespace](#fatura-eslestirme-namespace-fatura-eslestirme)
4. [Client Integration](#client-integration)
5. [Event Payloads](#event-payloads)

---

## Main Namespace (`/`)

Ana namespace üretim ve stok güncellemelerini içerir.

### Connection

```javascript
const socket = io('http://localhost:3000');
```

### Server Events

#### bom-guncellendi
BOM güncellendiğinde tetiklenir.

```typescript
socket.on('bom-guncellendi', (data: BomGuncellemeEvent) => {
  // data.bomId: number
  // data.parcaId: number
  // data.versiyon: string
  // data.islemTipi: 'ekle' | 'guncelle' | 'sil'
});
```

#### isEmriGuncellendi
İş emri güncellendiğinde tetiklenir.

```typescript
socket.on('isEmriGuncellendi', (data: IsEmriGuncellemeEvent) => {
  // data.isEmriId: number
  // data.durum: string
  // data.islemTipi: 'olustur' | 'guncelle' | 'durum-degisikligi' | 'sil'
});
```

#### makina-sinifi-guncellendi
Makina sınıfı güncellendiğinde tetiklenir.

```typescript
socket.on('makina-sinifi-guncellendi', (data: MakinaSinifiGuncellemeEvent) => {
  // data.sinifId: number
  // data.sinifAdi: string
  // data.islemTipi: 'ekle' | 'guncelle' | 'sil'
});
```

#### parca-eklendi
Yeni parça eklendiğinde tetiklenir.

```typescript
socket.on('parca-eklendi', (data: ParcaEvent) => {
  // data.parcaId: number
  // data.parcaKodu: string
  // data.parcaAdi: string
});
```

#### stok-degisti
Stok değiştiğinde tetiklenir.

```typescript
socket.on('stok-degisti', (data: StokEvent) => {
  // data.parcaId: number
  // data.eskiMiktar: number
  // data.yeniMiktar: number
  // data.islemTipi: 'giris' | 'cikis'
});
```

### Client Events

#### makindex-join
Makindex odasına katıl.

```typescript
socket.emit('makindex-join', (callback: (response: JoinResponse) => void) => {
  // response.success: boolean
  // response.message: string
  // response.room: string
});
```

#### makindex-leave
Makindex odasından ayrıl.

```typescript
socket.emit('makindex-leave', (callback: (response: LeaveResponse) => void) => {
  // response.success: boolean
  // response.message: string
});
```

---

## CAD Import Namespace (`/cad-import`)

CAD dosya import işlemleri için namespace.

### Connection

```javascript
const cadSocket = io('http://localhost:3000/cad-import');
```

### Client Events

#### register-client
CAD import client'ini kaydet.

```typescript
cadSocket.emit('register-client', {
  clientId: string;
  clientType: 'solidworks' | 'freecad' | 'step-analyzer';
  version: string;
}, (callback: (response: RegisterResponse) => void) => {
  // response.success: boolean
  // response.clientId: string
  // response.registeredAt: Date
});
```

#### start-job
Import işini başlat.

```typescript
cadSocket.emit('start-job', {
  filePath: string;
  jobType: 'import' | 'analyze' | 'export';
  options?: JobOptions;
}, (callback: (response: JobResponse) => void) => {
  // response.success: boolean
  // response.jobId: string
  // response.status: 'queued' | 'running' | 'completed' | 'failed'
});
```

#### stop-job
Import işini durdur.

```typescript
cadSocket.emit('stop-job', {
  jobId: string;
}, (callback: (response: StopResponse) => void) => {
  // response.success: boolean
  // response.jobId: string
  // response.stoppedAt: Date
});
```

#### heartbeat
Client canlı kontrolü.

```typescript
cadSocket.emit('heartbeat', {
  clientId: string;
  status: string;
}, (callback: (response: HeartbeatResponse) => void) => {
  // response.success: boolean
  // response.serverTime: Date
});
```

#### job-progress
İş ilerlemesi bildirimi (client → server).

```typescript
cadSocket.emit('job-progress', {
  jobId: string;
  progress: number; // 0-100
  status: string;
  message?: string;
});
```

#### file-processed
Dosya işlendi bildirimi (client → server).

```typescript
cadSocket.emit('file-processed', {
  jobId: string;
  filePath: string;
  result: {
    success: boolean;
    data?: any;
    error?: string;
  };
});
```

### Server Events

#### job-progress
İş ilerlemesi (server → client).

```typescript
cadSocket.on('job-progress', (data: JobProgressEvent) => {
  // data.jobId: string
  // data.progress: number // 0-100
  // data.status: string
  // data.message: string
});
```

#### job-completed
İş tamamlandı.

```typescript
cadSocket.on('job-completed', (data: JobCompletedEvent) => {
  // data.jobId: string
  // data.success: boolean
  // data.result: any
  // data.completedAt: Date
});
```

#### job-failed
İş başarısız.

```typescript
cadSocket.on('job-failed', (data: JobFailedEvent) => {
  // data.jobId: string
  // data.error: string
  // data.failedAt: Date
});
```

---

## Fatura Eşleştirme Namespace (`/fatura-eslestirme`)

Fatura-İrsaliye eşleştirme işlemleri için namespace.

### Connection

```javascript
const faturaSocket = io('http://localhost:3000/fatura-eslestirme');
```

### Server Events

#### eslestirme-tamamlandi
Eşleştirme tamamlandı.

```typescript
faturaSocket.on('eslestirme-tamamlandi', (data: EslestirmeTamamlandiEvent) => {
  // data.faturaId: number
  // data.irsaliyeId: number
  // data.kalemSayisi: number
  // data.eslestirenPersonelId: number
  // data.tamamlandiAt: Date
});
```

**Usage Example:**
```typescript
faturaSocket.on('eslestirme-tamamlandi', (data) => {
  // Fatura listesini yenile
  fetchFaturalar();

  // Kullanıcıya bildirim göster
  showNotification(`Eşleştirme tamamlandı: ${data.kalemSayisi} kalem`);
});
```

#### eslestirme-kaldirildi
Eşleştirme kaldırıldı.

```typescript
faturaSocket.on('eslestirme-kaldirildi', (data: EslestirmeKaldirildiEvent) => {
  // data.faturaId: number
  // data.irsaliyeId: number | null
  // data.kalemId: number | null
  // data.kaldiranPersonelId: number
  // data.kaldirildiAt: Date
});
```

#### lock-acildi
Düzenleme kilidi açıldı.

```typescript
faturaSocket.on('lock-acildi', (data: LockAcildiEvent) => {
  // data.tur: 'fatura' | 'irsaliye'
  // data.id: number
  // data.lockedBy: string // personel adı
  // data.lockedAt: Date
});
```

**Usage Example:**
```typescript
faturaSocket.on('lock-acildi', (data) => {
  if (data.tur === 'fatura') {
    // Fatura düzenleme moduna geç
    setFaturaDuzenleniyor(data.id);
    showLockIndicator(data.lockedBy, data.lockedAt);
  }
});
```

#### lock-kapatildi
Düzenleme kilidi kapatıldı.

```typescript
faturaSocket.on('lock-kapatildi', (data: LockKapatildiEvent) => {
  // data.tur: 'fatura' | 'irsaliye'
  // data.id: number
  // data.kapatildiAt: Date
});
```

**Usage Example:**
```typescript
faturaSocket.on('lock-kapatildi', (data) => {
  // Düzenleme modundan çık
  if (data.tur === 'fatura') {
    setFaturaDuzenleniyor(null);
    hideLockIndicator();
  }
});
```

#### kalem-eklendi
Kalem eklendi (eşleştirme).

```typescript
faturaSocket.on('kalem-eklendi', (data: KalemEklendiEvent) => {
  // data.faturaId: number
  // data.irsaliyeId: number
  // data.kalem: FaturaKalem | IrsaliyeKalem
});
```

#### kalem-silindi
Kalem silindi (eşleştirme kaldırıldı).

```typescript
faturaSocket.on('kalem-silindi', (data: KalemSilindiEvent) => {
  // data.faturaId: number
  // data.kalemId: number
});
```

### Client Events

#### join-room
Odaya katıl.

```typescript
faturaSocket.emit('join-room', {
  room: string; // 'fatura:{id}' veya 'irsaliye:{id}'
});
```

#### leave-room
Odadan ayrıl.

```typescript
faturaSocket.emit('leave-room', {
  room: string;
});
```

---

## Client Integration

### React Hook

```typescript
// frontend/src/services/faturaIrsaliyeSocket.js
import { io, Socket } from 'socket.io-client';

class FaturaIrsaliyeSocket {
  private socket: Socket | null = null;

  connect(namespace: string) {
    this.socket = io(`http://localhost:3000/${namespace}`);

    this.socket.on('connect', () => {
      console.log(`Socket connected: ${namespace}`);
    });

    this.socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${namespace}`);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }
}

export default new FaturaIrsaliyeSocket();
```

### Usage in Component

```typescript
import { useEffect, useState } from 'react';
import faturaIrsaliyeSocket from '@/services/faturaIrsaliyeSocket';

function FaturaListesi() {
  const [faturalar, setFaturalar] = useState([]);
  const [duzenleniyor, setDuzenleniyor] = useState<number | null>(null);

  useEffect(() => {
    // Socket bağlantısını kur
    const socket = faturaIrsaliyeSocket.connect('fatura-eslestirme');

    // Event listener'ları ekle
    socket.on('eslestirme-tamamlandi', (data) => {
      // Faturaları yenile
      fetchFaturalar();
    });

    socket.on('lock-acildi', (data) => {
      if (data.tur === 'fatura') {
        setDuzenleniyor(data.id);
      }
    });

    socket.on('lock-kapatildi', (data) => {
      if (data.tur === 'fatura') {
        setDuzenleniyor(null);
      }
    });

    return () => {
      faturaIrsaliyeSocket.disconnect();
    };
  }, []);

  return (
    // Component JSX
    <div>
      {faturalar.map(fatura => (
        <FaturaKarti
          key={fatura.id}
          fatura={fatura}
          duzenleniyor={duzenleniyor === fatura.id}
        />
      ))}
    </div>
  );
}
```

---

## Event Payloads

### BomGuncellemeEvent

```typescript
interface BomGuncellemeEvent {
  bomId: number;
  parcaId: number;
  versiyon: string;
  islemTipi: 'ekle' | 'guncelle' | 'sil';
  islemYapan: string;
  islemTarihi: Date;
}
```

### IsEmriGuncellemeEvent

```typescript
interface IsEmriGuncellemeEvent {
  isEmriId: number;
  parcaId: number;
  tezgahId: number;
  durum: string;
  islemTipi: 'olustur' | 'guncelle' | 'durum-degisikligi' | 'sil';
  islemYapan: string;
  islemTarihi: Date;
}
```

### StokEvent

```typescript
interface StokEvent {
  parcaId: number;
  stokKartiId?: number;
  eskiMiktar: number;
  yeniMiktar: number;
  islemTipi: 'giris' | 'cikis' | 'ayarlama';
  islemYapan: string;
  islemTarihi: Date;
}
```

### JobProgressEvent

```typescript
interface JobProgressEvent {
  jobId: string;
  progress: number; // 0-100
  status: string;
  message?: string;
  timestamp: Date;
}
```

### JobCompletedEvent

```typescript
interface JobCompletedEvent {
  jobId: string;
  success: boolean;
  result: {
    bomId?: number;
    parcalar?: Parca[];
    hatalar?: string[];
  };
  completedAt: Date;
  duration: number; // ms
}
```

### EslestirmeTamamlandiEvent

```typescript
interface EslestirmeTamamlandiEvent {
  faturaId: number;
  irsaliyeId: number;
  kalemSayisi: number;
  eslestirenPersonelId: number;
  eslestirenPersonelAdi: string;
  tamamlandiAt: Date;
}
```

### LockAcildiEvent

```typescript
interface LockAcildiEvent {
  tur: 'fatura' | 'irsaliye';
  id: number;
  lockedBy: number; // personelId
  lockedByAdi: string;
  lockedAt: Date;
  timeout?: number; // sn
}
```

### LockKapatildiEvent

```typescript
interface LockKapatildiEvent {
  tur: 'fatura' | 'irsaliye';
  id: number;
  kapatildiAt: Date;
  kapatanPersonelId: number;
}
```

---

## Error Handling

### Socket Errors

```typescript
socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

### Event Error Handling

```typescript
socket.on('bom-guncellendi', (data, callback) => {
  try {
    // İşlem
    callback?.({ success: true });
  } catch (error) {
    callback?.({ success: false, error: error.message });
  }
});
```

---

## Authentication

Gelecek versiyonda JWT token ile authentication eklenecek.

```typescript
// Gelecek implementasyon
const socket = io('http://localhost:3000', {
  auth: {
    token: localStorage.getItem('jwt_token')
  }
});
```

---

## Best Practices

### 1. Room Management
```typescript
// Odaya katıl
socket.emit('join-room', { room: 'fatura:123' });

// Odadan ayrıl
socket.emit('leave-room', { room: 'fatura:123' });
```

### 2. Event Cleanup
```typescript
useEffect(() => {
  const handleEvent = (data) => {
    // Event handling
  };

  socket.on('event-name', handleEvent);

  return () => {
    socket.off('event-name', handleEvent);
  };
}, []);
```

### 3. Reconnection
```typescript
const socket = io('http://localhost:3000', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});
```

### 4. Error Boundaries
```typescript
socket.on('error', (error) => {
  if (error.message.includes('unauthorized')) {
    // Token expired, refresh
    refreshToken();
  }
});
```

---

## Testing

### Manual Testing

```javascript
// Browser console
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected');

  // Event emit
  socket.emit('makindex-join', {}, (response) => {
    console.log('Join response:', response);
  });
});

socket.on('bom-guncellendi', (data) => {
  console.log('BOM güncellendi:', data);
});
```

### Automated Testing

```typescript
// frontend/src/tests/socket.test.ts
import { io, Socket } from 'socket.io-client';

describe('Socket Events', () => {
  let socket: Socket;

  beforeEach(() => {
    socket = io('http://localhost:3000', {
      transports: ['websocket']
    });
  });

  afterEach(() => {
    socket.close();
  });

  test('should receive bom-guncellendi event', (done) => {
    socket.on('bom-guncellendi', (data) => {
      expect(data.bomId).toBeDefined();
      expect(data.islemTipi).toBeDefined();
      done();
    });

    // Trigger event (via API or server action)
    // ...
  });
});
```

---

## Monitoring

### Server-side Logging

```javascript
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  socket.onAny((eventName, ...args) => {
    console.log(`Event: ${eventName}`, args);
  });
});
```

### Client-side Logging

```typescript
socket.onAny((eventName, ...args) => {
  console.log(`[Socket] ${eventName}:`, args);
});
```

---

*Son güncelleme: 2024-12-24 | Socket.IO Versiyon: v14.dev1*
