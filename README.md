# Sistem Gözcüsü

**Kurumsal İzleme ve Uzaktan Yönetim Platformu**

ISO 27001 ve KVKK uyumlu, kamu kurumları için geliştirilmiş tam özellikli izleme sistemi.

## Öne Çıkan Özellikler

- **100+ Cihaz İzleme**: Kiosk ve IoT cihazları tek ekranda grid düzeninde izleyin
- **Gerçek Zamanlı**: Dashboard, alarmlar ve telemetri verileri canlı güncelleme
- **Güvenlik**: RBAC, audit log hash chain, RLS, manifest imzalama
- **Uyumluluk**: ISO 27001 kontrolleri ve KVKK veri koruma ilkeleri
- **Çok Tema**: Açık, koyu, mavi, yeşil temalar
- **Tam Ekran**: Monitör duvarı için optimize edilmiş tam ekran modu

## Kurulum Seçenekleri

### Seçenek 1: MSI Installer (En Kolay)

**Windows için tek tıkla kurulum**

```powershell
# Önce offline paketi oluşturun (internet bağlantılı ortamda)
cd installer
.\Build-Complete-Package.ps1

# Oluşan MSI dosyasını hedef sisteme taşıyın ve çalıştırın
# Grafik arayüzlü kurulum sihirbazı açılır
```

Detaylar için: `installer/README.md`

### Seçenek 2: Kapalı Devre Docker Kurulumu

**Linux/macOS veya Windows için self-hosted çözüm**

```bash
# Linux/macOS
./docker/deploy.sh

# Windows
docker\deploy.bat
```

Detaylar için: `DOCKER_KURULUM.md` ve `OFFLINE_DEPLOYMENT.md`

### Seçenek 3: Geliştirme Ortamı (Cloud Supabase)

#### 1. Bağımlılıkları Kurun
```bash
npm install
```

#### 2. Test Kullanıcısı Oluşturun

Detaylı adımlar için `HIZLI_BASLANGIC.sql` dosyasına bakın.

Özet:
1. Supabase Dashboard → Authentication → Add User
2. E-posta: `admin@kurum.gov.tr`, Şifre: güçlü şifre
3. User ID'yi kopyalayın
4. `HIZLI_BASLANGIC.sql` dosyasındaki ID'yi güncelleyip çalıştırın

#### 3. Uygulamayı Başlatın
```bash
npm run dev
```

Tarayıcıda: http://localhost:5173

## Teknoloji Stack

**Frontend**:
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Supabase Client

**Backend**:
- Supabase (PostgreSQL)
- Row Level Security (RLS)
- Real-time Subscriptions

**Güvenlik**:
- RBAC + Permission System
- Audit Log Hash Chain (SHA-256)
- Argon2id/bcrypt Password Hashing
- Ed25519/RSA Manifest Signing

## Sayfa Yapısı

| Sayfa | İzin | Açıklama |
|-------|------|----------|
| **Dashboard** | `dashboard.view` | Sistem durumu, istatistikler, bütünlük |
| **Kiosk İzleme** | `kiosk.view` | 100+ kiosk grid izleme, uzak kontrol |
| **IoT İzleme** | `iot.view` | 100+ IoT cihaz izleme |
| **Alarmlar** | `alarm.view` | Alarm yönetimi, filtreleme, çözme |
| **Denetim Logları** | `audit.view` | Hash chain korumalı audit log |
| **Ayarlar** | `settings.manage` | Sistem ayarları |

## Roller

| Rol | Açıklama | İzinler |
|-----|----------|---------|
| **Admin** | Sistem yöneticisi | Tüm izinler (15 adet) |
| **Operator** | Operasyonel kullanıcı | Cihaz kontrolü, alarm yönetimi |
| **Viewer** | İzleyici | Sadece görüntüleme |

## Veritabanı

Toplam **13 tablo**:
- Güvenlik: profiles, roles, permissions, audit_logs, sessions
- Cihazlar: devices, telemetry, service_history, screen_streams
- İşlemler: alarms
- Bütünlük: manifests

**Seed Data**:
- 3 rol (Admin, Operator, Viewer)
- 15 izin
- 200 cihaz (100 Kiosk + 100 IoT)
- 30+ örnek alarm
- 1000+ telemetri kaydı

## Güvenlik Özellikleri

### Kimlik Doğrulama
- Email/password (Supabase Auth)
- MFA desteği (altyapı hazır)
- Brute force koruması (altyapı hazır)
- Account lockout mekanizması

