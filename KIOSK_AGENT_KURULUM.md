# Kiosk Agent Kurulum ve Yapılandırma Kılavuzu

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Sistem Gereksinimleri](#sistem-gereksinimleri)
3. [Kurulum Adımları](#kurulum-adımları)
4. [Yapılandırma](#yapılandırma)
5. [Kullanım](#kullanım)
6. [Sorun Giderme](#sorun-giderme)

## 🎯 Genel Bakış

Kiosk Agent, kiosk cihazlarınızı merkezi yönetim sistemiyle bağlayan hafif ve verimli bir Windows servisidir. Bu agent sayesinde:

- Cihazların sağlık durumunu gerçek zamanlı izleyebilirsiniz
- Uzaktan komut gönderebilirsiniz
- Merkezi log toplama yapabilirsiniz
- Otomatik paket güncellemeleri yapabilirsiniz
- Self-healing özelliği ile hata durumlarında otomatik düzelme sağlar

## 💻 Sistem Gereksinimleri

### Donanım Gereksinimleri
- **CPU**: 1 GHz veya daha hızlı işlemci
- **RAM**: Minimum 50 MB (önerilen: 100 MB)
- **Disk**: Minimum 50 MB boş alan

### Yazılım Gereksinimleri
- **İşletim Sistemi**: Windows 10/11 veya Windows Server 2016+
- **.NET Runtime**: .NET 8.0 Runtime (kurulum ile birlikte gelir)
- **Network**: İnternet bağlantısı (HTTPS - Port 443)

## 📦 Kurulum Adımları

### Adım 1: Device Token Oluşturma

1. Web yönetim paneline giriş yapın
2. **Admin > Device Management** sayfasına gidin
3. İlgili cihazı bulun veya yeni cihaz ekleyin
4. **"Generate Token"** butonuna tıklayın
5. Token'ı güvenli bir yere kopyalayın (sadece bir kez gösterilir!)

### Adım 2: Kurulum Paketini Hazırlama

1. `kiosk-agent` klasörünü kiosk cihazına kopyalayın
2. Klasör içinde aşağıdaki dosyaların olduğundan emin olun:
   - `KioskAgent.exe`
   - `appsettings.json`
   - `install.bat`
   - `uninstall.bat`

### Adım 3: Agent'ı Kurma

1. `install.bat` dosyasına **sağ tıklayın**
2. **"Yönetici olarak çalıştır"** seçeneğini seçin
3. Kurulum sihirbazı aşağıdaki bilgileri isteyecektir:

```
Supabase URL: https://your-project.supabase.co
Device Token: eyJhbGc... (Adım 1'de aldığınız token)
Device ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

4. Enter'a basarak kurulumu tamamlayın
5. Kurulum otomatik olarak servisi başlatacaktır

### Adım 4: Kurulumu Doğrulama

```batch
# Servis durumunu kontrol edin
sc query KioskAgent

# Output şu şekilde olmalı:
# STATE: 4 RUNNING
```

Alternatif olarak:
1. **Windows + R** tuşlarına basın
2. `services.msc` yazın ve Enter'a basın
3. **Kiosk Management Agent** servisini bulun
4. Durumun **"Running"** olduğunu kontrol edin

## ⚙️ Yapılandırma

### appsettings.json Dosyası

Kurulum sonrası yapılandırmayı değiştirmek için:

```json
{
  "KioskAgent": {
    "SupabaseUrl": "https://your-project.supabase.co",
    "DeviceToken": "your-device-token",
    "DeviceId": "your-device-id",
    "HeartbeatIntervalSeconds": 60,
    "CommandPollIntervalSeconds": 30,
    "LogBatchSize": 50,
    "LogSubmissionIntervalSeconds": 300,
    "EnableAutoUpdate": true,
    "MaxRetryAttempts": 3,
    "RetryDelaySeconds": 5,
    "AgentVersion": "1.0.0"
  }
}
```

### Yapılandırma Parametreleri

| Parametre | Açıklama | Varsayılan | Önerilen |
|-----------|----------|------------|----------|
| `HeartbeatIntervalSeconds` | Heartbeat gönderme aralığı | 60 | 30-120 |
| `CommandPollIntervalSeconds` | Komut kontrol aralığı | 30 | 15-60 |
| `LogBatchSize` | Tek seferde gönderilecek log sayısı | 50 | 25-100 |
| `LogSubmissionIntervalSeconds` | Log gönderme aralığı | 300 | 60-600 |
| `EnableAutoUpdate` | Otomatik güncelleme | true | true |
| `MaxRetryAttempts` | Maksimum yeniden deneme | 3 | 3-5 |
| `RetryDelaySeconds` | Yeniden deneme gecikmesi | 5 | 5-10 |

### Yapılandırma Değişikliklerini Uygulama

```batch
# 1. Servisi durdurun
sc stop KioskAgent

# 2. appsettings.json dosyasını düzenleyin
notepad "C:\Program Files\KioskAgent\appsettings.json"

# 3. Servisi başlatın
sc start KioskAgent
```

## 🚀 Kullanım

### Temel Servis Komutları

```batch
# Servisi başlatma
sc start KioskAgent

# Servisi durdurma
sc stop KioskAgent

# Servisi yeniden başlatma
sc stop KioskAgent && sc start KioskAgent

# Servis durumunu kontrol etme
sc query KioskAgent

# Servis yapılandırmasını görüntüleme
sc qc KioskAgent
```

### Log Dosyalarını İnceleme

Loglar şu konumda saklanır:
```
C:\ProgramData\KioskAgent\Logs\agent_YYYY-MM-DD.log
```

Güncel logu açmak için:
```batch
notepad "C:\ProgramData\KioskAgent\Logs\agent_%DATE:~-4%-%DATE:~3,2%-%DATE:~0,2%.log"
```

### Web Panelinden Komut Gönderme

1. Web yönetim paneline giriş yapın
2. **Kiosk Monitoring** sayfasına gidin
3. İlgili cihazı seçin
4. **"Send Command"** butonuna tıklayın
5. Komut türünü seçin (Restart, Health Check, Update, vb.)
6. **"Send"** butonuna tıklayın

### Desteklenen Komutlar

| Komut | Açıklama | Parametreler |
|-------|----------|--------------|
| `health_check` | Sağlık kontrolü yapar | Yok |
| `restart` | Cihazı yeniden başlatır | Yok |
| `update` | Paket güncellemesi yapar | `package_url` |
| `config_sync` | Yapılandırma senkronizasyonu | Yapılandırma |
| `package_deploy` | Paket dağıtımı yapar | `package_id` |
| `custom` | Özel komut çalıştırır | `command`, `args` |

## 🔧 Sorun Giderme

### Servis Başlamıyor

**Olası Nedenler:**
- Token geçersiz veya süresi dolmuş
- Yapılandırma dosyası hatalı
- .NET Runtime kurulu değil
- Yetki problemi

**Çözüm:**

1. Event Viewer'ı açın (`eventvwr.msc`)
2. **Windows Logs > Application** bölümüne gidin
3. **Source: KioskAgent** olan hataları kontrol edin
4. Log dosyalarını kontrol edin:
   ```batch
   type "C:\ProgramData\KioskAgent\Logs\*.log" | more
   ```

### Bağlantı Hatası

**Belirtiler:**
- Heartbeat gönderilemiyor
- Komutlar alınamıyor
- Web panelinde cihaz "offline" görünüyor

**Çözüm:**

1. İnternet bağlantısını kontrol edin:
   ```batch
   ping 8.8.8.8
   ```

2. Supabase URL'e erişimi test edin:
   ```batch
   curl https://your-project.supabase.co/functions/v1/kiosk-heartbeat
   ```

3. Firewall ayarlarını kontrol edin:
   - Port 443 (HTTPS) açık olmalı
   - `KioskAgent.exe` için firewall kuralı ekleyin

4. Proxy ayarlarını kontrol edin (gerekiyorsa)

### Token Hatası

**Belirtiler:**
- "Invalid or expired token" hatası
- 401 Unauthorized yanıtları

**Çözüm:**

1. Web panelinden yeni token oluşturun
2. `appsettings.json` dosyasını güncelleyin:
   ```batch
   notepad "C:\Program Files\KioskAgent\appsettings.json"
   ```
3. Servisi yeniden başlatın:
   ```batch
   sc stop KioskAgent && sc start KioskAgent
   ```

### Yüksek Kaynak Kullanımı

**Normal Değerler:**
- CPU: ~0.1% (idle), ~1-2% (aktif)
- RAM: ~30 MB
- Network: ~1 KB/dakika (idle)

**Yüksek kullanım durumunda:**

1. Log seviyesini düşürün (appsettings.json):
   ```json
   "LogLevel": {
     "Default": "Warning"
   }
   ```

2. Polling intervallerini artırın:
   ```json
   "HeartbeatIntervalSeconds": 120,
   "CommandPollIntervalSeconds": 60
   ```

3. Servisi yeniden başlatın

### Self-Healing Devrede Değil

**Kontrol:**

```batch
# Event Viewer'da self-healing loglarını kontrol edin
wevtutil qe Application /q:"*[System[Provider[@Name='KioskAgent']]]" /f:text /rd:true /c:10
```

**Çözüm:**

1. Servis recovery ayarlarını kontrol edin:
   ```batch
   sc qfailure KioskAgent
   ```

2. Gerekirse recovery ayarlarını yeniden yapın:
   ```batch
   sc failure KioskAgent reset= 86400 actions= restart/5000/restart/10000/restart/30000
   ```

## 🗑️ Kaldırma

### Standart Kaldırma

1. `uninstall.bat` dosyasına **sağ tıklayın**
2. **"Yönetici olarak çalıştır"** seçin
3. Veri ve logları silmek isteyip istemediğinizi seçin

### Manuel Kaldırma

```batch
# 1. Servisi durdurun
sc stop KioskAgent

# 2. Servisi kaldırın
sc delete KioskAgent

# 3. Program dosyalarını silin
rmdir /s /q "C:\Program Files\KioskAgent"

# 4. (Opsiyonel) Veri ve logları silin
rmdir /s /q "C:\ProgramData\KioskAgent"
```

## 🔒 Güvenlik

### Token Güvenliği

- Token'lar **SHA-256** ile hashlenmiş olarak saklanır
- Her token'ın son kullanım zamanı kaydedilir
- Süresi dolan token'lar otomatik olarak geçersiz olur

### Network Güvenliği

- Tüm iletişim **HTTPS** üzerinden yapılır
- Certificate validation aktiftir
- Man-in-the-middle saldırılarına karşı korumalıdır

### En İyi Güvenlik Uygulamaları

1. **Token'ları güvenli saklayın**
   - Token'ları paylaşmayın
   - Düzenli olarak yenileyin (önerilen: 90 gün)
   - Şüpheli aktivite durumunda iptal edin

2. **Firewall kuralları**
   - Sadece gerekli portları açın
   - Giden bağlantıları Supabase URL ile sınırlayın

3. **Log güvenliği**
   - Log dosyalarına erişimi kısıtlayın
   - Hassas bilgilerin loglanmadığından emin olun

4. **Güncelleme**
   - Agent'ı düzenli olarak güncel tutun
   - Güvenlik yamalarını hemen uygulayın

## 📞 Destek

Sorun yaşarsanız:

1. **Logları kontrol edin**: `C:\ProgramData\KioskAgent\Logs\`
2. **Event Viewer'ı kontrol edin**: `eventvwr.msc`
3. **Web panelindeki Audit Logs'u inceleyin**
4. **Destek ekibiyle iletişime geçin**

## 📝 Ek Notlar

- Agent her 5 dakikada bir self-healing kontrolü yapar
- Ardışık 3 başarısız işlemden sonra otomatik recovery başlar
- Memory leak koruması aktiftir (otomatik garbage collection)
- Servis Windows başlangıcında otomatik olarak başlar
- Minimum loglama modu varsayılan olarak aktiftir

---

**Versiyon**: 1.0.0
**Son Güncelleme**: 2026-01-07
