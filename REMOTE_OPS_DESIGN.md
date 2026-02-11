# Remote Operations Platform (Uzaktan İzleme ve Yönetim Sistemi) - Mimari Tasarım Dokümanı

## 1. GENEL AMAÇ

Bu doküman, kurumsal kapalı devre (VLAN) ortamında çalışacak, internet bağlantısından bağımsız, yüksek güvenlikli ve ölçeklenebilir bir "Remote Operations Platform" (ROP) için mimari tasarımı içerir.

**Temel Hedefler:**
- **Merkezi İzleme:** Windows, Linux ve IoT cihazlarının tek bir merkezden izlenmesi.
- **Canlı Görüntü:** Düşük gecikmeli ekran görüntüsü ve kamera yayını.
- **Uzaktan Kontrol:** Klavye ve mouse ile tam kontrol (KVM over IP benzeri).
- **Güvenlik:** Zero Trust prensipleri, mTLS, tam audit log.
- **Yüksek Erişilebilirlik:** Active-Active mimari ile 5000+ cihaz desteği.

---

## 2. SİSTEM BİLEŞENLERİ

### 2.1. Agent (Uç Birim Yazılımı)
- **Teknoloji:** **Golang** (veya Rust).
- **Neden:**
  - Tek bir binary olarak derlenebilir (DLL bağımlılığı yok).
  - Düşük kaynak tüketimi (5-10MB RAM idle).
  - Cross-platform desteği (Windows Service, Linux Systemd, macOS Launchd).
  - Goroutine'ler ile yüksek eşzamanlılık (Concurrent screen capture + WebSocket + Command exec).
- **Güvenlik Riskleri:** Binary manipülasyonu. **Çözüm:** Code signing ve Self-integrity check.
- **Performans:** Ekran yakalama için platforma özgü API'ler (Windows Desktop Duplication API, Linux X11/Wayland).

### 2.2. Backend API (Merkezi Sunucu)
- **Teknoloji:** **Golang** (Fiber veya Gin framework).
- **Neden:**
  - Yüksek performanslı WebSocket yönetimi (10k+ bağlantı).
  - Düşük bellek ayak izi.
  - Native concurrency model.
- **Mimari:** Microservices (veya Modüler Monolith).
  - **Core API:** REST, Auth, Inventory.
  - **Stream Gateway:** WebSocket/WebRTC signaling.
  - **Job Runner:** Zamanlanmış görevler ve alarm motoru.

### 2.3. Web UI (Yönetim Paneli)
- **Teknoloji:** **React** (TypeScript) + Vite.
- **Neden:** Mevcut ekip yetkinliği, geniş ekosistem, performans.
- **Özellikler:** Sanal DOM ile hızlı rendering (Dashboard grid view).
- **Optimizasyon:** WebAssembly (Wasm) ile video decoding (gerekirse), Canvas tabanlı rendering.

### 2.4. Veritabanı Tasarımı
- **İlişkisel:** **PostgreSQL** (TimescaleDB eklentisi ile metrikler için).
  - Cihaz envanteri, kullanıcılar, audit loglar.
- **Önbellek/Kuyruk:** **Redis** (Session, Hot data) + **NATS JetStream** (Message Queue).
  - NATS, RabbitMQ'ya göre daha hafif ve Go ile daha uyumlu.

### 2.5. Yetkilendirme ve Rol Modeli
- **RBAC (Role Based Access Control):** Granüler izinler (örn: `device.view`, `device.control`, `system.admin`).
- **Policy Engine:** OPA (Open Policy Agent) entegrasyonu düşünülebilir.

### 2.6. Gerçek Zamanlı İletişim
- **Protokol:** **WebSocket** (Kontrol ve Telemetri) + **WebRTC** (Görüntü/Ses).
- **Neden:** WebSocket düşük gecikmeli komut iletimi sağlar. WebRTC, UDP tabanlı olup video akışı için idealdir.

### 2.7. Alarm ve Sağlık İzleme
- **Motor:** Backend içinde gömülü Rule Engine.
- **Veri Kaynağı:** Agent heartbeat ve telemetri verileri.

---

## 3. AGENT ÖZELLİKLERİ

