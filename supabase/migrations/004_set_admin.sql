-- ============================================================
-- 004 – Tornar um usuário admin
-- Execute no Supabase Dashboard → SQL Editor
-- Substitua 'SEU_EMAIL@AQUI.COM' pelo seu e-mail real
-- ============================================================

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"is_admin": true}'
WHERE email = 'SEU_EMAIL@AQUI.COM';

-- Após executar, faça logout e login novamente no site
-- para o JWT ser atualizado com o novo app_metadata.
