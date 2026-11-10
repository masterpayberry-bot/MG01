-- ============================================================
-- MG EDITÁVEIS • TABELA DE ATIVIDADES GERAIS DE CLIENTES
-- Compatível com Supabase Cloud (PostgreSQL) e MySQL / XAMPP
-- ============================================================

-- 1. ESTRUTURA PARA O SUPABASE (PostgreSQL)
-- Copie e cole na aba "SQL Editor" do painel Supabase para criar a tabela oficial:
CREATE TABLE IF NOT EXISTS public.atividades (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL,                     -- 'cnh', 'atestado_upa', 'atestado_unimed', 'rg', 'exame', 'prontuario', 'diploma', 'recarga', 'cadastro'
    subrotulo TEXT,                         -- Ex: 'Atestado Médico (UPA 24h)', 'Atestado Médico (Unimed)', 'CNH Digital (Cat. AB)'
    descricao TEXT NOT NULL,                -- Nome do condutor, paciente, diplomado ou titular
    usuario TEXT NOT NULL,                  -- Nome do cliente registrado que gerou o documento
    user_id INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
    valor TEXT,                             -- Ex: '- R$ 20,00', '- R$ 25,00', '+ R$ 100,00'
    status TEXT DEFAULT 'concluido',        -- 'concluido', 'pendente'
    dados_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de Alta Performance
CREATE INDEX IF NOT EXISTS idx_atividades_created_at ON public.atividades (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_atividades_user_id ON public.atividades (user_id);
CREATE INDEX IF NOT EXISTS idx_atividades_tipo ON public.atividades (tipo);

-- Políticas RLS (Row Level Security) para leitura e escrita pública autorizada
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura pública de atividades" ON public.atividades;
CREATE POLICY "Permitir leitura pública de atividades" 
ON public.atividades FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção pública de atividades" ON public.atividades;
CREATE POLICY "Permitir inserção pública de atividades" 
ON public.atividades FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização pública de atividades" ON public.atividades;
CREATE POLICY "Permitir atualização pública de atividades" 
ON public.atividades FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir exclusão de atividades" ON public.atividades;
CREATE POLICY "Permitir exclusão de atividades" 
ON public.atividades FOR DELETE USING (true);

-- ------------------------------------------------------------
-- 2. VERSÃO COMPATÍVEL COM MYSQL (XAMPP / HostGator / cPanel)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `atividades` (
  `id` VARCHAR(100) NOT NULL,
  `tipo` VARCHAR(50) NOT NULL,
  `subrotulo` VARCHAR(100) NULL,
  `descricao` VARCHAR(255) NOT NULL,
  `usuario` VARCHAR(150) NOT NULL,
  `user_id` INT NULL,
  `valor` VARCHAR(50) NULL,
  `status` VARCHAR(50) DEFAULT 'concluido',
  `dados_json` LONGTEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_atividades_created` (`created_at` DESC),
  INDEX `idx_atividades_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
