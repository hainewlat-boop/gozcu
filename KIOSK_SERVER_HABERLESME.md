# Kiosk-Server Haberleşme Mimarisi

## 📋 Genel Bakış

Bu doküman, kiosk cihazları ile merkezi sunucu arasındaki haberleşme protokolünü ve mimarisini açıklar.

## 🏗️ Mimari Özet

```
┌─────────────────┐         HTTPS (Port 443)        ┌──────────────────┐
│                 │  ────────────────────────────>   │                  │
│  Kiosk Agent    │                                  │  Supabase Edge   │
│  (Windows)      │  <────────────────────────────   │  Functions       │
│                 │                                  │                  │
└─────────────────┘                                  └──────────────────┘
        │                                                     │
        │                                                     │
        ▼                                                     ▼
┌─────────────────┐                                  ┌──────────────────┐
│  Local System   │                                  │   PostgreSQL     │
│  - CPU/RAM      │                                  │   Database       │
│  - Disk         │                                  │                  │
│  - Logs         │                                  │                  │
└─────────────────┘                                  └──────────────────┘
```

## 🔐 Kimlik Doğrulama

### Token Tabanlı Kimlik Doğrulama

Her kiosk cihazı için benzersiz bir device token oluşturulur:

1. **Token Oluşturma**:
   ```typescript
   const token = crypto.randomUUID() + '-' + Date.now();
   const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
   ```

2. **Token Saklama**:
   - Kiosk: `appsettings.json` dosyasında plain text
   - Sunucu: `device_auth_tokens` tablosunda SHA-256 hash olarak

3. **Token Doğrulama**:
   ```typescript
   // Her istekte token hash'i doğrulanır
   const isValid = await validateToken(supabase, deviceToken);
   if (!isValid) return 401 Unauthorized;
   ```

### Token Yaşam Döngüsü

```
Oluşturma → Aktif → Son Kullanım Güncelleme → Süresi Dolma → Yenileme
   (0 gün)  (1-90 gün)  (Her kullanımda)       (90 gün)    (Manuel)
```

## 📡 Haberleşme Protokolleri

### 1. Heartbeat (Canlılık Sinyali)

**Amaç**: Cihazın aktif ve sağlıklı olduğunu bildirmek

**Endpoint**: `POST /functions/v1/kiosk-heartbeat`

**Sıklık**: 60 saniyede bir (yapılandırılabilir)

**Request Payload**:
```json
{
  "device_token": "xxx",
  "cpu_usage": 45.2,
  "memory_usage": 62.8,
  "disk_usage": 78.5,
  "agent_version": "1.0.0",
  "status_info": {
    "os": "Windows 10",
    "uptime_hours": 124.5
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Heartbeat recorded"
}
```

**Flowchart**:
```
Agent → Her 60 saniyede bir
  ↓
Sistem metriklerini topla (CPU, RAM, Disk)
  ↓
POST /kiosk-heartbeat
  ↓
Sunucu token'ı doğrula
  ↓
kiosk_heartbeat tablosunu güncelle
  ↓
devices tablosunda status='online' yap
```

### 2. Command Polling (Komut Yoklama)

**Amaç**: Bekleyen komutları almak

**Endpoint**: `POST /functions/v1/kiosk-poll-commands`

**Sıklık**: 30 saniyede bir (yapılandırılabilir)

**Request Payload**:
```json
{
  "device_token": "xxx"
}
```

**Response**:
```json
{
  "commands": [
    {
      "id": "uuid",
      "command_type": "health_check",
      "payload": {},
      "priority": 1
    }
  ]
}
```

**Flowchart**:
```
Agent → Her 30 saniyede bir
  ↓
POST /kiosk-poll-commands
  ↓
Sunucu token'ı doğrula
  ↓
kiosk_commands tablosundan pending komutları al
  ↓
Komutları 'processing' olarak işaretle
  ↓
Komutları agent'a gönder
  ↓
Agent komutları sırayla çalıştır
  ↓
Her komut için sonucu bildir
```

### 3. Command Status Update (Komut Sonucu Bildirimi)

**Amaç**: Çalıştırılan komutun sonucunu bildirmek

**Endpoint**: `POST /functions/v1/kiosk-update-command-status`

**Sıklık**: Her komut çalıştırıldıktan sonra

**Request Payload**:
```json
{
  "device_token": "xxx",
  "command_id": "uuid",
  "status": "completed",
  "result": {
    "message": "Health check completed",
    "data": {}
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Command status updated"
}
```

### 4. Log Submission (Log Gönderimi)

**Amaç**: Merkezi log toplama

**Endpoint**: `POST /functions/v1/kiosk-submit-logs`

**Sıklık**: 5 dakikada bir veya 50 log biriktiğinde