### Yetkilendirme
- RBAC (Rol Bazlı Erişim Kontrolü)
- Permission-based granüler kontrol
- Row Level Security (RLS)
- Least privilege prensibi

### Denetim ve İzleme
- **Hash Chain**: Değiştirilemez audit log
  ```
  Hash(n) = SHA-256(Hash(n-1) + Event_JSON)
  ```
- **Kapsam**: Login, logout, cihaz komutları, alarm çözme, yetki reddi
- **Bütünlük Doğrulama**: Dashboard'da gerçek zamanlı

### Veri Koruma (KVKK)
- Veri minimizasyonu
- Şifreli depolama (kritik alanlar)
- TLS/HTTPS zorunlu
- Veri saklama politikası desteği

## Dokümantasyon

| Dosya | İçerik |
|-------|--------|
| `README.md` | Bu dosya (genel bakış) |
| `installer/README.md` | MSI installer paketi oluşturma kılavuzu |
| `DOCKER_KURULUM.md` | Docker ile kapalı devre kurulum kılavuzu |
| `OFFLINE_DEPLOYMENT.md` | Offline dağıtım paketi hazırlama ve kurulum |
| `PAKET_ICERIGI.md` | Dağıtım paketi içeriği ve yapısı |
| `KULLANIM_KILAVUZU.md` | Kullanıcı kılavuzu, özellikler, kullanım |
| `GUVENLIK_VE_UYUMLULUK.md` | ISO 27001, KVKK uyumluluğu, güvenlik |
| `HIZLI_BASLANGIC.sql` | Test kullanıcısı oluşturma scripti |
| `kiosk-agent/README.md` | Windows Agent servisi dokümantasyonu |

## Performans

### Grid İzleme
- Eş zamanlı 100+ panel desteği
- Ayarlanabilir grid (2-10 satır, 2-15 sütun)
- Panel boyutu: 80-200px
- Tam ekran optimize

### Gerçek Zamanlı Güncelleme
- Dashboard: 30 saniye
- Cihaz listesi: 10 saniye
- Alarmlar: 15 saniye

## Yapılacaklar (Roadmap)

### Yüksek Öncelik
- [ ] MFA (TOTP) frontend entegrasyonu
- [ ] WebRTC gerçek ekran paylaşımı
- [ ] Cihaz komut backend (restart/shutdown)
- [ ] Rate limiting ve brute force koruması

### Orta Öncelik
- [ ] Export/reporting modülü
- [ ] Advanced filtreleme
- [ ] Push notification
- [ ] Kullanıcı yönetimi UI

### Düşük Öncelik
- [ ] Çoklu dil desteği
- [ ] Dark mode iyileştirmeleri
- [ ] Mobile responsive
- [ ] Dashboard widget özelleştirme

## Build ve Deploy

### Offline Paket Oluşturma (Kapalı Devre Dağıtım)

```bash
# Linux/macOS
./docker/create-offline-package.sh

# Windows
docker\create-offline-package.bat
```

Oluşan paket tüm Docker imajlarını, kaynak kodları ve kurulum scriptlerini içerir.

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Type Check
```bash
npm run typecheck
```

### Lint
```bash
npm run lint
```

## Dağıtım Seçenekleri

### 1. MSI Installer (Windows)
- ✅ Tek tıkla kurulum
- ✅ Grafik arayüzlü sihirbaz
- ✅ Otomatik bağımlılık yönetimi
- ✅ Start Menu entegrasyonu
- ✅ Temiz kaldırma desteği

### 2. Docker (Self-Hosted)
- ✅ Kapalı devre VLAN ortamları
- ✅ Tam kontrol ve izolasyon
- ✅ Kendi veritabanınız
- ✅ Internet gerektirmez
- ✅ Linux/macOS/Windows desteği

### 3. Cloud Supabase (Geliştirme)
- ✅ Hızlı geliştirme
- ✅ Otomatik ölçekleme
- ✅ Yönetim gerektirmez
- ⚠️ Internet bağlantısı gerekli

## Lisans

Kamu kurumu içi kullanım için geliştirilmiştir.

## Destek

Teknik destek: Sistem yöneticinize başvurun

---

**Versiyon**: 1.0.0
**Son Güncelleme**: 2026-01-08
**Dağıtım**: Docker self-hosted + Cloud Supabase
