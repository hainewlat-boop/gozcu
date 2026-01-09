# Kapalı Devre Dağıtım Paketi İçeriği

## Genel Bakış

Bu paket, Kiosk Yönetim Sistemi'nin kapalı devre (air-gapped) VLAN ortamlarında çalıştırılması için gerekli tüm bileşenleri içerir. Sistem Docker Compose kullanılarak self-hosted Supabase altyapısı üzerinde çalışır.

## Paket Yapısı

```
kiosk-management-system/
│
├── 📄 README.md                          # Genel proje bilgileri
├── 📄 DOCKER_KURULUM.md                  # Detaylı Docker kurulum kılavuzu
├── 📄 OFFLINE_DEPLOYMENT.md              # Kapalı devre dağıtım rehberi
├── 📄 PAKET_ICERIGI.md                   # Bu dosya
├── 📄 KULLANIM_KILAVUZU.md               # Kullanıcı kılavuzu
├── 📄 GUVENLIK_DOKUMANI.md               # Güvenlik politikaları
│
├── 🐳 docker-compose.yml                 # Ana orchestration dosyası
├── 📄 .env.docker                        # Ortam değişkenleri
├── 📄 .env.docker.example                # Örnek ortam değişkenleri
│
├── 📁 docker/                            # Docker yapılandırmaları
│   ├── Dockerfile.frontend              # Frontend container build
│   ├── nginx.conf                       # Web server yapılandırması
│   ├── kong.yml                         # API Gateway routes
│   ├── deploy.sh                        # Linux deployment script
│   ├── deploy.bat                       # Windows deployment script
│   ├── create-offline-package.sh        # Offline paket oluşturucu (Linux)
│   └── create-offline-package.bat       # Offline paket oluşturucu (Windows)
│
├── 📁 supabase/                         # Supabase yapılandırmaları
│   ├── migrations/                      # Veritabanı migration dosyaları
│   │   ├── 20260106071917_create_core_security_schema.sql
│   │   ├── 20260106081448_insert_sample_data_and_roles.sql
│   │   ├── 20260106081759_add_kvkk_acceptance_to_profiles.sql
│   │   ├── 20260106091337_add_package_deployment_tables.sql
│   │   ├── 20260106134610_add_mac_address_to_devices.sql
│   │   ├── 20260106135946_add_inventory_system_tables.sql
│   │   ├── 20260106141039_fix_admin_rls_policies.sql
│   │   ├── 20260106141542_fix_admin_role_permissions.sql
│   │   ├── 20260106142647_performance_and_security_optimizations.sql
│   │   ├── 20260106143646_add_duplicate_device_checks_and_realtime.sql
│   │   ├── 20260106144447_add_theme_preference_to_profiles.sql
│   │   ├── 20260106150820_enable_realtime_for_all_tables.sql
│   │   ├── 20260107115348_rollback_kiosk_communication_infrastructure.sql
│   │   ├── 20260107121854_create_kiosk_server_communication_infrastructure.sql
│   │   ├── 20260107135947_add_asset_number_to_inventory_devices.sql
│   │   ├── 20260108071905_add_rate_limits_table.sql
│   │   ├── 20260108072041_add_rls_policies_for_kiosk_tables.sql
│   │   ├── 20260108072148_add_performance_indexes.sql
│   │   ├── 20260108074340_fix_role_name_case_sensitivity.sql
│   │   ├── 20260108105332_add_kvkk_texts_table.sql
│   │   ├── 20260108110658_add_kvkk_versioning_and_institution.sql
│   │   ├── 20260108111402_add_audit_logs_insert_policy.sql
│   │   ├── 20260108120041_fix_kvkk_texts_role_case_sensitivity.sql
│   │   ├── 20260108121616_add_auto_version_increment_trigger.sql
│   │   ├── 20260108122953_add_critical_performance_indexes.sql
│   │   └── clear_test_data.sql          # Test verilerini temizleme
│   │
│   └── functions/                       # Edge Functions
│       ├── create-user/
│       ├── delete-user/
│       ├── deploy-package/
│       ├── kiosk-heartbeat/
│       ├── kiosk-poll-commands/
│       ├── kiosk-submit-logs/
│       ├── kiosk-update-command-status/
│       ├── scan-network/
│       ├── lib/
│       └── _shared/
│
├── 📁 kiosk-agent/                      # Windows Agent Servisi
│   ├── Program.cs                       # Ana program
│   ├── KioskAgent.csproj               # Proje dosyası
│   ├── appsettings.json                # Yapılandırma
│   ├── build.bat                       # Build script
│   ├── install.bat                     # Kurulum script
│   ├── uninstall.bat                   # Kaldırma script
│   ├── README.md                       # Agent dokümantasyonu
│   └── Services/                       # Agent servisleri
│       ├── CommandExecutor.cs
│       ├── CommandPollingService.cs
│       ├── HealthMonitor.cs
│       ├── HeartbeatService.cs
│       ├── LogCollector.cs
│       ├── LogSubmissionService.cs
│       ├── SelfHealingService.cs
│       └── SupabaseClient.cs
│
├── 📁 src/                              # Frontend Kaynak Kodları
│   ├── main.tsx                        # Uygulama giriş noktası
│   ├── App.tsx                         # Ana uygulama component
│   ├── index.css                       # Global stiller
│   │
│   ├── components/                     # React bileşenleri
│   │   ├── Layout.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── SessionTimeoutWarning.tsx
│   │   ├── CsvImportModal.tsx
│   │   ├── KvkkEditor.tsx
│   │   ├── Pagination.tsx
│   │   └── ui/                        # UI bileşenleri
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       ├── Alert.tsx
│   │       ├── Toast.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── index.ts
│   │
│   ├── pages/                          # Sayfa bileşenleri
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── AdminPage.tsx
│   │   ├── KioskMonitoringPage.tsx
│   │   ├── IoTMonitoringPage.tsx
│   │   ├── AlarmsPage.tsx
│   │   ├── InventoryPage.tsx
│   │   ├── PackageDeploymentPage.tsx
│   │   ├── AuditLogsPage.tsx
│   │   └── SettingsPage.tsx
│   │
│   ├── contexts/                       # React Context'ler
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── services/                       # İş mantığı servisleri
│   │   ├── auditService.ts
│   │   ├── deviceService.ts
│   │   ├── kioskService.ts
│   │   ├── roleService.ts
│   │   ├── systemSettingsService.ts
│   │   ├── userService.ts
│   │   └── index.ts
│   │
│   ├── hooks/                          # Custom React hooks
│   │   ├── useSupabaseQuery.ts
│   │   └── index.ts
│   │
│   └── lib/                            # Yardımcı kütüphaneler
│       ├── supabase.ts                 # Supabase client
│       ├── database.types.ts           # TypeScript tipleri
│       ├── security.ts                 # Güvenlik utilities
│       ├── securityLogger.ts
│       ├── sessionManager.ts
│       ├── rateLimiter.ts
│       ├── validation.ts
│       ├── xssProtection.ts
│       ├── excelImport.ts
│       └── networkScanner.ts
│
└── 📁 dist/                            # Build çıktıları (oluşturulacak)
    └── (Offline paket burada oluşturulur)
```

