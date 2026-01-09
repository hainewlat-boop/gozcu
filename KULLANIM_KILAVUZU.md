# Sistem Gözcüsü - Kullanım Kılavuzu

## Kurumsal İzleme ve Uzaktan Yönetim Platformu

ISO 27001 ve KVKK uyumlu, tam özellikli kurumsal izleme sistemi.

## Özellikler

### Güvenlik ve Uyumluluk
- ISO 27001 kontrolleri
- KVKK veri koruma ilkeleri
- RBAC (Rol Bazlı Erişim Kontrolü) + İzin bazlı yetkilendirme
- Audit log hash zinciri ile değiştirilemez denetim kayıtları
- Manifest imza doğrulama ile uygulama bütünlüğü
- Güvenli oturum yönetimi
- MFA desteği (altyapı hazır)

### İzleme Özellikleri
- **Dashboard**: Sistem geneli durum görünümü, cihaz istatistikleri, bütünlük durumu
- **Kiosk İzleme**: 100+ kiosk cihazı grid düzeninde canlı izleme
- **IoT İzleme**: 100+ IoT cihazı grid düzeninde izleme
- **Alarmlar**: Filtreleme, çözme, detay görüntüleme
- **Denetim Logları**: Hash chain ile korumalı audit log sistemi

### UI/UX Özellikleri
- 4 farklı tema (Açık, Koyu, Mavi, Yeşil)
- Tam ekran modu
- Grid düzeni özelleştirme (satır, sütun, panel boyutu)
- Sağ tık menüsü ile hızlı erişim
- Cihaz detay modal'ları
- Gerçek zamanlı veri güncelleme

## İlk Kurulum

### 1. Test Kullanıcısı Oluşturma

Platform kullanabilmek için bir admin kullanıcısı oluşturmanız gerekiyor. Supabase Dashboard üzerinden:

1. [Supabase Dashboard](https://supabase.com/dashboard) → Projenizi seçin
2. **Authentication** → **Users** → **Add User** butonuna tıklayın
3. E-posta ve şifre girin (örnek: admin@kurum.gov.tr / Admin123!)
4. Kullanıcı ID'sini kopyalayın

### 2. Profile ve Rol Atama

Aşağıdaki SQL komutlarını **SQL Editor**'de çalıştırın:

\`\`\`sql
-- 1. Kullanıcı profili oluştur (USER_ID'yi değiştirin)
INSERT INTO profiles (id, username, full_name, status)
VALUES (
  'KULLANICI_ID_BURAYA',  -- Supabase Auth'dan aldığınız user ID
  'admin',
  'Sistem Yöneticisi',
  'active'
);

-- 2. Admin rolünü ata
INSERT INTO user_roles (user_id, role_id)
VALUES (
  'KULLANICI_ID_BURAYA',  -- Aynı user ID
  '11111111-1111-1111-1111-111111111111'  -- Admin role ID
);
\`\`\`

### 3. Uygulamayı Başlatın

\`\`\`bash
npm run dev
\`\`\`

Tarayıcınızda http://localhost:5173 adresine gidin ve oluşturduğunuz kullanıcı ile giriş yapın.

## Roller ve İzinler

### Admin Rolü
Tüm izinlere sahip sistem yöneticisi:
- Dashboard görüntüleme
- Tüm cihazları görüntüleme ve kontrol etme
- Kiosk ve IoT izleme
- Alarm yönetimi
- Denetim logları görüntüleme
- Sistem ayarları

### Operator Rolü
Operasyonel kullanıcı:
- Dashboard görüntüleme
- Cihazları görüntüleme ve kontrol etme
- Alarm yönetimi
- Kiosk/IoT izleme

### Viewer Rolü
Sadece okuma yetkisi:
- Dashboard görüntüleme
- Cihazları görüntüleme
- Alarmları görüntüleme

## Sayfalar ve Kullanım

### Dashboard
- **Cihaz İstatistikleri**: Kiosk ve IoT cihazların durumları (online/offline/alarm/degraded)
- **Bütünlük Durumu**: Audit log zinciri doğrulama sonucu
- **Son Alarmlar**: Kritik/uyarı/bilgi seviyesinde son alarmlar
- **Denetim Kayıtları**: Son sistem olayları

### Kiosk İzleme
- **Grid Düzeni**: 100+ kiosk ekranı tek sayfada
- **Özelleştirme**: Satır, sütun ve panel boyutu ayarları
- **Tam Ekran**: F11 veya tam ekran butonu ile
- **Sağ Tık Menüsü**:
  - Oturum Aç
  - Bağlan
  - Ctrl+Alt+Delete Gönder
  - Yeniden Başlat
  - Kapat
  - Cihaz Bilgileri
- **Çift Tık**: Uzak masaüstü bağlantısı başlat

### IoT İzleme
- Kiosk izleme ile aynı özellikler
- IoT cihazlara özel komutlar

### Alarmlar
- **Filtreler**:
  - Tür: Donanım, Yazılım, Ağ, Güvenlik, Özel
  - Önem: Kritik, Uyarı, Bilgi
  - Durum: Açık, Onaylandı, Çözüldü
- **Arama**: Alarm başlığı veya cihaz adına göre
- **Çözme**: Alarm çözümü ve not ekleme
- **Durum Panoları**: Kritik/Uyarı/Bilgi alarm sayıları

## Güvenlik Özellikleri

### Audit Log Hash Chain
Her denetim kaydı önceki kaydın hash'i ile bağlanır:
\`\`\`
Hash(n) = SHA-256(Hash(n-1) + Event_JSON)
\`\`\`

Dashboard'da bütünlük durumu gerçek zamanlı kontrol edilir.

### RLS (Row Level Security)
Tüm tablolarda RLS aktif. Kullanıcılar sadece yetkili oldukları verilere erişebilir.

### Oturum Yönetimi
- HttpOnly + Secure + SameSite cookie'ler
- Otomatik token yenileme
- Brute force koruması (altyapı hazır)

## Tema Sistemi

4 farklı tema:
1. **Açık (Light)**: Varsayılan, gözü yormayan açık tema
2. **Koyu (Dark)**: Düşük ışıkta kullanım için
3. **Mavi (Blue)**: Profesyonel mavi ton
4. **Yeşil (Green)**: Rahat yeşil ton

Tema değiştirmek için sağ üst köşedeki palet ikonuna tıklayın.

## Veritabanı Yapısı

### Ana Tablolar
- **profiles**: Kullanıcı profilleri
- **roles**: Roller (Admin, Operator, Viewer)
- **permissions**: İzinler (device.view, alarm.resolve, vb.)
- **devices**: Kiosk ve IoT cihazlar (200 örnek cihaz)
- **alarms**: Sistem alarmları
- **audit_logs**: Hash chain ile korumalı denetim kayıtları
- **telemetry**: Cihaz telemetri verileri
- **manifests**: İmzalı manifest'ler

## Performans İyileştirmeleri

### Grid Performansı
- Lazy loading
- Virtualization desteği (gelecek güncellemeler)
- Ayarlanabilir güncelleme aralıkları
- Düşük bant genişliği modu

### Gerçek Zamanlı Güncellemeler
- Dashboard: 30 saniye
- Cihaz listesi: 10 saniye
- Alarmlar: 15 saniye

## Geliştirme Notları

### Yapılacaklar (Future)
- [ ] MFA (TOTP) frontend entegrasyonu
- [ ] WebRTC ile gerçek ekran paylaşımı
- [ ] Cihaz komut gönderme (restart/shutdown) backend
- [ ] Export/reporting modülü
- [ ] Advanced filtreleme ve arama
- [ ] Bildirim sistemi
- [ ] Kullanıcı yönetimi sayfası
- [ ] Ayarlar sayfası

### Güvenlik Kontrol Listesi
- [x] RBAC + Permission sistemi
- [x] Audit log hash chain
- [x] RLS politikaları
- [x] Güvenli oturum yönetimi
- [x] CSRF koruması altyapısı
- [x] Input validation
- [x] SQL injection koruması (Supabase)
- [ ] Rate limiting (backend)
- [ ] Brute force koruması (backend)
- [ ] MFA zorunlu tutma

## Teknik Detaylar

**Frontend:**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Supabase Client
- Lucide Icons

**Backend:**
- Supabase (PostgreSQL + RLS)
- Real-time subscriptions
- Edge Functions (hazır)

**Güvenlik:**
- Argon2id/bcrypt parola hashleme (Supabase Auth)
- SHA-256 hash chain
- Ed25519/RSA manifest imzalama (altyapı hazır)

## Lisans

Kamu kurumu içi kullanım için geliştirilmiştir.

## Destek

Teknik destek için sistem yöneticinize başvurun.