### 3.1. Yetenekler
- **Ekran Yakalama:**
  - **Thumbnail:** 1-2 FPS (JPEG/WebP), bant genişliği dostu.
  - **Odak Modu:** 15-30 FPS (H.264/VP8), WebRTC üzerinden.
  - **Değişim Algılama:** Sadece ekran değiştiğinde veri gönderimi.
- **Girdi Simülasyonu:** OS seviyesinde klavye/mouse event enjeksiyonu.
- **Envanter:** WMI (Windows) / sysfs (Linux) üzerinden donanım/yazılım bilgisi.
- **Komut Çalıştırma:** Whitelist tabanlı komut seti veya yetkili kullanıcı onayı ile shell komutları.
- **Dosya Transferi:** Çift yönlü güvenli dosya aktarımı (Chunked upload/download).

### 3.2. Agent Mimarisi
- **Bağlantı:** WebSocket (WSS) üzerinden sürekli açık bağlantı.
- **Offline Mod:** Bağlantı koptuğunda logları yerel veritabanında (SQLite/BoltDB) saklar, bağlanınca gönderir.
- **Kimlik Doğrulama:**
  - Kurulumda sunucudan alınan **Device Certificate (mTLS)**.
  - **Fingerprint:** MAC + CPU ID + Disk Serial hash'i.
- **Self-Update:** Sunucudan imzalı binary indirip kendini güncelleme yeteneği (A/B partition mantığı veya temp dosya değişimi).

---

## 4. BACKEND TASARIMI

### 4.1. Servis Mimarisi (Microservices)
1.  **Gateway Service:** API Entry point, SSL termination, Load Balancer.
2.  **Auth Service:** JWT üretimi, LDAP/AD entegrasyonu.
3.  **Device Service:** Cihaz kaydı, heartbeat, envanter yönetimi.
4.  **Stream Service (Signaling):** WebRTC SDP değişimi, TURN/STUN sunucusu (kapalı devre için internal).
5.  **Command Service:** Komut kuyruğu ve sonuç işleme.
6.  **Audit Service:** Tüm işlemleri immutable log olarak saklama.

### 4.2. İletişim ve Kuyruk
- **NATS JetStream:** Servisler arası asenkron iletişim ve komut kuyruğu.
  - Konular: `device.connected`, `device.telemetry`, `command.request`.

### 4.3. Veri Modeli (Özet)
- `devices`: id, hostname, ip, mac, os_info, status, last_seen.
- `telemetry`: time, device_id, cpu, ram, disk.
- `audit_logs`: id, user_id, action, target_id, payload, timestamp, hash.
- `permissions`: role_id, resource, action.

### 4.4. Deploy Mekanizması
- **Agent Deploy:**
  - Windows: MSI / GPO (Group Policy).
  - Linux: Ansible / SSH script.
  - Network Scan: IP aralığı taranıp SSH/WMI ile otomatik kurulum (credentials varsa).

---

## 5. WEB UI

### 5.1. Modüller
- **Dashboard:** Özet metrikler, harita görünümü (opsiyonel), kritik alarmlar.
- **Monitoring Wall:** 10x10 grid (100 cihaz). Canvas ile çizim performansı artırılır.
- **Device Detail:** Canlı önizleme, terminal (xterm.js), dosya yöneticisi, servis yöneticisi.
- **Settings:** Kullanıcılar, Roller, Alarm Kuralları.

### 5.2. Performans
- **Sanallaştırma:** Sadece ekranda görünen bileşenlerin render edilmesi (React Virtual Window).
- **WebSocket Multiplexing:** Tek soket üzerinden tüm güncellemelerin alınması.
- **Throttling:** Thumbnail güncellemelerinin frekansını kontrol etme.

---

## 6. GÜVENLİK (ZERO TRUST)

### 6.1. İlkeler
- **Asla Güvenme, Her Zaman Doğrula:** İç ağda olsa bile şifreli iletişim.
- **En Az Ayrıcalık (Least Privilege):** Agent sadece kendi işini yapabilir, kullanıcı sadece yetkisi olan cihazı görebilir.

