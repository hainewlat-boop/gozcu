-- =============================================
-- SİSTEM GÖZCÜSÜ - HIZLI BAŞLANGIÇ
-- =============================================
--
-- Bu script'i kullanmadan önce:
-- 1. Supabase Dashboard → Authentication → Users bölümünden
--    bir kullanıcı oluşturun (Add User)
-- 2. E-posta: admin@kurum.gov.tr
-- 3. Şifre: Admin123! (veya istediğiniz güçlü şifre)
-- 4. Oluşturulan kullanıcının ID'sini kopyalayın
-- 5. Aşağıdaki 'KULLANICI_ID_BURAYA' yazan yerlere yapıştırın
-- 6. SQL Editor'de bu script'i çalıştırın

-- ADIM 1: Kullanıcı ID'nizi buraya yapıştırın
-- Örnek: '12345678-1234-1234-1234-123456789abc'
DO $$
DECLARE
  v_user_id uuid := 'KULLANICI_ID_BURAYA'::uuid;  -- <-- BURAYA ID YAPIŞTIRIN
BEGIN
  -- Profil oluştur
  INSERT INTO profiles (id, username, full_name, status)
  VALUES (
    v_user_id,
    'admin',
    'Sistem Yöneticisi',
    'active'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Admin rolünü ata
  INSERT INTO user_roles (user_id, role_id)
  VALUES (
    v_user_id,
    '11111111-1111-1111-1111-111111111111'
  )
  ON CONFLICT (user_id, role_id) DO NOTHING;

  RAISE NOTICE 'Kullanıcı başarıyla oluşturuldu!';
  RAISE NOTICE 'E-posta: admin@kurum.gov.tr';
  RAISE NOTICE 'Rol: Admin (Tüm yetkilere sahip)';
END $$;

-- ADIM 2: Sisteme giriş yapın
-- http://localhost:5173
-- E-posta: admin@kurum.gov.tr
-- Şifre: Supabase'de belirlediğiniz şifre

-- =============================================
-- EK: Operator veya Viewer kullanıcı eklemek için
-- =============================================

-- OPERATOR KULLANICI (Operasyonel yetkiler)
/*
DO $$
DECLARE
  v_user_id uuid := 'OPERATOR_USER_ID_BURAYA'::uuid;
BEGIN
  INSERT INTO profiles (id, username, full_name, status)
  VALUES (v_user_id, 'operator', 'Operatör Kullanıcı', 'active')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO user_roles (user_id, role_id)
  VALUES (v_user_id, '22222222-2222-2222-2222-222222222222')
  ON CONFLICT (user_id, role_id) DO NOTHING;
END $$;
*/

-- VIEWER KULLANICI (Sadece görüntüleme)
/*
DO $$
DECLARE
  v_user_id uuid := 'VIEWER_USER_ID_BURAYA'::uuid;
BEGIN
  INSERT INTO profiles (id, username, full_name, status)
  VALUES (v_user_id, 'viewer', 'İzleyici Kullanıcı', 'active')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO user_roles (user_id, role_id)
  VALUES (v_user_id, '33333333-3333-3333-3333-333333333333')
  ON CONFLICT (user_id, role_id) DO NOTHING;
END $$;
*/

-- =============================================
-- DOĞRULAMA SORGUSU
-- =============================================
-- Kullanıcınızın başarıyla oluşturulduğunu kontrol edin:

SELECT
  p.username,
  p.full_name,
  p.status,
  r.name as role_name,
  COUNT(per.code) as permission_count
FROM profiles p
JOIN user_roles ur ON p.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions per ON rp.permission_id = per.id
WHERE p.username = 'admin'
GROUP BY p.username, p.full_name, p.status, r.name;

-- Beklenen Sonuç:
-- username | full_name          | status | role_name | permission_count
-- admin    | Sistem Yöneticisi  | active | admin     | 15
