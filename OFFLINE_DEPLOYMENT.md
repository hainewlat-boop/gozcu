# Kapalı Devre (Offline) Dağıtım Paketi

Bu doküman, Kiosk Yönetim Sistemi'nin internet erişimi olmayan kapalı devre ortamlarda nasıl dağıtılacağını açıklar.

## Paket Hazırlama (İnternet Bağlantılı Ortamda)

### Gereksinimler
- Docker 24.0.0+
- Docker Compose 2.20.0+
- En az 20 GB boş disk alanı
- İnternet bağlantısı

### Adım 1: Offline Paketi Oluşturma

#### Linux/macOS

```bash
# Projeyi klonlayın veya kaynak kodları indirin
cd kiosk-management-system

# Paket oluşturma scriptini çalıştırın
./docker/create-offline-package.sh
```

#### Windows

```cmd
REM Proje dizinine gidin
cd kiosk-management-system

REM Paket oluşturma scriptini çalıştırın
docker\create-offline-package.bat

REM Oluşan dizini ZIP ile sıkıştırın
```

Bu script şunları yapar:
1. Tüm kaynak kodları kopyalar
2. Docker imajlarını oluşturur
3. İmajları `.tar` dosyaları olarak dışa aktarır
4. Kurulum scriptlerini ekler
5. Dokümantasyonu dahil eder
6. Tek bir pakette toplar

### Adım 2: Paket İçeriği

Oluşan paket şunları içerir:

```
kiosk-management-system-offline-YYYYMMDD-HHMMSS/
├── docker-compose.yml
├── .env.docker
├── .env.docker.example
├── KURULUM.txt
├── DOCKER_KURULUM.md
├── docker/
│   ├── Dockerfile.frontend
│   ├── nginx.conf
│   ├── kong.yml
│   ├── deploy.sh
│   └── deploy.bat
├── docker-images/
│   ├── supabase_postgres_15.1.0.147.tar
│   ├── supabase_studio_20231123-64a766a.tar
│   ├── kong_2.8.1.tar
│   ├── supabase_gotrue_v2.99.0.tar
│   ├── postgrest_postgrest_v11.2.2.tar
│   ├── supabase_realtime_v2.25.35.tar
│   ├── supabase_postgres-meta_v0.68.0.tar
│   └── kiosk-frontend.tar
├── load-images.sh
├── load-images.bat
├── supabase/migrations/
├── kiosk-agent/
└── src/
```

### Adım 3: Paket Transferi

Oluşan `.tar.gz` veya `.zip` dosyasını hedef sisteme transfer edin:

- USB disk
- CD/DVD
- Dahili ağ üzerinden
- Başka bir güvenli kanal

## Kurulum (Kapalı Devre Ortamda)

### Gereksinimler
- Docker 24.0.0+ (önceden kurulmuş)
- Docker Compose 2.20.0+ (önceden kurulmuş)
- En az 8 GB RAM
- En az 50 GB boş disk alanı

### Adım 1: Paketi Açma

#### Linux/macOS
```bash
# Paketi hedef dizine kopyalayın
cd /opt

# Paketi açın
tar xzf kiosk-management-system-offline-*.tar.gz
cd kiosk-management-system-offline-*
```

#### Windows
```cmd
REM ZIP dosyasını sağ tık ile açın
REM Veya 7-Zip/WinRAR kullanın
cd kiosk-management-system-offline-*
```

### Adım 2: Docker İmajlarını Yükleme

#### Linux/macOS
```bash
# İmajları yükle
./load-images.sh

# Yüklenen imajları kontrol et
docker images
```

#### Windows
```cmd
REM Imajlari yukle
load-images.bat

REM Yuklenen imajlari kontrol et
docker images
```

Bu işlem 5-15 dakika sürebilir. Tüm Docker imajları sisteme yüklenecektir.

### Adım 3: Yapılandırma

`.env.docker` dosyasını düzenleyin ve aşağıdaki değerleri güncelleyin:

```bash
# ÖNEMLİ: Bu değerleri mutlaka değiştirin!

# PostgreSQL şifresi (min 32 karakter)
POSTGRES_PASSWORD=YOUR-SUPER-SECRET-PASSWORD-HERE

# JWT secret (min 32 karakter)
JWT_SECRET=YOUR-JWT-SECRET-KEY-HERE

# Realtime secret (min 32 karakter)
REALTIME_SECRET_KEY_BASE=YOUR-REALTIME-SECRET-HERE

# JWT anahtarları (üretin: https://supabase.com/docs/guides/self-hosting#api-keys)
ANON_KEY=YOUR-GENERATED-ANON-KEY
SERVICE_ROLE_KEY=YOUR-GENERATED-SERVICE-ROLE-KEY

# Sunucu IP adresi
API_EXTERNAL_URL=http://192.168.1.100:8000
SITE_URL=http://192.168.1.100
```

**Güvenli Şifre Oluşturma:**

Linux/macOS:
```bash
openssl rand -base64 32
```

Windows PowerShell:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

### Adım 4: Sistemi Başlatma

#### Linux/macOS
```bash
# Deployment scriptini çalıştır
./docker/deploy.sh
```

#### Windows
```cmd
REM Deployment scriptini calistir
docker\deploy.bat
```

Script otomatik olarak:
1. Docker imajlarını doğrular
2. Konteynerleri başlatır
3. Veritabanını hazırlar
4. Migrationları uygular
5. Sistem durumunu kontrol eder

### Adım 5: İlk Admin Kullanıcısı

Sistem başarıyla başladıktan sonra, Supabase Studio'ya gidin:

`http://your-server-ip:3000`

SQL Editor'de aşağıdaki komutu çalıştırın:

```sql
-- 1. Admin kullanıcısı oluştur
DO $$
DECLARE
  new_user_id uuid;
  admin_role_id uuid;
BEGIN
  -- Kullanıcı oluştur
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    instance_id,
    aud,
    role
  ) VALUES (
    gen_random_uuid(),
    'admin@example.com',
    crypt('Admin123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated'
  ) RETURNING id INTO new_user_id;

  -- Profile oluştur
  INSERT INTO public.profiles (id, username, full_name, status)
  VALUES (new_user_id, 'admin', 'Sistem Yöneticisi', 'active');

  -- Admin rolü bul
  SELECT id INTO admin_role_id FROM public.roles WHERE name = 'admin';

  -- Admin rolü ata
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (new_user_id, admin_role_id);

  RAISE NOTICE 'Admin kullanıcısı oluşturuldu: %', new_user_id;
END $$;
```

### Adım 6: Sisteme Giriş

1. Tarayıcınızda `http://your-server-ip` adresine gidin
2. Email: `admin@example.com`
3. Şifre: `Admin123!`
4. İlk girişten sonra şifrenizi değiştirin

## Kiosk Agent Kurulumu

Kiosk cihazlarına agent kurmak için:

### Windows

1. `kiosk-agent` klasörünü kiosk cihazına kopyalayın
2. `appsettings.json` dosyasını düzenleyin:

```json
{
  "KioskAgent": {
    "ServerUrl": "http://192.168.1.100:8000",
    "DeviceToken": "",
    "DeviceId": "",
    "PollingIntervalSeconds": 30,
    "HeartbeatIntervalSeconds": 60,
    "LogSubmissionIntervalMinutes": 5
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information"
    }
  }
}
```

3. Agent'ı Windows Service olarak yükleyin:

```cmd
cd kiosk-agent
install.bat
```

4. Web arayüzünden cihazı kaydedin ve token'ı `appsettings.json` dosyasına ekleyin

## Doğrulama ve Test

### Sistem Durumu Kontrolü

```bash
# Tüm servislerin durumunu kontrol edin
docker-compose ps

# Beklenen çıktı: Tüm servisler "Up" durumunda olmalı
```

### Servis Erişim Testleri

```bash
# Frontend erişimi
curl http://localhost

# API Gateway erişimi
curl http://localhost:8000/auth/v1/health

# PostgreSQL bağlantısı
docker-compose exec postgres pg_isready -U postgres
```

### Log Kontrolleri

```bash
# Tüm logları görüntüle
docker-compose logs

# Hata loglarını filtrele
docker-compose logs | grep -i error

# Belirli bir servisin logları
docker-compose logs frontend
docker-compose logs postgres
```

## Bakım ve Güncelleme

