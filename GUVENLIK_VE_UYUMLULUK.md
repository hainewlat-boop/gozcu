# Güvenlik ve Uyumluluk Dokümantasyonu

## Sistem Gözcüsü - ISO 27001 ve KVKK Uyumluluk Raporu

### 1. GENEL BAKIŞ

Sistem Gözcüsü, kamu kurumları için geliştirilmiş ISO 27001 ve KVKK uyumlu kurumsal izleme ve yönetim platformudur. Tüm güvenlik kontrolleri ve veri koruma ilkeleri uygulamaya entegre edilmiştir.

---

## 2. ISO 27001 KONTROL EŞLEMESI

### A.9 - Erişim Kontrolü

#### A.9.1 Erişim Kontrolüne İlişkin İş Gereksinimleri
- **Durum**: ✅ Uyumlu
- **Uygulama**:
  - RBAC (Rol Bazlı Erişim Kontrolü) tam entegre
  - İzin bazlı (permission-based) granüler yetkilendirme
  - Least privilege (en az ayrıcalık) prensibi uygulanmış
  - Her kaynak için ayrı izin tanımları

#### A.9.2 Kullanıcı Erişim Yönetimi
- **Durum**: ✅ Uyumlu
- **Uygulama**:
  - Kullanıcı kaydı ve profil yönetimi
  - Rol atama ve iptal mekanizması
  - Hesap durumu yönetimi (active/suspended/locked)
  - MFA desteği (altyapı hazır)

#### A.9.3 Kullanıcı Sorumlulukları
- **Durum**: ✅ Uyumlu
- **Uygulama**:
  - Güçlü parola politikası (Supabase Auth)
  - Parola hashleme: Argon2id/bcrypt
  - Oturum zaman aşımı yönetimi
  - Kullanıcı eylem sorumluluğu (audit log)

#### A.9.4 Sistem ve Uygulama Erişim Kontrolü
- **Durum**: ✅ Uyumlu
- **Uygulama**:
  - Her endpoint için izin kontrolü
  - RLS (Row Level Security) tüm tablolarda aktif
  - Güvenli oturum yönetimi (HttpOnly, Secure, SameSite)
  - Brute force koruması altyapısı

### A.12 - Operasyon Güvenliği

#### A.12.4 Loglama ve İzleme
- **Durum**: ✅ Uyumlu
- **Uygulama**:
  - Kapsamlı audit log sistemi
  - Tüm kritik eylemler loglanıyor:
    - Login/Logout
    - Yetki reddi
    - Cihaz komutları
    - Alarm çözme
    - Tema değişimi
    - Uzak bağlantı başlatma
  - Hash chain ile değiştirilemezlik
  - IP adresi ve user agent kaydı
  - Zaman damgası (timestamptz)

### A.18 - Uyumluluk

#### A.18.1 Yasal ve Sözleşmesel Gereksinimlerle Uyumluluk
- **Durum**: ✅ Uyumlu
- **Uygulama**:
  - KVKK veri işleme envanteri
  - Veri minimizasyonu prensibi
  - Veri kategorilendirme (kişisel/teknik)
  - Saklama ve silme politikası desteği

---

## 3. KVKK UYUMLULUĞU

### 3.1 Veri Minimizasyonu (Madde 4)
- **Uygulama**:
  - Sadece operasyonel zorunlu veriler saklanıyor
  - Kişisel veri işleme minimum seviyede
  - IP/MAC adresleri "teknik veri" olarak sınıflandırılmış
  - Gereksiz veri alanları yok

### 3.2 Veri Güvenliği (Madde 12)

#### 3.2.1 Aktarım Güvenliği
- **Durum**: ✅ Uyumlu
- **Uygulama**:
  - TLS/HTTPS zorunlu
  - WebSocket Secure (WSS)
  - End-to-end şifreleme altyapısı