## Docker Servisleri

Paket aşağıdaki Docker servislerini içerir:

### 1. PostgreSQL (supabase/postgres:15.1.0.147)
- **Amaç**: Ana veritabanı
- **Port**: 5432
- **Özellikler**:
  - Row Level Security (RLS)
  - Realtime extensions
  - pgcrypto, uuid-ossp extensions

### 2. Kong API Gateway (kong:2.8.1)
- **Amaç**: API routing ve authentication
- **Port**: 8000, 8443
- **Özellikler**:
  - JWT authentication
  - CORS handling
  - Rate limiting

### 3. GoTrue (supabase/gotrue:v2.99.0)
- **Amaç**: Kullanıcı authentication servisi
- **Port**: 9999 (internal)
- **Özellikler**:
  - Email/password authentication
  - JWT token generation
  - Session management

### 4. PostgREST (postgrest/postgrest:v11.2.2)
- **Amaç**: PostgreSQL için REST API
- **Port**: 3000 (internal)
- **Özellikler**:
  - Auto-generated REST endpoints
  - RLS enforcement
  - OpenAPI documentation

### 5. Realtime (supabase/realtime:v2.25.35)
- **Amaç**: WebSocket servisi
- **Port**: 4000 (internal)
- **Özellikler**:
  - Database change subscriptions
  - Broadcast channels
  - Presence tracking

