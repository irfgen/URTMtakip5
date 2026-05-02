# Makinalar Modülü Mimari Diyagramları

## 1. Mevcut Mimari vs Yeni Mimari

### 1.1. Mevcut Mimari

```mermaid
graph TB
    subgraph "Frontend"
        A[Makinalar.jsx] --> B[MakinaForm.jsx]
        A --> C[MakinaListesi.jsx]
        D[Tezgahlar.jsx] --> E[TezgahKarti.jsx]
    end
    
    subgraph "Backend"
        F[makinaRoutes.js] --> G[makinaController.js]
        H[tezgahRoutes.js] --> I[tezgahController.js]
        G --> J[Makina.js Model]
        I --> K[Tezgah.js Model]
    end
    
    A --> F
    D --> H
    
    style G fill:#ffcccc
    style I fill:#ffcccc
    style B fill:#ffcccc
    style E fill:#ffcccc
```

### 1.2. Yeni Modüler Mimari

```mermaid
graph TB
    subgraph "Frontend - Modüler Yapı"
        subgraph "Pages"
            A[MakinalarPage]
            B[TezgahlarPage]
        end
        
        subgraph "Containers"
            C[MakinaListContainer]
            D[TezgahListContainer]
            E[MakinaFormContainer]
        end
        
        subgraph "Components"
            F[MakinaCard]
            G[TezgahCard]
            H[MakinaForm]
            I[TezgahForm]
        end
        
        subgraph "Hooks"
            J[useMakinalar]
            K[useTezgahlar]
        end
        
        subgraph "Services"
            L[makinaAPI]
            M[tezgahAPI]
        end
    end
    
    subgraph "Backend - Katmanlı Mimari"
        subgraph "Routes"
            N[makinalarRoutes]
        end
        
        subgraph "Controllers"
            O[makinaController]
            P[tezgahController]
        end
        
        subgraph "Services"
            Q[makinaService]
            R[tezgahService]
        end
        
        subgraph "Repositories"
            S[makinaRepository]
            T[tezgahRepository]
        end
        
        subgraph "Models"
            U[Makina]
            V[Tezgah]
        end
    end
    
    A --> C
    B --> D
    C --> F
    D --> G
    E --> H
    C --> J
    D --> K
    J --> L
    K --> M
    
    N --> O
    N --> P
    O --> Q
    P --> R
    Q --> S
    R --> T
    S --> U
    T --> V
    
    style Q fill:#ccffcc
    style R fill:#ccffcc
    style S fill:#ccffcc
    style T fill:#ccffcc
    style J fill:#ccffcc
    style K fill:#ccffcc
```

## 2. Veri Akış Diyagramı

```mermaid
sequenceDiagram
    participant U as User
    participant P as Page
    participant C as Container
    participant H as Hook
    participant S as Service
    participant API as API
    participant Ctrl as Controller
    participantSvc as Service
    participant Repo as Repository
    participant DB as Database
    
    U->>P: Makinaları listele
    P->>C: Veri iste
    C->>H: useMakinalar()
    H->>S: makinaAPI.getAll()
    S->>API: GET /api/makinalar
    API->>Ctrl: makinaController.list()
    Ctrl->>Svc: makinaService.getAll()
    Svc->>Repo: makinaRepository.findAll()
    Repo->>DB: SELECT * FROM makinalar
    DB-->>Repo: Makina verileri
    Repo-->>Svc: İşlenmiş veriler
    Svc-->>Ctrl: Response
    Ctrl-->>API: JSON Response
    API-->>S: Veriler
    S-->>H: Normalized veri
    H-->>C: State güncelleme
    C-->>P: Render
    P-->>U: UI göster
```

## 3. Bileşen Hiyerarşisi

