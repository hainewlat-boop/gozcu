# MSI Installer Paketi - Hızlı Özet

Bu doküman, MSI installer paketinin nasıl oluşturulacağını ve kullanılacağını özetler.

## Ne Yapıyor?

PowerShell scriptleri kullanarak:
1. ✅ Tüm bağımlılıkları internetten indirir (Docker images, installers)
2. ✅ Frontend ve Kiosk Agent'ı build eder
3. ✅ Tek dosyalı MSI installer oluşturur (~7-10 GB)
4. ✅ ZIP arşiv hazırlar

## Tek Komut

### Kolay Yol (Önerilen)

```batch
# installer dizinine gidin
# CALISTIR-BENI.bat dosyasına sağ tıklayın
# "Yönetici Olarak Çalıştır" seçin
```

### PowerShell Yolu

```powershell
# PowerShell'i yönetici olarak açın
cd installer

# Execution policy hatası alırsanız:
powershell.exe -ExecutionPolicy Bypass -File .\Build-Complete-Package.ps1

# Veya normal çalıştırın:
.\Build-Complete-Package.ps1
```

**Süre**: 30-60 dakika
**Çıktı**: `final-package/KioskManagementSystem-Complete-YYYYMMDD-HHMMSS.zip`

## Gereksinimler

### Paket Oluşturma (İnternet Bağlantılı Ortam)
- Windows 10/11
- PowerShell 5.1+
- Docker Desktop
- Node.js 18+
- Internet bağlantısı
- ~20 GB disk alanı

### MSI Kurulumu (Hedef Sistem - Kapalı Devre)
- Windows 10/11 veya Server 2019+
- Yönetici yetkisi
- 8 GB RAM (önerilen 16 GB)
- 50 GB disk alanı
- İnternet **gerekmez**

## Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `Build-Complete-Package.ps1` | ⭐ Ana script (her şeyi yapar) |
| `Download-Dependencies.ps1` | Bağımlılıkları indirir |
| `Build-MSI.ps1` | MSI paketi oluşturur |
| `Product.wxs` | WiX yapılandırması |
| `Turkish.wxl` | Türkçe yerelleştirme |
| `README.md` | Detaylı dokümantasyon |

## İş Akışı

```
Internet Bağlantılı Ortam                    Kapalı Devre Ortam
========================                    ===================

1. Build-Complete-Package.ps1
   ↓
2. Tüm bağımlılıklar indirilir
   • Docker images (8 adet)
   • Docker Desktop installer
   • .NET Runtime installer
   ↓
3. Frontend ve Agent build
   ↓
4. MSI installer oluşturulur
   ↓
5. ZIP arşiv hazırlanır                      →   Transfer (USB/CD)
                                                   ↓
                                              6. ZIP açılır
                                                   ↓
                                              7. MSI çalıştırılır
                                                   ↓
                                              8. Grafik sihirbaz
                                                   ↓
                                              9. Otomatik kurulum
                                                   ↓
                                              10. Sistem hazır! ✅
```

## Örnek Kullanım

### Senaryo 1: İlk Kez Paket Oluşturma (KOLAY YOL)

```batch
# 1. installer dizinini Windows Explorer'da açın
# 2. CALISTIR-BENI.bat dosyasına SAĞ TIKLAYIN
# 3. "Yönetici Olarak Çalıştır" seçin
# 4. Ekrandaki talimatları takip edin
# 5. Bekleyin (30-60 dakika)
# 6. Çıktı: final-package\KioskManagementSystem-Complete-*.zip
```

### Senaryo 1b: PowerShell ile (İleri Seviye)

```powershell
# 1. PowerShell'i yönetici olarak aç
Start-Process powershell -Verb RunAs

# 2. Proje dizinine git
cd "C:\kiosk-management-system\installer"

# 3. Paketi oluştur (execution policy bypass ile)
powershell.exe -ExecutionPolicy Bypass -File .\Build-Complete-Package.ps1

# 4. Bekle ve çıktıyı kontrol et
# Çıktı: final-package\KioskManagementSystem-Complete-YYYYMMDD-HHMMSS.zip
```

### Senaryo 2: Hedef Sisteme Kurulum

```powershell
# 1. ZIP'i hedef sisteme kopyala ve aç
Expand-Archive -Path "KioskManagementSystem-Complete-*.zip" -DestinationPath "C:\Kiosk"

# 2. MSI'ı çalıştır (çift tıkla veya)
Start-Process "C:\Kiosk\KioskManagementSystem-1.0.0.msi"

# 3. Kurulum sihirbazını takip et
# 4. Kurulum sonrası README.txt'yi oku
```

