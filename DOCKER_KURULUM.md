# Kapalı Devre (Air-Gapped) Docker Kurulum Kılavuzu

Bu kılavuz, Kiosk Yönetim Sistemi'nin kapalı devre VLAN ortamında Docker kullanılarak nasıl kurulacağını açıklar.

## Sistem Gereksinimleri

### Donanım
- **CPU**: 4 Core (önerilen 8 Core)
- **RAM**: 8 GB (önerilen 16 GB)
- **Disk**: 100 GB boş alan
- **Ağ**: Kapalı devre VLAN bağlantısı

### Yazılım
- **İşletim Sistemi**:
  - Linux (Ubuntu 20.04+, CentOS 8+, RHEL 8+)
  - Windows Server 2019+
  - macOS 11+
- **Docker**: 24.0.0+
- **Docker Compose**: 2.20.0+

## Kurulum Öncesi Hazırlık

### 1. Docker ve Docker Compose Kurulumu

#### Linux (Ubuntu/Debian)
```bash
# Docker kurulumu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose kurulumu
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Windows
1. Docker Desktop'ı indirin: https://www.docker.com/products/docker-desktop
2. Kurulum dosyasını çalıştırın
3. Sistemi yeniden başlatın

### 2. Paket İçeriği

Dağıtım paketi aşağıdaki dosyaları içerir:

```
kiosk-management-system/
├── docker-compose.yml           # Ana orchestration dosyası
├── .env.docker                  # Ortam değişkenleri
├── docker/
│   ├── Dockerfile.frontend      # Frontend build
│   ├── nginx.conf              # Web server yapılandırması
│   ├── kong.yml                # API Gateway yapılandırması
│   ├── deploy.sh               # Linux deployment script
│   └── deploy.bat              # Windows deployment script
├── supabase/
│   └── migrations/             # Veritabanı migration dosyaları
├── kiosk-agent/                # Windows Agent servisi
└── src/                        # Frontend kaynak kodları
```

## Hızlı Kurulum

### Linux/macOS

```bash
# 1. Paketi hedef sisteme kopyalayın
cd kiosk-management-system

# 2. Deploy script'ini çalıştırılabilir yapın
chmod +x docker/deploy.sh

# 3. Kurulumu başlatın
./docker/deploy.sh
```

### Windows

```cmd
REM 1. Paketi hedef sisteme kopyalayın
cd kiosk-management-system

REM 2. Deploy script'ini çalıştırın
docker\deploy.bat
```

## Manuel Kurulum

### Adım 1: Ortam Değişkenlerini Yapılandırma

`.env.docker` dosyasını düzenleyin:

```bash
# ÖNEMLİ: Üretim ortamı için bu değerleri değiştirin!

# Güvenli şifreler oluşturun
POSTGRES_PASSWORD=your-super-secure-postgres-password-min-32-chars
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars-long
REALTIME_SECRET_KEY_BASE=your-super-secure-realtime-key-min-32-chars

# API anahtarları (JWT generator ile oluşturun)
ANON_KEY=your-generated-anon-key
SERVICE_ROLE_KEY=your-generated-service-role-key

# Ağ yapılandırması
API_EXTERNAL_URL=http://your-server-ip:8000
SITE_URL=http://your-server-ip
```

#### Güvenli Şifre Oluşturma

**Linux/macOS:**
```bash
# PostgreSQL şifresi
openssl rand -base64 32

# JWT secret
openssl rand -base64 32

# Realtime secret
openssl rand -base64 64
```

**Windows PowerShell:**
```powershell
# Rastgele şifre oluşturma
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

#### JWT Anahtarları Oluşturma

JWT anahtarlarınızı oluşturmak için: https://supabase.com/docs/guides/self-hosting#api-keys

Veya aşağıdaki Node.js script'ini kullanın:

```javascript
const jwt = require('jsonwebtoken');

const secret = 'your-jwt-secret-here';

// Anon key
const anonToken = jwt.sign(
  { role: 'anon', iss: 'supabase' },
  secret,
  { expiresIn: '10y' }
);

// Service role key
const serviceToken = jwt.sign(
  { role: 'service_role', iss: 'supabase' },
  secret,
  { expiresIn: '10y' }
);

console.log('ANON_KEY:', anonToken);
console.log('SERVICE_ROLE_KEY:', serviceToken);
```

### Adım 2: Docker İmajlarını Oluşturma

```bash
docker-compose build --no-cache
```

### Adım 3: Servisleri Başlatma

```bash
docker-compose up -d
```

### Adım 4: Durum Kontrolü

```bash
# Tüm konteynerlerin durumunu kontrol edin
docker-compose ps

# Logları takip edin
docker-compose logs -f

# Belirli bir servisin loglarını görüntüleyin
docker-compose logs -f postgres
docker-compose logs -f frontend
```

## İlk Yapılandırma

### 1. Admin Kullanıcısı Oluşturma

Sistem başarıyla başladıktan sonra, ilk admin kullanıcısını oluşturun:

**Yöntem 1: Supabase Studio (Önerilen)**

1. Tarayıcınızda `http://your-server-ip:3000` adresine gidin
2. Service role key ile giriş yapın
3. SQL Editor'e gidin
4. Aşağıdaki SQL'i çalıştırın:

```sql
-- Admin kullanıcısı oluştur
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@example.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
) RETURNING id;

-- Profile oluştur (yukarıdaki ID'yi kullanın)
INSERT INTO public.profiles (id, username, full_name, status)
VALUES (
  'YUKARIDAKI-USER-ID',
  'admin',
  'Sistem Yöneticisi',
  'active'
);

-- Admin rolü ata
INSERT INTO public.user_roles (user_id, role_id)
SELECT
  'YUKARIDAKI-USER-ID',
  id
FROM public.roles
WHERE name = 'admin';
```

**Yöntem 2: Komut Satırı**

```bash
docker-compose exec postgres psql -U postgres -d postgres -c "
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (gen_random_uuid(), 'admin@example.com', crypt('admin123', gen_salt('bf')), now(), '{\"provider\":\"email\",\"providers\":[\"email\"]}', '{}', now(), now());
"
```

### 2. Sistem Erişimi

Kurulum tamamlandıktan sonra sisteme şu adreslerde erişebilirsiniz:

- **Frontend Uygulaması**: `http://your-server-ip`
- **Supabase Studio**: `http://your-server-ip:3000`
- **API Gateway**: `http://your-server-ip:8000`
- **PostgreSQL**: `your-server-ip:5432`

## Kiosk Agent Kurulumu

Kiosk cihazlarına agent kurmak için:

1. `kiosk-agent` klasörünü kiosk cihazına kopyalayın
2. `appsettings.json` dosyasını düzenleyin:

```json
{
  "KioskAgent": {
    "ServerUrl": "http://your-server-ip:8000",
    "DeviceToken": "your-device-registration-token"
  }
}
```

3. Agent'ı yükleyin:

**Windows:**
```cmd
cd kiosk-agent
install.bat
```

**Linux:**
```bash
cd kiosk-agent
sudo ./install.sh
```

## Bakım ve Yönetim

### Yedekleme

#### Veritabanı Yedekleme

```bash
# Manuel yedekleme
docker-compose exec postgres pg_dump -U postgres postgres > backup_$(date +%Y%m%d_%H%M%S).sql

# Geri yükleme
docker-compose exec -T postgres psql -U postgres postgres < backup_20240108_120000.sql
```

#### Volume Yedekleme

```bash
# Tüm volume'leri yedekle
docker run --rm -v kiosk-management-system_postgres-data:/data -v $(pwd):/backup ubuntu tar czf /backup/postgres-data-backup.tar.gz /data
```

### Güncelleme

```bash
# 1. Yeni versiyonu indirin
# 2. Mevcut sistemi durdurun
docker-compose down

# 3. Yeni imajları oluşturun
docker-compose build --no-cache

# 4. Sistemi başlatın
docker-compose up -d
```