**Request Payload**:
```json
{
  "device_token": "xxx",
  "logs": [
    {
      "log_level": "info",
      "source": "HeartbeatService",
      "message": "Heartbeat sent successfully",
      "metadata": {},
      "timestamp": "2026-01-07T10:30:00Z"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "5 logs recorded"
}
```

## 🗄️ Database Şeması

### device_auth_tokens

Token yönetimi için:

```sql
CREATE TABLE device_auth_tokens (
  id uuid PRIMARY KEY,
  device_id uuid REFERENCES devices(id),
  token_hash text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

### kiosk_heartbeat

Cihaz sağlık durumu:

```sql
CREATE TABLE kiosk_heartbeat (
  id uuid PRIMARY KEY,
  device_id uuid UNIQUE REFERENCES devices(id),
  cpu_usage numeric,
  memory_usage numeric,
  disk_usage numeric,
  agent_version text NOT NULL,
  last_heartbeat timestamptz DEFAULT now(),
  status_info jsonb DEFAULT '{}'
);
```

### kiosk_commands

Komut kuyruğu:

```sql
CREATE TABLE kiosk_commands (
  id uuid PRIMARY KEY,
  device_id uuid REFERENCES devices(id),
  command_type text CHECK (command_type IN ('restart', 'update', 'config_sync', 'package_deploy', 'health_check', 'custom')),
  payload jsonb DEFAULT '{}',
  priority integer DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
  result jsonb,
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  executed_at timestamptz,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);
```

### kiosk_logs

Merkezi loglar:

```sql
CREATE TABLE kiosk_logs (
  id uuid PRIMARY KEY,
  device_id uuid REFERENCES devices(id),
  log_level text CHECK (log_level IN ('debug', 'info', 'warning', 'error', 'critical')),
  source text NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
```

## 🔄 Komut İşleme Süreci

### Komut Gönderme (Web Panel → Kiosk)

```
1. Kullanıcı web panelinden komut gönderir
   ↓
2. Frontend → POST /api/kiosk-commands
   {
     "device_id": "xxx",
     "command_type": "restart",
     "payload": {}
   }
   ↓
3. Backend kiosk_commands tablosuna ekler
   status: 'pending'
   expires_at: now() + 24 hours
   ↓
4. Kiosk agent poll yapar (30 saniyede bir)
   ↓
5. Pending komutları alır
   status: 'processing' olarak güncellenir
   ↓
6. Agent komutu çalıştırır
   ↓
7. Sonucu bildirir
   status: 'completed' veya 'failed'
   result: { ... }
```

### Komut Türleri ve İşlevleri

#### 1. health_check
```json
{
  "command_type": "health_check",
  "payload": {}
}
```
**Yanıt**:
```json
{
  "status": "healthy",
  "os": "Windows 10",
  "machine_name": "KIOSK-01",
  "processor_count": 4
}
```

#### 2. restart
```json
{
  "command_type": "restart",
  "payload": {}
}
```
**Yanıt**:
```json
{
  "message": "Restart scheduled in 5 seconds"
}
```

#### 3. update
```json
{
  "command_type": "update",
  "payload": {
    "package_url": "https://..."
  }
}
```
**Yanıt**:
```json
{
  "message": "Update initiated",
  "package_url": "https://..."
}
```

#### 4. config_sync
```json
{
  "command_type": "config_sync",
  "payload": {
    "HeartbeatIntervalSeconds": 120
  }
}
```
**Yanıt**:
```json
{
  "message": "Configuration synchronized"
}
```

#### 5. package_deploy
```json
{
  "command_type": "package_deploy",
  "payload": {
    "package_id": "uuid",
    "package_url": "https://..."
  }
}
```
**Yanıt**:
```json
{
  "message": "Package deployment initiated",
  "package_id": "uuid"
}
```

#### 6. custom
```json
{
  "command_type": "custom",
  "payload": {
    "command": "ipconfig",
    "args": ["/all"]
  }
}
```
**Yanıt**:
```json
{
  "message": "Custom command executed",
  "output": "..."
}
```

## 🛡️ Güvenlik Mekanizmaları

### 1. Token Güvenliği

- **SHA-256 Hashing**: Token'lar asla plain text olarak saklanmaz
- **Expiration**: Token'lar varsayılan 90 gün sonra sona erer
- **Last Used Tracking**: Her kullanımda son kullanım zamanı güncellenir
- **Automatic Cleanup**: Süresi dolan token'lar otomatik silinir

### 2. Rate Limiting

- **Heartbeat**: Maksimum 2 istek/dakika
- **Command Polling**: Maksimum 4 istek/dakika
- **Log Submission**: Maksimum 1 istek/dakika
- **Command Status Update**: Maksimum 10 istek/dakika

### 3. Input Validation

- **Token Format**: UUID + timestamp formatı
- **Payload Size**: Maksimum 1 MB
- **Log Batch Size**: Maksimum 100 log/istek
- **Command Expiration**: Otomatik 24 saat sonra

### 4. Transport Security

- **HTTPS Only**: Tüm iletişim TLS 1.2+ üzerinden
- **Certificate Pinning**: Supabase sertifikası doğrulanır
- **No Plain Text**: Hassas veriler şifrelenmeden gönderilmez

## 📊 Monitoring ve Alerting

### Cihaz Durumu Kontrolü

Sunucu tarafında otomatik kontroller:

1. **Heartbeat Timeout** (5 dakika):
   ```sql
   UPDATE devices SET status = 'offline'
   WHERE id IN (
     SELECT device_id FROM kiosk_heartbeat
     WHERE last_heartbeat < now() - interval '5 minutes'
   );
   ```

2. **Command Expiration** (24 saat):
   ```sql
   UPDATE kiosk_commands SET status = 'expired'
   WHERE status = 'pending'
   AND expires_at < now();
   ```

3. **Log Cleanup** (30 gün):
   ```sql
   DELETE FROM kiosk_logs
   WHERE created_at < now() - interval '30 days';
   ```

### Alarm Senaryoları

| Senaryo | Koşul | Alarm Seviyesi |
|---------|-------|----------------|
| Cihaz Offline | Heartbeat > 5 dakika | Warning |
| Cihaz Offline Uzun Süre | Heartbeat > 30 dakika | Critical |
| Yüksek CPU | CPU > 90% (3 ölçüm) | Warning |
| Yüksek Memory | Memory > 95% | Warning |
| Disk Dolu | Disk > 90% | Warning |
| Komut Başarısız | Command status = 'failed' | Info |
| Agent Crash | No heartbeat + service stopped | Critical |

## 🔧 Performans Optimizasyonları

### 1. Connection Pooling

- Edge Functions otomatik connection pooling kullanır
- Maksimum 10 concurrent connection

### 2. Batching

- Loglar batch olarak gönderilir (50 log/istek)
- Command polling tek istekte 10 komuta kadar alır

### 3. Caching

- Device token validation sonuçları 5 dakika cache'lenir
- Heartbeat data 60 saniye cache'lenir

### 4. Indexing

```sql
-- Performans için kritik indexler
CREATE INDEX idx_kiosk_heartbeat_last ON kiosk_heartbeat(last_heartbeat DESC);
CREATE INDEX idx_kiosk_commands_status ON kiosk_commands(status) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_kiosk_logs_timestamp ON kiosk_logs(timestamp DESC);
CREATE INDEX idx_device_auth_tokens_hash ON device_auth_tokens(token_hash);
```

## 🐛 Debugging ve Troubleshooting

### Kiosk Agent Logları

```
C:\ProgramData\KioskAgent\Logs\agent_2026-01-07.log
```

### Edge Function Logları

Supabase Dashboard → Functions → [function-name] → Logs

### Database Queries

```sql
-- Son 10 heartbeat kontrolü
SELECT * FROM kiosk_heartbeat
ORDER BY last_heartbeat DESC LIMIT 10;

-- Bekleyen komutlar
SELECT * FROM kiosk_commands
WHERE status = 'pending'
ORDER BY priority, created_at;

-- Son hatalar
SELECT * FROM kiosk_logs
WHERE log_level = 'error'
ORDER BY timestamp DESC LIMIT 20;

-- Token durumu
SELECT d.name, t.last_used_at, t.expires_at
FROM device_auth_tokens t
JOIN devices d ON t.device_id = d.id
WHERE t.expires_at > now();
```

## 📈 Metrikler ve KPI'lar

### Sistem Sağlığı

- **Uptime**: Cihazların online olma yüzdesi
- **Response Time**: Heartbeat yanıt süresi
- **Command Success Rate**: Başarılı komut oranı
- **Log Delivery Rate**: Log teslim başarı oranı

### Örnek Dashboard Query

```sql
-- Online cihaz oranı (son 5 dakika)
SELECT
  COUNT(CASE WHEN last_heartbeat > now() - interval '5 minutes' THEN 1 END) * 100.0 / COUNT(*) as online_percentage
FROM kiosk_heartbeat;

-- Ortalama komut yanıt süresi
SELECT
  AVG(EXTRACT(EPOCH FROM (executed_at - created_at))) as avg_response_seconds
FROM kiosk_commands
WHERE status = 'completed'
AND created_at > now() - interval '24 hours';
```

---

**Versiyon**: 1.0.0
**Son Güncelleme**: 2026-01-07
**Yazar**: IoT Management System Team