```mermaid
graph TD
    subgraph "Makinalar Modülü"
        A[MakinalarPage] --> B[MakinaListContainer]
        A --> C[MakinaFormContainer]
        
        B --> D[MakinaListesi]
        B --> E[MakinaArama]
        B --> F[MakinaFiltre]
        
        C --> G[MakinaForm]
        C --> H[BilesenSecimForm]
        
        D --> I[MakinaCard]
        G --> J[TemelBilgilerForm]
        G --> K[BilesenlerTab]
        G --> L[DurumForm]
        
        I --> M[DuzenleButton]
        I --> N[SilButton]
        I --> O[DurumBadge]
    end
    
    subgraph "Tezgahlar Modülü"
        P[TezgahlarPage] --> Q[TezgahListContainer]
        P --> R[TezgahFormContainer]
        
        Q --> S[TezgahGrid]
        Q --> T[TezgahFiltre]
        
        R --> U[TezgahForm]
        
        S --> V[TezgahKarti]
        V --> W[IsEmriListesi]
        V --> X[DurumIndicator]
        V --> Y[IslemlerMenu]
    end
```

## 4. Backend Katmanları

```mermaid
graph LR
    subgraph "API Layer"
        A[Routes] --> B[Controllers]
    end
    
    subgraph "Business Logic Layer"
        B --> C[Services]
        C --> D[Validators]
        C --> E[Utils]
    end
    
    subgraph "Data Access Layer"
        C --> F[Repositories]
        F --> G[Models]
    end
    
    subgraph "Database"
        G --> H[(SQLite)]
    end
    
    subgraph "Cross-cutting Concerns"
        I[Middleware]
        J[Error Handling]
        K[Logging]
        L[Caching]
    end
    
    A --> I
    B --> J
    C --> K
    F --> L
```

## 5. State Management Akışı

```mermaid
graph TB
    subgraph "Local State"
        A[Component State]
        B[Form State]
        C[UI State]
    end
    
    subgraph "Global State"
        D[Redux Store]
        E[makinalarSlice]
        F[tezgahlarSlice]
    end
    
    subgraph "Server State"
        G[React Query]
        H[makinalarQuery]
        I[tezgahlarQuery]
    end
    
    A --> D
    B --> D
    C --> D
    
    D --> E
    D --> F
    
    G --> H
    G --> I
    
    H --> E
    I --> F
```

## 6. Hata Yönetimi Akışı

```mermaid
graph TD
    A[Hata Oluştu] --> B{Hata Türü}
    
    B -->|Validation| C[Form Hatası]
    B -->|Network| D[API Hatası]
    B -->|System| E[Sistem Hatası]
    
    C --> F[Field Error]
    F --> G[UI Gösterimi]
    
    D --> H[Error Boundary]
    H --> I[Toast Notification]
    
    E --> J[Global Error Handler]
    J --> K[Loglama]
    J --> L[Kullanıcı Bildirimi]
    
    G --> M[Kullanıcı Düzeltme]
    I --> N[Yeniden Dene]
    L --> O[Destek Ekibi]
```

## 7. Optimizasyon Stratejileri

```mermaid
graph LR
    subgraph "Frontend Optimizasyon"
        A[Code Splitting] --> B[Lazy Loading]
        C[Memoization] --> D[React.memo]
        E[Virtual Scrolling] --> F[Large Lists]
        G[Image Optimization] --> H[WebP Format]
    end
    
    subgraph "Backend Optimizasyon"
        I[Database Indexing] --> J[Query Performance]
        K[Caching] --> L[Redis/Memory]
        M[Pagination] --> N[Limit/Offset]
        O[Connection Pooling] --> P[DB Connections]
    end
    
    subgraph "API Optimizasyon"
        Q[Response Compression] --> R[Gzip]
        S[Request Batching] --> T[Bulk Operations]
        U[ETag Headers] --> V[Conditional Requests]
    end
```

## 8. Test Stratejisi

```mermaid
graph TB
    subgraph "Frontend Tests"
        A[Unit Tests] --> B[Component Tests]
        A --> C[Hook Tests]
        D[Integration Tests] --> E[API Integration]
        D --> F[State Management]
        G[E2E Tests] --> H[User Workflows]
    end
    
    subgraph "Backend Tests"
        I[Unit Tests] --> J[Service Tests]
        I --> K[Repository Tests]
        L[Integration Tests] --> M[API Tests]
        L --> N[Database Tests]
        O[Contract Tests] --> P[API Contracts]
    end
    
    subgraph "Test Tools"
        Q[Jest] --> R[Frontend Unit]
        S[React Testing Library] --> T[Component Tests]
        U[Supertest] --> V[API Tests]
        W[SQLite Memory] --> X[DB Tests]
    end