### Log Yönetimi

```bash
# Tüm logları görüntüle
docker-compose logs

# Belirli servis logları
docker-compose logs frontend
docker-compose logs postgres

# Canlı log takibi
docker-compose logs -f --tail=100

# Log boyutunu sınırla (docker-compose.yml'de)
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### Performans İzleme

```bash
# Kaynak kullanımını izle
docker stats

# Disk kullanımı
docker system df

# Kullanılmayan kaynakları temizle
docker system prune -a
```

## Sorun Giderme

### PostgreSQL Başlamıyor

```bash
# Logları kontrol edin
docker-compose logs postgres

# Veritabanı bütünlüğünü kontrol edin
docker-compose exec postgres pg_isready -U postgres

# Yeniden başlatın
docker-compose restart postgres
```

### Frontend Erişim Hatası

```bash
# Nginx loglarını kontrol edin
docker-compose logs frontend

# Yapılandırmayı test edin
docker-compose exec frontend nginx -t

# Yeniden build edin
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### API Gateway (Kong) Hataları

```bash
# Kong loglarını kontrol edin
docker-compose logs kong

# Yapılandırmayı doğrulayın
docker-compose exec kong kong config db_import /var/lib/kong/kong.yml
```

### Bağlantı Sorunları

```bash
# Ağ bağlantısını test edin
docker-compose exec frontend ping kong
docker-compose exec kong ping auth
docker-compose exec auth ping postgres

# Port dinlemelerini kontrol edin
docker-compose exec frontend netstat -tlnp
```

### Tam Reset (Dikkat: Tüm veriler silinir!)

```bash
# Tüm konteynerleri ve volume'leri sil
docker-compose down -v

# Tüm imajları sil
docker-compose down --rmi all

# Temiz kurulum
docker-compose build --no-cache
docker-compose up -d
```

## Güvenlik Önerileri

### 1. Şifreleri Değiştirin
- Varsayılan şifreleri mutlaka değiştirin
- Güçlü, rastgele şifreler kullanın (min 32 karakter)
- Şifreleri güvenli bir şekilde saklayın

### 2. Ağ Güvenliği
- Sadece gerekli portları açın
- Firewall kuralları yapılandırın
- HTTPS kullanın (SSL sertifikası ekleyin)

### 3. Yedekleme
- Düzenli otomatik yedekleme yapın
- Yedekleri farklı bir konumda saklayın
- Yedeklemeleri şifreleyin

### 4. Güncellemeler
- Docker imajlarını düzenli güncelleyin
- Güvenlik yamalarını takip edin
- Test ortamında güncellemeleri test edin

### 5. Monitoring
- Log toplama ve analiz
- Performans metrikleri
- Güvenlik olayları izleme

## SSL/TLS Yapılandırması

HTTPS için SSL sertifikası eklemek için:

### 1. Sertifika Dosyalarını Hazırlayın

```
docker/ssl/
├── certificate.crt
└── private.key
```

### 2. Nginx Yapılandırmasını Güncelleyin

`docker/nginx.conf` dosyasına ekleyin:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    ssl_certificate /etc/nginx/ssl/certificate.crt;
    ssl_certificate_key /etc/nginx/ssl/private.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... mevcut yapılandırma
}

server {
    listen 80;
    listen [::]:80;
    return 301 https://$host$request_uri;
}
```

### 3. Docker Compose'a Volume Ekleyin

```yaml
frontend:
  volumes:
    - ./docker/ssl:/etc/nginx/ssl:ro
```

## Destek ve İletişim

Kurulum sırasında sorun yaşarsanız:

1. `docker-compose logs` çıktısını kontrol edin
2. Sistem gereksinimlerini doğrulayın
3. Ağ yapılandırmasını kontrol edin
4. Dokümantasyonu tekrar gözden geçirin

## Lisans

Bu yazılım, kurumunuzun lisans sözleşmesi kapsamında kullanılmaktadır.