### 6.2. Uygulama
- **mTLS:** Agent ve Sunucu karşılıklı sertifika doğrulaması yapar. Rogue cihaz sisteme bağlanamaz.
- **JWT + Refresh Token:** Kısa ömürlü erişim tokenları.
- **Audit Trail:** Yapılan her işlem (mouse click dahil opsiyonel) loglanır. Loglar değiştirilemez (Hash chain veya WORM storage).
- **User Acknowledgement:** Kritik işlemlerde (remote control) cihaz başında kullanıcı onayı isteme opsiyonu.
- **Command Whitelisting:** Agent üzerinde çalıştırılabilecek komutların önceden tanımlanması.

---

## 7. ÖLÇEKLENEBİLİRLİK

### 7.1. 10 - 100 Cihaz
- Tek sunucu (4 vCPU, 8GB RAM).
- PostgreSQL + App aynı sunucuda olabilir.

### 7.2. 1000 - 5000 Cihaz
- **Load Balancer:** Nginx veya HAProxy.
- **App Servers:** 2-3 adet Stateless Go Backend.
- **Database:** Primary/Replica PostgreSQL.
- **Stream Servers:** WebRTC yükü için ayrılmış sunucular (CPU intensive).
- **Bandwidth:**
  - Thumbnail (10KB * 100 cihaz * 0.2 FPS) = ~200 KB/s (Monitoring Wall).
  - Remote Control (2 Mbps per session).

### 7.3. Active-Active
- Çoklu veri merkezi desteği.
- Veritabanı replikasyonu (Sync/Async).
- Global Load Balancer.

---

## 8. JSON SPESİFİKASYON (Referans)

(Ayrı bir `REMOTE_OPS_SPECS.json` dosyasında detaylandırılmıştır.)

---

## 9. GELİŞTİRME YOL HARİTASI

### Faz 1: MVP (Temel İzleme) - 2 Ay
- Agent (Windows/Linux) temel telemetri ve heartbeat.
- Backend cihaz kaydı ve listeleme.
- Basit Web UI dashboard.
- **Risk:** Agent'ın farklı OS versiyonlarında stabil çalışması.

### Faz 2: Remote Control & CLI - 2 Ay
- WebSocket üzerinden komut çalıştırma.
- WebRTC ekran paylaşımı ve input kontrolü.
- **Risk:** WebRTC NAT/Firewall sorunları (Kapalı devrede STUN/TURN kurulumu gerekir).

### Faz 3: Monitoring Walls & Advanced Security - 2 Ay
- 100'lü grid görünümü optimizasyonu.
- mTLS tam entegrasyonu.
- Audit log sistemi ve raporlama.

### Faz 4: HA & Enterprise Features - 3 Ay
- Active-Active kurulum scriptleri.
- SIEM entegrasyonu (Syslog/Splunk).
- AI destekli anomali tespiti.

---

## 10. EKSTRALAR

### Karşılaştırma: NetSupport vs Custom ROP

| Özellik | NetSupport / TeamViewer | Custom ROP (Bu Tasarım) |
|---------|-------------------------|-------------------------|
| **Maliyet** | Lisans başına yüksek maliyet | İlk geliştirme maliyeti, sonra ücretsiz |
| **Özelleştirme** | Sınırlı | Tamamen kuruma özel |
| **Veri Gizliliği** | Kapalı kutu | Tam şeffaflık, kod denetimi mümkün |
| **Entegrasyon** | API varsa mümkün | İstenilen her sisteme entegre edilebilir |
| **Bağımlılık** | Vendor lock-in | Açık kaynak / Kurum içi sahiplik |

### Teknik Borç ve Risk Analizi
- **Bakım:** Kurum içi geliştirilen sistemin sürekli bakımı ve güncellenmesi gerekir. Yetkin personel ayrılması risktir.
- **Güvenlik:** Hazır ürünlerin güvenlik testleri daha yoğundur. Kurum içi yazılımda güvenlik testleri (Pentest) düzenli yapılmalıdır.

### Sonuç
5000+ cihazlık ve yüksek güvenlik gerektiren kapalı devre bir ortam için, lisans maliyetleri ve veri güvenliği göz önüne alındığında **Custom ROP** daha avantajlıdır. Modern teknolojiler (Go, WebRTC) ile performans sorunu yaşanmadan bu ölçek yönetilebilir.