#### 3.2.2 Depolama Güvenliği
- **Durum**: ✅ Uyumlu
- **Uygulama**:
  - Kritik alanlar şifreli (asset_tag, serial_number, service descriptions)
  - Parola hashleme (asla düz metin saklanmaz)
  - Database encryption at rest (Supabase)

### 3.3 Veri Sorumlusu Yükümlülükleri (Madde 11-12)
- **Durum**: ✅ Uyumlu
- **Uygulama**:
  - Veri işleme faaliyetleri kayıt altında
  - İlgili kişi hakları (silme, düzeltme) altyapısı
  - Veri ihlali bildirimi için audit log
  - Veri işleme envanteri oluşturulabilir

### 3.4 Kişisel Verilerin Silinmesi (Madde 7)
- **Durum**: ⚠️ Kısmi (Politika bazlı)
- **Uygulama**:
  - Otomatik silme için saklama süresi config
  - Soft delete ve hard delete desteği
  - Anonim hale getirme mekanizması
  - Manuel veri silme prosedürleri

---

## 4. UYGULAMA GÜVENLİĞİ

### 4.1 Kimlik Doğrulama
- **Mekanizma**: Supabase Auth (PostgreSQL + JWT)
- **Özellikler**:
  - Email/password authentication
  - MFA (TOTP) desteği altyapı hazır
  - Brute force koruması altyapı hazır
  - Account lockout mekanizması
  - Güvenli şifre sıfırlama

### 4.2 Oturum Yönetimi
- **Güvenlik**:
  - HttpOnly cookie (XSS koruması)
  - Secure flag (HTTPS zorunlu)
  - SameSite=Strict (CSRF koruması)
  - Token yenileme mekanizması
  - Oturum sonlandırma
  - Multi-device session tracking

### 4.3 Yetkilendirme
- **Model**: RBAC + Permission-based hybrid
- **Katmanlar**:
  1. Frontend route guard
  2. Component-level permission check
  3. API endpoint authorization
  4. Database RLS policies
- **Prensipler**:
  - Least privilege
  - Need-to-know
  - Separation of duties

### 4.4 Veri Bütünlüğü

#### Hash Chain Sistemi
```
Audit Log n:
  prev_hash: Hash(n-1)
  data: canonical_json(event)
  current_hash: SHA-256(prev_hash + data)
```

