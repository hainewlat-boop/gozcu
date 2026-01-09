# Test Kullanıcısı Oluşturma

## Adım 1: Supabase'de Kullanıcı Oluştur

1. [Supabase Dashboard - Authentication](https://supabase.com/dashboard/project/aniqdibhgxnrtpmivxue/auth/users) linkine gidin

2. **"Add user"** butonuna tıklayın

3. **Email via app** seçeneğinde:
   - **Email**: `d0257@kurum.local`
   - **Password**: `Hain-497384`
   - **Auto Confirm User**: ✅ İŞARETLEYİN (önemli!)

4. **"Create user"** butonuna tıklayın

5. Oluşturulan kullanıcının **ID**'sini (UUID) kopyalayın
   - Listede görünecek, tıklayınca ID gösterilir
   - Örnek: `12345678-1234-1234-1234-123456789abc`

## Adım 2: SQL ile Profil ve Rol Ata

[Supabase SQL Editor](https://supabase.com/dashboard/project/aniqdibhgxnrtpmivxue/sql/new) sayfasına gidin.

Aşağıdaki SQL'i çalıştırın (**USER_ID_BURAYA** yerine kopyaladığınız ID'yi yapıştırın):

\`\`\`sql
DO $$
DECLARE
  v_user_id uuid := 'USER_ID_BURAYA'::uuid;  -- <-- BURAYA KOPYALADIĞINIZ ID'Yİ YAPIŞIRIN
BEGIN
  -- Profil oluştur
  INSERT INTO profiles (id, username, full_name, status)
  VALUES (
    v_user_id,
    'd0257',
    'Admin Kullanıcı',
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
  RAISE NOTICE 'Kurum No: d0257';
  RAISE NOTICE 'Şifre: Hain-497384';
END $$;
\`\`\`

## Adım 3: Giriş Yap

Uygulamayı başlatın:
\`\`\`bash
npm run dev
\`\`\`

Tarayıcıda http://localhost:5173 adresine gidin ve giriş yapın:
- **Kurum Numarası**: `d0257`
- **Şifre**: `Hain-497384`

## Doğrulama

Giriş yaptıktan sonra:
- ✅ Dashboard'u görebilmelisiniz
- ✅ Sağ üstte "d0257" kullanıcı adı görünmeli
- ✅ Tüm menü öğelerine erişiminiz olmalı (Admin rolü)

## Sorun Giderme

### "Invalid login credentials"
- Supabase'de kullanıcı oluşturulurken **Auto Confirm User** işaretlenmiş mi?
- Email doğru mu: `d0257@kurum.local`
- Şifre doğru mu: `Hain-497384`

### "Yetkisiz Erişim"
- SQL scripti çalıştırıldı mı?
- User ID doğru kopyalandı mı?
- Profile ve rol atandı mı kontrol edin:
  \`\`\`sql
  SELECT
    p.username,
    r.name as role_name
  FROM profiles p
  JOIN user_roles ur ON p.id = ur.user_id
  JOIN roles r ON ur.role_id = r.id
  WHERE p.username = 'd0257';
  \`\`\`