### 6. Meta (supabase/postgres-meta:v0.68.0)
- **Amaç**: Database metadata API
- **Port**: 8080 (internal)
- **Özellikler**:
  - Schema introspection
  - Table/column management

### 7. Studio (supabase/studio:20231123-64a766a)
- **Amaç**: Web-based database UI
- **Port**: 3000
- **Özellikler**:
  - SQL Editor
  - Table Editor
  - Visual schema designer

### 8. Frontend (nginx:1.25-alpine + React App)
- **Amaç**: Web uygulaması
- **Port**: 80, 443
- **Özellikler**:
  - Single Page Application
  - Static file serving
  - API proxying

## Özellikler

### Güvenlik
- ✅ Row Level Security (RLS) tüm tablolarda aktif
- ✅ JWT-based authentication
- ✅ XSS protection
- ✅ SQL injection prevention
- ✅ Rate limiting
- ✅ Audit logging
- ✅ Session management
- ✅ CORS yapılandırması

### Performans
- ✅ Database indexing
- ✅ Connection pooling
- ✅ Nginx caching
- ✅ Gzip compression
- ✅ Lazy loading

### Monitoring
- ✅ Realtime device monitoring
- ✅ Health checks
- ✅ Log collection
- ✅ Telemetry data
- ✅ Alarm management

### Yönetim
- ✅ Rol-based access control (RBAC)
- ✅ User management
- ✅ Device inventory
- ✅ Package deployment
- ✅ Audit logs
- ✅ KVKK compliance

## Sistem Gereksinimleri

### Minimum
- **CPU**: 4 Core
- **RAM**: 8 GB
- **Disk**: 50 GB
- **OS**: Linux/Windows Server/macOS

### Önerilen
- **CPU**: 8 Core
- **RAM**: 16 GB
- **Disk**: 100 GB SSD
- **OS**: Ubuntu 20.04+ / Windows Server 2019+

## Kurulum Yöntemleri

### 1. Hızlı Kurulum
```bash
# Linux/macOS
./docker/deploy.sh

# Windows
docker\deploy.bat
```

### 2. Offline Paket Oluşturma
```bash
# Linux/macOS
./docker/create-offline-package.sh

# Windows
docker\create-offline-package.bat
```

### 3. Manuel Kurulum
Detaylı adımlar için `DOCKER_KURULUM.md` dosyasına bakın.

## Lisans

Bu yazılım kurumunuzun lisans sözleşmesi kapsamında kullanılmaktadır.

## Versiyon

- **Paket Versiyonu**: 1.0.0
- **Tarih**: 2026-01-08
- **Docker Compose**: 3.8
- **Supabase**: Self-hosted (2024)

## Destek

Kurulum ve kullanım için:
- `DOCKER_KURULUM.md` - Kurulum rehberi
- `OFFLINE_DEPLOYMENT.md` - Offline deployment
- `KULLANIM_KILAVUZU.md` - Kullanıcı kılavuzu
- `GUVENLIK_DOKUMANI.md` - Güvenlik bilgileri