**Özellikler**:
- Değiştirilemez denetim kaydı
- Geriye dönük bütünlük doğrulama
- Tamperproof log sistemi
- Bozulma tespiti (Dashboard'da gösteriliyor)

#### Manifest İmzalama
- **Amaç**: UI ve uygulama bileşeni bütünlüğü
- **Yöntem**: Ed25519/RSA dijital imza
- **Kapsam**:
  - Menü tanımları
  - Route manifest'i
  - İzin manifest'i
  - Feature flags
- **Doğrulama**: Client-side public key ile

### 4.5 Input Validation & Output Encoding
- **Durum**: ✅ Uygulanmış
- **Yöntemler**:
  - SQL injection koruması (Supabase prepared statements)
  - XSS koruması (React automatic escaping)
  - Type validation (TypeScript)
  - Boundary checks
  - Regex pattern validation

### 4.6 Güvenlik Başlıkları
- **Önerilen** (Production deployment):
  - Content-Security-Policy
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Strict-Transport-Security
  - Referrer-Policy: no-referrer

---

## 5. DENETIM VE İZLENEBİLİRLİK

### 5.1 Audit Log Kapsamı

**Login/Logout**:
- Kullanıcı girişi (başarılı/başarısız)
- Oturum sonlandırma
- IP adresi ve user agent
- Başarısız giriş denemeleri

**Yetki Kontrolleri**:
- Erişim reddi (izin eksikliği)
- Rol değişiklikleri
- İzin atamaları

**Cihaz İşlemleri**:
- Restart komutu
- Shutdown komutu
- Ctrl+Alt+Delete gönderimi
- Uzak bağlantı başlatma
- Cihaz detay görüntüleme

**Alarm İşlemleri**:
- Alarm onaylama
- Alarm çözme
- Çözüm notu ekleme

**Sistem İşlemleri**:
- Tema değişimi
- Tam ekran geçişi
- Konfigürasyon değişiklikleri

### 5.2 Log Saklama
- **Varsayılan**: Sınırsız (compliance gereksinimine göre)
- **Önerilen**: 1-7 yıl (kamu kurumu için)
- **Yöntem**: WORM (Write Once Read Many)
- **Yedekleme**: Düzenli backup önerilir

### 5.3 Log Analizi
- **Dashboard Widget**: Son N kayıt
- **Filtreleme**: Kullanıcı, eylem, zaman, sonuç
- **Export**: Raporlama için (gelecek özellik)
- **SIEM Entegrasyonu**: Webhook ile mümkün

---

## 6. VERİ KORUMA ETKİ DEĞERLENDİRMESİ (DPED)

### 6.1 İşlenen Veri Kategorileri

#### Teknik Veriler (KVKK Kapsam Dışı)
- Cihaz IP adresleri
- MAC adresleri
- Telemetri verileri (CPU/RAM/DISK)
- Sistem logları
- Cihaz durumları

#### Operasyonel Veriler (Minimum Kişisel Veri)
- Kullanıcı adı (username)
- İş e-postası (kurumsal)
- Rol bilgisi
- İşlem geçmişi (audit log)

#### Şifrelenen Veriler
- Demirbaş numaraları
- Seri numaraları
- Servis açıklamaları
- MFA secret (eğer aktifse)

### 6.2 Veri İşleme Amaçları
1. Cihaz izleme ve yönetimi
2. Alarm takibi ve olay müdahalesi
3. Güvenlik denetimi ve uyumluluk
4. Sistem performans analizi
5. Yetki ve erişim kontrolü

### 6.3 Veri Paylaşımı
- **Üçüncü Taraf**: Yok
- **Dışarı Aktarım**: Yok
- **Cloud Provider**: Supabase (PostgreSQL - EU/US region seçilebilir)

### 6.4 Veri Sahibi Hakları
- **Erişim**: Profile üzerinden kendi verisine erişim
- **Düzeltme**: Profile güncelleme
- **Silme**: Soft delete ve anonymization
- **Veri Taşınabilirliği**: Export özelliği (gelecek)
- **İtiraz**: Manuel prosedür

---

## 7. OLAY MÜDAHALE PLANI

### 7.1 Güvenlik İhlali Senaryoları

#### Senaryo 1: Yetkisiz Erişim Denemesi
- **Tespit**: Audit log analizi, başarısız login
- **Müdahale**:
  1. Hesap otomatik kilitleme
  2. IP engelleme (altyapı hazır)
  3. Güvenlik ekibi bildirimi
  4. Forensic analiz

#### Senaryo 2: Audit Log Bütünlük Bozulması
- **Tespit**: Dashboard bütünlük kontrolü
- **Müdahale**:
  1. Anında uyarı
  2. Log chain doğrulama
  3. Bozulan kayıt tespiti
  4. Yedekten geri yükleme
  5. Olay raporu

#### Senaryo 3: Ayrıcalık Yükseltme Denemesi
- **Tespit**: Yetki reddi logları
- **Müdahale**:
  1. Kullanıcı hesabı askıya alma
  2. Oturum sonlandırma
  3. Detaylı inceleme
  4. Disiplin işlemi

### 7.2 Veri İhlali Bildirimi
- **Yasal Süre**: 72 saat (KVKK)
- **Bildirim Kanalı**: Kişisel Verileri Koruma Kurumu
- **İçerik**:
  - İhlal türü ve kapsamı
  - Etkilenen veri kategorileri
  - Etkilenen kişi sayısı
  - Alınan ve alınacak tedbirler
  - Veri sorumlusu iletişim bilgileri

---

## 8. GÜVENLİK TEST VE DOĞRULAMA

### 8.1 Yapılan Testler
- ✅ Authentication flow test
- ✅ Authorization (RBAC) test
- ✅ RLS policy test
- ✅ Hash chain integrity test
- ✅ Session management test
- ✅ Input validation test

### 8.2 Yapılacak Testler (Önerilen)
- [ ] Penetration testing
- [ ] OWASP Top 10 security scan
- [ ] Dependency vulnerability scan
- [ ] Load testing
- [ ] Disaster recovery simulation

### 8.3 Güvenlik Checklist

#### Kimlik Doğrulama
- [x] Güçlü parola politikası
- [x] Parola hashleme (Argon2/bcrypt)
- [ ] MFA frontend entegrasyonu
- [x] Brute force koruması altyapısı
- [x] Account lockout
- [x] Session timeout

#### Yetkilendirme
- [x] RBAC + Permission model
- [x] Least privilege
- [x] RLS policies
- [x] Frontend permission guard
- [x] API authorization

#### Veri Güvenliği
- [x] TLS/HTTPS
- [x] Şifreli veri depolama
- [x] Audit log hash chain
- [ ] Database backup encryption
- [x] Secure cookie flags

#### Uygulama Güvenliği
- [x] SQL injection koruması
- [x] XSS koruması
- [ ] CSRF token implementation
- [x] Input validation
- [ ] Security headers
- [x] Error handling (no stack traces)

#### İzlenebilirlik
- [x] Comprehensive audit logging
- [x] Tamper-proof logs
- [x] User action tracking
- [x] Failed access logging
- [x] IP and user agent logging

---

## 9. UYUMLULUK KONTROL TAKVİMİ

### Aylık
- [ ] Başarısız giriş denemeleri analizi
- [ ] Kullanıcı yetki gözden geçirme
- [ ] Kritik güvenlik logları incelemesi

### Üç Aylık
- [ ] Tüm kullanıcı rolleri review
- [ ] Kullanılmayan hesapların tespiti
- [ ] Veri saklama politikası kontrolü

### Altı Aylık
- [ ] Güvenlik politikası güncelleme
- [ ] Penetration test
- [ ] Felaket kurtarma simülasyonu

### Yıllık
- [ ] ISO 27001 iç denetim
- [ ] KVKK uyumluluk değerlendirmesi
- [ ] Dış güvenlik denetimi
- [ ] DPED güncelleme

---

## 10. SORUMLULUK MATRİSİ

| Rol | Sorumluluk |
|-----|-----------|
| **Sistem Yöneticisi** | Kullanıcı yönetimi, rol atama, güvenlik politikaları |
| **Güvenlik Görevlisi** | Log analizi, olay müdahalesi, güvenlik testleri |
| **Veri Sorumlusu** | KVKK uyumluluğu, DPED, veri işleme envanteri |
| **Operatör** | Günlük izleme, alarm yönetimi, cihaz kontrolü |
| **Denetçi (Auditor)** | Uyumluluk kontrolü, rapor hazırlama |

---

## 11. İLETİŞİM

**Güvenlik Olayları**:
- Acil: Güvenlik ekibi
- Sistem: Teknik destek

**KVKK Talepleri**:
- Veri Sorumlusu
- kvkk@kurum.gov.tr (örnek)

**Teknik Destek**:
- Sistem yöneticisi
- destek@kurum.gov.tr (örnek)

---

## 12. DOKÜMANTASYON KONTROL

| Versiyon | Tarih | Değişiklik | Hazırlayan |
|----------|-------|------------|------------|
| 1.0 | 2026-01-06 | İlk sürüm | Sistem Mimarı |

**Gözden Geçirme**: 6 ayda bir
**Onay**: Bilgi Güvenliği Yöneticisi

---

**NOT**: Bu dokümantasyon, sistemin güvenlik ve uyumluluk özelliklerini açıklar. Gerçek dağıtımda, kurumunuzun spesifik politika ve prosedürlerine göre güncellenmelidir.
