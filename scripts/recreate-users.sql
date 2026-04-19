-- Password hash for 123456
-- Generated via: SELECT extensions.crypt('123456', extensions.gen_salt('bf'))

-- MASTER
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'master@plenum.com.br', '$2a$06$Hi0GlrkXULcIDHvpHtPsneYfOFALijSTwkv79bWDEMnw2McX1s9sK', now(), 'authenticated', 'authenticated', '{"full_name": "Administrador Master"}', now(), now(), '', '');

-- ADMIN TENANTS
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'admin@guaxupe.gov.br', '$2a$06$Hi0GlrkXULcIDHvpHtPsneYfOFALijSTwkv79bWDEMnw2McX1s9sK', now(), 'authenticated', 'authenticated', '{"full_name": "Admin Guaxupe"}', now(), now(), '', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'admin@muzambinho.gov.br', '$2a$06$Hi0GlrkXULcIDHvpHtPsneYfOFALijSTwkv79bWDEMnw2McX1s9sK', now(), 'authenticated', 'authenticated', '{"full_name": "Admin Muzambinho"}', now(), now(), '', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'admin@plenum.edu.br', '$2a$06$Hi0GlrkXULcIDHvpHtPsneYfOFALijSTwkv79bWDEMnw2McX1s9sK', now(), 'authenticated', 'authenticated', '{"full_name": "Admin Plenum"}', now(), now(), '', '');

-- ALUNOS GUAXUPE
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'carlos.silva@email.com', '$2a$06$Hi0GlrkXULcIDHvpHtPsneYfOFALijSTwkv79bWDEMnw2McX1s9sK', now(), 'authenticated', 'authenticated', '{"full_name": "Carlos Silva"}', now(), now(), '', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'ana.oliveira@email.com', '$2a$06$Hi0GlrkXULcIDHvpHtPsneYfOFALijSTwkv79bWDEMnw2McX1s9sK', now(), 'authenticated', 'authenticated', '{"full_name": "Ana Oliveira"}', now(), now(), '', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'pedro.santos@email.com', '$2a$06$Hi0GlrkXULcIDHvpHtPsneYfOFALijSTwkv79bWDEMnw2McX1s9sK', now(), 'authenticated', 'authenticated', '{"full_name": "Pedro Santos"}', now(), now(), '', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'julia.costa@email.com', '$2a$06$Hi0GlrkXULcIDHvpHtPsneYfOFALijSTwkv79bWDEMnw2McX1s9sK', now(), 'authenticated', 'authenticated', '{"full_name": "Julia Costa"}', now(), now(), '', '');

-- ALUNOS MUZAMBINHO
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'lucas.ferreira@email.com', '$2a$06$Hi0GlrkXULcIDHvpHtPsneYfOFALijSTwkv79bWDEMnw2McX1s9sK', now(), 'authenticated', 'authenticated', '{"full_name": "Lucas Ferreira"}', now(), now(), '', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'mariana.lima@email.com', '$2a$06$Hi0GlrkXULcIDHvpHtPsneYfOFALijSTwkv79bWDEMnw2McX1s9sK', now(), 'authenticated', 'authenticated', '{"full_name": "Mariana Lima"}', now(), now(), '', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'rafael.souza@email.com', '$2a$06$Hi0GlrkXULcIDHvpHtPsneYfOFALijSTwkv79bWDEMnw2McX1s9sK', now(), 'authenticated', 'authenticated', '{"full_name": "Rafael Souza"}', now(), now(), '', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'camila.pereira@email.com', '$2a$06$Hi0GlrkXULcIDHvpHtPsneYfOFALijSTwkv79bWDEMnw2McX1s9sK', now(), 'authenticated', 'authenticated', '{"full_name": "Camila Pereira"}', now(), now(), '', '');

-- ALUNOS PLENUM
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'fernanda.rocha@email.com', '$2a$06$Hi0GlrkXULcIDHvpHtPsneYfOFALijSTwkv79bWDEMnw2McX1s9sK', now(), 'authenticated', 'authenticated', '{"full_name": "Fernanda Rocha"}', now(), now(), '', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'gustavo.almeida@email.com', '$2a$06$Hi0GlrkXULcIDHvpHtPsneYfOFALijSTwkv79bWDEMnw2McX1s9sK', now(), 'authenticated', 'authenticated', '{"full_name": "Gustavo Almeida"}', now(), now(), '', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'beatriz.martins@email.com', '$2a$06$Hi0GlrkXULcIDHvpHtPsneYfOFALijSTwkv79bWDEMnw2McX1s9sK', now(), 'authenticated', 'authenticated', '{"full_name": "Beatriz Martins"}', now(), now(), '', ''),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'diego.ribeiro@email.com', '$2a$06$Hi0GlrkXULcIDHvpHtPsneYfOFALijSTwkv79bWDEMnw2McX1s9sK', now(), 'authenticated', 'authenticated', '{"full_name": "Diego Ribeiro"}', now(), now(), '', '');