### Yedekleme

#### Veritabanı Yedekleme
```bash
# Yedek oluştur
docker-compose exec postgres pg_dump -U postgres postgres > backup_$(date +%Y%m%d).sql

# Geri yükle
docker-compose exec -T postgres psql -U postgres postgres < backup_20240108.sql
```

#### Volume Yedekleme
```bash
# PostgreSQL data volume'ünü yedekle
docker run --rm \
  -v kiosk-management-system_postgres-data:/data \
  -v $(pwd):/backup \
  ubuntu tar czf /backup/postgres-backup.tar.gz /data
```

### Sistem Güncellemesi

Yeni bir offline paket aldığınızda:

```bash
# 1. Veritabanını yedekleyin
docker-compose exec postgres pg_dump -U postgres postgres > pre-update-backup.sql

# 2. Sistemi durdurun
docker-compose down

# 3. Yeni imajları yükleyin
./load-images.sh  # veya load-images.bat

# 4. Yeni yapılandırmaları kopyalayın (gerekirse)
# 5. Sistemi başlatın
./docker/deploy.sh  # veya docker\deploy.bat
```

## Sorun Giderme

### PostgreSQL Başlamıyor

```bash
# Logları kontrol edin
docker-compose logs postgres

# Volume'ü sıfırlayın (DİKKAT: Tüm veri silinir!)
docker-compose down -v
docker-compose up -d
```

### Ağ Bağlantı Sorunları

```bash
# Docker ağını kontrol edin
docker network ls
docker network inspect kiosk-management-system_kiosk-network

# Konteynerlerin birbirlerini görebildiğini test edin
docker-compose exec frontend ping kong
docker-compose exec kong ping postgres
```

### Disk Alanı Doldu

```bash
# Kullanılmayan imajları ve konteynerleri temizle
docker system prune -a

# Volume boyutlarını kontrol et
docker system df -v
```

### Port Çakışmaları

Eğer portlar kullanımdaysa, `docker-compose.yml` dosyasındaki portları değiştirin:

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # 80 yerine 8080
```

## Güvenlik Kontrol Listesi

- [ ] Tüm varsayılan şifreler değiştirildi
- [ ] JWT secret değiştirildi ve güçlü
- [ ] Service role key güvenli bir yerde saklanıyor
- [ ] Firewall kuralları yapılandırıldı
- [ ] Sadece gerekli portlar açık
- [ ] HTTPS/SSL yapılandırıldı (üretim için)
- [ ] Düzenli yedekleme planlandı
- [ ] Log rotation yapılandırıldı
- [ ] Sistem güncellemeleri için plan var

## Performans Optimizasyonu

### PostgreSQL

`docker-compose.yml` içinde PostgreSQL için:

```yaml
postgres:
  environment:
    # Connection pooling
    POSTGRES_MAX_CONNECTIONS: 100
    POSTGRES_SHARED_BUFFERS: 256MB
    POSTGRES_EFFECTIVE_CACHE_SIZE: 1GB
    POSTGRES_WORK_MEM: 16MB
```

### Nginx Cache

Nginx yapılandırmasında cache ayarları zaten yapılmıştır. Cache boyutunu artırmak için:

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=STATIC:50m inactive=7d use_temp_path=off;
```

## Ek Kaynaklar

- **Detaylı Kurulum**: `DOCKER_KURULUM.md`
- **Kiosk Agent**: `kiosk-agent/README.md`
- **Hızlı Başlangıç SQL**: `HIZLI_BASLANGIC.sql`
- **Kullanıcı Kılavuzu**: `KULLANIM_KILAVUZU.md`
- **Güvenlik**: `GUVENLIK_DOKUMANI.md`

## Destek

Sorun yaşarsanız:

1. `docker-compose logs` çıktısını inceleyin
2. Sistem gereksinimlerini doğrulayın
3. `.env.docker` yapılandırmasını kontrol edin
4. Ağ bağlantılarını test edin
5. Dokümantasyonu tekrar gözden geçirin

---

**Not**: Bu sistem kapalı devre ortamlarda çalışmak üzere tasarlanmıştır. Tüm bağımlılıklar pakete dahildir ve internet bağlantısı gerektirmez.
