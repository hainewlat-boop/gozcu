# Güvenlik Dokümanı

## Genel Bakış

Bu doküman, System Watcher Secure Integrity Platform'un güvenlik mimarisini ve uygulanan güvenlik önlemlerini detaylandırmaktadır.

## 1. Veri Depolama Güvenliği

### 1.1 Tarayıcı Tarafı Veri Saklama
- **localStorage/sessionStorage Kullanımı:** Sistem, hassas verileri tarayıcıda saklamaz
- **Tema Tercihi:** Kullanıcı tema tercihi veritabanında (`profiles` tablosunda) saklanır
- **Session Yönetimi:** Tüm oturum bilgileri Supabase Auth tarafından güvenli şekilde yönetilir
- **Token Depolama:** Supabase client otomatik olarak httpOnly cookie'ler kullanır

### 1.2 Veritabanı Güvenliği
- **Row Level Security (RLS):** Tüm tablolarda aktif
- **Güvenli RLS Politikaları:**
  - Kullanıcılar sadece kendi verilerine erişebilir
  - Admin yetkileri RLS ile kontrol edilir
  - Public data mevcut değildir
- **Duplicate Kontroller:** MAC adresi, seri no ve demirbaş no tekrarı engellenir
- **Şifre Saklama:** Supabase Auth ile hash'lenerek saklanır

## 2. Input Validation ve Sanitization

### 2.1 Client-Side Validation
- **XSS Koruması:** Tüm kullanıcı girdileri sanitize edilir
- **Input Kontrolleri:**
  - Email format kontrolü
  - IP adresi format kontrolü
  - MAC adresi format kontrolü
  - UUID format kontrolü
- **Özel Karakterler:** HTML karakterleri (<, >) otomatik temizlenir

### 2.2 Server-Side Validation
- **Edge Functions:** Tüm input'lar server tarafında validasyondan geçer
- **Type Checking:** Veri tipleri kontrol edilir
- **Length Limits:** Minimum/maksimum uzunluk kuralları uygulanır
- **Format Validation:** Regex ile format kontrolleri yapılır

## 3. Rate Limiting

### 3.1 API Rate Limits
- **create-user:** 10 istek / saat / IP
- **scan-network:** 5 istek / saat / IP
- **deploy-package:** 3 istek / saat / IP
- **deploy-package max cihaz:** 20 cihaz / istek

### 3.2 Rate Limit Mekanizması
- **Veritabanı Tabanlı:** `rate_limits` tablosunda saklanır
- **Identifier:** IP adresi veya token kullanılır
- **Headers:** `X-RateLimit-Remaining` ve `X-RateLimit-Reset` header'ları döner

## 4. Authentication ve Authorization

### 4.1 Authentication
- **Method:** Email/password (Supabase Auth)
- **Email Format:** `username@kurum.local` internal sistemi
- **Password Requirements:**
  - Minimum 8 karakter
  - Karakter çeşitliliği önerilir
- **Session Management:** Supabase Auth otomatik yönetir

### 4.2 Authorization
- **Role-Based Access Control (RBAC):**
  - Roller: Admin, Operator, Viewer
  - Yetkiler: Resource ve action bazlı
- **Permission Kontrolü:**
  - Her işlem için permission check yapılır
  - RLS politikaları ile katmanlandırılır

## 5. Logging ve Monitoring

### 5.1 Secure Logging
- **Hassas Veri Maskeleme:**
  - Password, token, secret alanları `[REDACTED]`
  - Kullanıcı email'leri production'da loglanmaz
- **Development vs Production:**
  - Development: Detaylı loglar
  - Production: Minimal log, hassas veri yok

### 5.2 Audit Trail
- **audit_logs Tablosu:**
  - Tüm kritik işlemler kaydedilir
  - User, action, timestamp, metadata
  - Değiştirilemez kayıtlar (append-only)

## 6. Network Security

### 6.1 HTTPS
- **Tüm İletişim:** HTTPS üzerinden
- **Certificate Validation:** Otomatik SSL/TLS
- **HSTS:** Strict-Transport-Security header'ı

### 6.2 CORS
- **Edge Functions:** Sadece belirlenen origin'lere izin
- **Headers:**
  - Access-Control-Allow-Origin
  - Access-Control-Allow-Methods
  - Access-Control-Allow-Headers

## 7. Content Security Policy (CSP)

### 7.1 CSP Directives
```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval'
style-src 'self' 'unsafe-inline'
img-src 'self' data: https:
font-src 'self' data:
connect-src 'self' https://*.supabase.co wss://*.supabase.co
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
```

### 7.2 Additional Security Headers
- **X-Content-Type-Options:** nosniff
- **X-Frame-Options:** DENY
- **X-XSS-Protection:** 1; mode=block
- **Referrer-Policy:** strict-origin-when-cross-origin
- **Permissions-Policy:** geolocation=(), microphone=(), camera=()

## 8. Error Handling

### 8.1 Error Messages
- **Generic Messages:** Production'da detaylı hata mesajı yok
- **User-Friendly:** Kullanıcı için anlaşılır mesajlar
- **No Stack Traces:** Production'da stack trace gösterilmez

### 8.2 Error Logging
- **Centralized:** Tüm hatalar loglenir
- **Structured:** JSON formatında
- **Alerting:** Kritik hatalar için alarm

## 9. Dependency Security

### 9.1 Package Management
- **Regular Updates:** Düzenli güvenlik güncellemeleri
- **Vulnerability Scanning:** npm audit ile kontrol
- **Minimal Dependencies:** Sadece gerekli paketler

### 9.2 Supabase SDK
- **Latest Version:** @supabase/supabase-js@2.57.4
- **Security Patches:** Düzenli güncelleme

## 10. Best Practices

### 10.1 Kod Yazarken
- Hiçbir zaman hassas veriyi hardcode etmeyin
- Environment variable'ları kullanın
- Input'ları her zaman validate edin
- Output'ları her zaman encode edin

### 10.2 Deployment
- Production environment'ta debug mode kapalı
- Error details kullanıcıya gösterilmez
- Logging minimum seviyede

### 10.3 Monitoring
- Anormal trafik patterns izlenir
- Failed login attempts takip edilir
- Rate limit violations loglanır

## 11. Incident Response

### 11.1 Güvenlik İhlali Prosedürü
1. Sistemi izole et
2. Etkilenen kullanıcıları belirle
3. Zafiyeti tespit et ve kapat
4. Kullanıcıları bilgilendir
5. Audit log'ları incele

### 11.2 Data Breach Response
1. Acil müdahale ekibini devreye al
2. Etki analizi yap
3. İlgili otoriteleri bilgilendir
4. Kullanıcıları derhal uyar
5. Sistemi güvenli hale getir

## 12. Compliance

### 12.1 KVKK Uyumu
- Açık rıza mekanizması
- Veri işleme kayıtları
- Veri sahibi hakları
- Veri güvenliği tedbirleri

### 12.2 Data Retention
- Audit logs: 1 yıl
- User data: Hesap silinene kadar
- Session data: Supabase default (7 gün)

## 13. Security Contact

Güvenlik açığı bildirimi için:
- **Email:** security@example.com
- **Response Time:** 24 saat
- **Responsible Disclosure:** Desteklenir

---

**Son Güncelleme:** 2026-01-06
**Versiyon:** 1.0
**Sorumlu:** Güvenlik Ekibi