## MSI Kurulum Adımları

MSI çalıştırıldığında grafik arayüzlü sihirbaz açılır:

1. **Hoş Geldiniz** - Kuruluma başlayın
2. **Lisans Sözleşmesi** - Kabul edin
3. **Kurulum Dizini** - Seçin (varsayılan: C:\Program Files\Kiosk Management System)
4. **Hazır** - Kurulumu başlatın
5. **Yükleniyor** - Bekleyin (~10-15 dakika)
6. **Tamamlandı** - Bitir

### Kurulum Sonrası

Kurulum tamamlandığında:

```
C:\Program Files\Kiosk Management System\
├── docker-images\              ← Docker imajları
├── installers\                 ← Docker Desktop, .NET Runtime
├── frontend\                   ← Web uygulaması
├── kiosk-agent\               ← Windows agent
├── config\                    ← Yapılandırmalar
├── scripts\                   ← Kurulum scriptleri
├── docs\                      ← Dokümantasyon
├── docker-compose.yml
├── .env
└── README.txt                 ← ⭐ İLK BU DOSYAYI OKUYUN
```

Start Menu'de kısayollar:
- **Kiosk Yönetim Sistemi - Başlat** → Sistemi başlatır
- **Dokümantasyon** → Kılavuzları açar

## Sonraki Adımlar (Kurulum Sonrası)

```powershell
# 1. README.txt'yi okuyun
notepad "C:\Program Files\Kiosk Management System\README.txt"

# 2. .env dosyasını düzenleyin (şifreler!)
notepad "C:\Program Files\Kiosk Management System\.env"

# 3. Docker Desktop'ı yükleyin (installers\ klasöründe)
& "C:\Program Files\Kiosk Management System\installers\DockerDesktopInstaller.exe"

# 4. .NET Runtime'ı yükleyin
& "C:\Program Files\Kiosk Management System\installers\dotnet-runtime-8.0-win-x64.exe"

# 5. Sistemi yeniden başlatın
Restart-Computer

# 6. Sistemi başlatın (Start Menu'den veya)
& "C:\Program Files\Kiosk Management System\scripts\deploy.bat"

# 7. Tarayıcıda açın
Start-Process "http://localhost"

# 8. Supabase Studio'da admin oluşturun
Start-Process "http://localhost:3000"
```

## Önemli Notlar

### ⚠️ Güvenlik
- `.env` dosyasındaki şifreleri **mutlaka** değiştirin
- Varsayılan şifreler üretim ortamı için **güvenli değildir**
- HTTPS/SSL yapılandırması ekleyin

### 💡 İpuçları
- İlk kurulum 15-20 dakika sürebilir
- Docker imajları yüklendikten sonra sistem offline çalışır
- Sistem güncellemeleri için yeni MSI oluşturun
- Yedekleme yapmayı unutmayın

### 🔧 Sorun Giderme

**MSI hata veriyor**
```powershell
# Log dosyasını kontrol edin
Get-Content "$env:TEMP\MSI*.log"
```

**Docker başlamıyor**
```powershell
# Docker Desktop'ın çalıştığını kontrol edin
Get-Service com.docker.service
```

**Port çakışması**
```powershell
# Kullanılan portları kontrol edin
netstat -ano | findstr "80 3000 8000 5432"
```

## Hızlı Referans

| Komut | Açıklama |
|-------|----------|
| `.\Build-Complete-Package.ps1` | Komple paketi oluştur |
| `.\Build-Complete-Package.ps1 -SkipDownload` | Sadece MSI'ı yeniden oluştur |
| `.\Download-Dependencies.ps1` | Sadece bağımlılıkları indir |
| `.\Build-MSI.ps1 -SourcePath <path>` | Sadece MSI oluştur |

## Linkler

- **Detaylı Dokümantasyon**: `installer/README.md`
- **Docker Kurulum**: `DOCKER_KURULUM.md`
- **Offline Deployment**: `OFFLINE_DEPLOYMENT.md`
- **Paket İçeriği**: `PAKET_ICERIGI.md`
- **Kullanım Kılavuzu**: `KULLANIM_KILAVUZU.md`

## Destek

Sorunlar için:
1. `installer/README.md` → "Sorun Giderme" bölümü
2. Script çıktılarını inceleyin
3. Windows Event Viewer'ı kontrol edin
4. Sistem yöneticinize başvurun

---

**Versiyon**: 1.0.0
**Oluşturma Tarihi**: 2026-01-08
**Platform**: Windows 10/11, Windows Server 2019+
