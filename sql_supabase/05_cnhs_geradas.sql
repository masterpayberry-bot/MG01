-- ============================================================
-- 05: CNHS DIGITAIS GERADAS (SUPABASE)
-- ============================================================

INSERT INTO public.cnhs (id, user_id, user_nome, nome_cnh, cpf, rg, categoria, genero, valor_cobrado, valor_pendencia, dados_json, created_at) VALUES ('CNH-1991', 12, 'Matheus despachante', 'ANDRÉ LUIS CORTES GINDRI', '200.273.177-22', '38.492.105-8 SSP SP', 'AD', 'Masculino', '25.00', '500,00', '{"id":"CNH-1991","user_email":"dedei.dedei1007@gmail.com","nome":"ANDRÉ LUIS CORTES GINDRI","nome_cnh":"ANDRÉ LUIS CORTES GINDRI","cpf":"200.273.177-22","cat":"AD","categoria":"AD","cat_hab":"AD","rg":"38.492.105-8 SSP SP","doc_identidade":"38.492.105-8 SSP SP","nasc":"05/06/2002, MACAÉ,RJ","data_nascimento":"05/06/2002, MACAÉ,RJ","mae":"ANA CARLA CORTES GINDRI","filiacao_2":"ANA CARLA CORTES GINDRI","pai":"","filiacao_1":"","reg":"09857329662","registro":"09857329662","validade":"18/05/2035","emissao":"10/05/2025","data_emissao":"10/05/2025","hab":"10/02/2021","habilitacao":"10/02/2021","local":"MACAÉ RJ","cidade":"MACAÉ RJ","municipio":"MACAÉ RJ","uf":"RIO DE JANEIRO ","estado":"RIO DE JANEIRO ","observacoes":"EAR","genero":"Masculino","sexo":"Masculino","valor_pendencia":"500,00","senha":"840169","status":"Ativo","valor_cobrado":26,"created_at":"2026-11-11T20:53:11.567Z","filename":"CNH_ANDRÉ_LUIS_CORTES_GINDRI.pdf"}', '2026-11-11 20:53:11.567+00')
ON CONFLICT (id) DO UPDATE SET
    dados_json = EXCLUDED.dados_json,
    valor_cobrado = EXCLUDED.valor_cobrado;
