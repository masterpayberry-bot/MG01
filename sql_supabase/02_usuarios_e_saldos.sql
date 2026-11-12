-- ============================================================
-- 02: USUÁRIOS, SALDOS, CONTAS E PERMISSÕES (SUPABASE)
-- Restaura administradores, clientes e saldos existentes
-- Ajusta a sequência de IDs para novos cadastros funcionarem sem erro
-- ============================================================

<USER_REQUEST>
INSERT INTO public.usuarios (id, nome, email, senha, phone, saldo, role, status, register_ip, last_ip, created_at) VALUES (2, 'Administrador MG', 'MG', 'Comida12.@', '(21) 99882-1029', '8330.00', 'admin', 'approved', null, null, '2026-11-08 03:32:13.080744+00'), (3, 'jonads', 'rosaselvagem2016@gmail.com', '656543545', '47991477590', '0.00', 'client', 'pending', null, null, '2026-11-08 04:01:59.905373+00'), (5, 'Gustavo', 'reksbrogo@gmail.com', '32462410', '71991489040', '980.00', 'client', 'approved', null, null, '2026-11-08 17:42:49.118037+00'), (6, 'Drake Almeida', 'torres.matheus180x@gmail.com', '1122334455Axm', '3599092784', '2950.00', 'client', 'approved', null, null, '2026-11-08 19:29:57.130867+00'), (7, 'alucard', 'paineisonline17@gmail.com', '170705Jr', '21959214450', '500.00', 'client', 'approved', null, null, '2026-11-08 19:49:38.648045+00'), (8, 'Silva', 'paulinhobrasil78@gmail.com', 'Silva20!', '21971940732', '1000.00', 'client', 'approved', null, null, '2026-11-08 19:57:41.438815+00'), (9, 'Joao guilherme', 'joaoguilherme246@gmail.com', 'jaodnrt157', '86 99491‑2805', '500.00', 'client', 'approved', null, null, '2026-11-08 20:30:34.555947+00'), (10, 'dono', 'desmanchedono@gmail.com', 'santos222', '342543645654', '49925.00', 'client', 'approved', null, null, '2026-11-08 20:51:36.499697+00'), (11, 'Chefepay', 'lucapere1237@gmail.com', 'she2hwbrfGS3vdF', '21978336226', '500.00', 'client', 'approved', null, null, '2026-11-09 02:27:05.797918+00'), (12, 'Matheus despachante', 'dedei.dedei1007@gmail.com', 'dedei1007', '21966393804', '275.00', 'client', 'approved', null, null, '2026-11-09 02:28:29.572124+00'), (13, 'Thaygo nathan', 'thaygonathan22@gmail.com', 'Thay1993@', '89981163939', '250.00', 'client', 'approved', null, null, '2026-11-10 07:41:05.814845+00'), (14, 'Lindomar Ferreira Santos', 'domarferreira6@gmail.com', 'Domar2005', '38999124595', '200.00', 'client', 'approved', null, null, '2026-11-11 01:06:11.553747+00'), (15, 'Ph', 'phdocsmg@proton.me', '99607122Pedro', '55 46 920056018', '250.00', 'client', 'approved', null, null, '2026-11-11 16:03:29.958573+00'), (16, 'jose eduardo da silva', 'testeyessilva@gmail.com', 'eduardo123321', '5582991310425', '0.00', 'client', 'approved', null, null, '2026-11-12 16:44:33.630059+00');
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-11-12T19:26:52-03:00.
</ADDITIONAL_METADATA>
ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    senha = EXCLUDED.senha,
    phone = EXCLUDED.phone,
    saldo = EXCLUDED.saldo,
    role = EXCLUDED.role,
    status = EXCLUDED.status;

-- Alinha a sequência de IDs de usuários com o maior ID inserido
SELECT setval(pg_get_serial_sequence('public.usuarios', 'id'), COALESCE(max(id), 1)) FROM public.usuarios;

-- Conferência rápida
SELECT id, nome, email, saldo, role, status FROM public.usuarios ORDER BY id;
