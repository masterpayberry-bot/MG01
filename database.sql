-- ============================================================
-- MG EDITÁVEIS - BANCO DE DADOS MYSQL COMPLETO & ATUALIZADO
-- Sistema: CNH Digital, Exames Toxicológicos, Atestados Médicos,
-- Recargas PIX, Usuários, Configurações e Logs de Segurança
-- Compatível com: phpMyAdmin / MySQL 5.7+ / MariaDB / HostGator / XAMPP
-- ============================================================

SET FOREIGN_KEY_CHECKS=0;

-- ------------------------------------------------------------
-- 1. TABELA DE USUÁRIOS (CLIENTES E ADMINISTRADORES)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `senha` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(30) DEFAULT NULL,
  `saldo` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `role` ENUM('admin', 'client') NOT NULL DEFAULT 'client',
  `status` ENUM('pending', 'approved', 'blocked') NOT NULL DEFAULT 'approved',
  `register_ip` VARCHAR(64) DEFAULT NULL,
  `last_ip` VARCHAR(64) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuário Administrador Oficial MG Editáveis e Contas Iniciais
INSERT INTO `usuarios` (`id`, `nome`, `email`, `senha`, `phone`, `saldo`, `role`, `status`) VALUES
(1, 'MG Editáveis', 'admin@mgeditaveis.com.br', 'Comida12.@', '(21) 99882-1029', 9453.00, 'admin', 'approved'),
(2, 'Administrador MG', 'MG', 'Comida12.@', '(21) 99882-1029', 9453.00, 'admin', 'approved')
ON DUPLICATE KEY UPDATE 
  `nome` = VALUES(`nome`),
  `phone` = VALUES(`phone`),
  `status` = 'approved';

-- ------------------------------------------------------------
-- 2. TABELA DE RECARGAS & SOLICITAÇÕES DE SALDO (PIX)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `recargas` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` INT(11) NOT NULL,
  `user_nome` VARCHAR(150) NOT NULL,
  `valor` DECIMAL(10,2) NOT NULL,
  `metodo` VARCHAR(50) NOT NULL DEFAULT 'PIX QrCode',
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `comprovante` VARCHAR(255) DEFAULT NULL,
  `data` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_recargas_user` (`user_id`),
  CONSTRAINT `fk_recargas_user` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. TABELA DE CNHS GERADAS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cnhs` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` INT(11) NOT NULL,
  `user_nome` VARCHAR(150) NOT NULL,
  `nome_cnh` VARCHAR(150) NOT NULL,
  `cpf` VARCHAR(20) NOT NULL,
  `rg` VARCHAR(30) DEFAULT NULL,
  `categoria` VARCHAR(10) NOT NULL DEFAULT 'B',
  `genero` VARCHAR(20) NOT NULL DEFAULT 'Feminino',
  `valor_cobrado` DECIMAL(10,2) NOT NULL DEFAULT 26.00,
  `valor_pendencia` VARCHAR(30) DEFAULT '500,00',
  `dados_json` LONGTEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_cnhs_user` (`user_id`),
  KEY `idx_cnhs_cpf` (`cpf`),
  CONSTRAINT `fk_cnhs_user` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. TABELA DE EXAMES TOXICOLÓGICOS GERADOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exames` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` INT(11) NOT NULL,
  `user_nome` VARCHAR(150) NOT NULL,
  `paciente_nome` VARCHAR(150) NOT NULL,
  `cpf` VARCHAR(20) NOT NULL,
  `resultado` ENUM('Negativo', 'Positivo') NOT NULL DEFAULT 'Negativo',
  `laboratorio` VARCHAR(150) DEFAULT 'LABORATÓRIO CENTRAL',
  `data_coleta` DATE DEFAULT NULL,
  `data_laudo` DATE DEFAULT NULL,
  `valor_cobrado` DECIMAL(10,2) NOT NULL DEFAULT 20.00,
  `dados_json` LONGTEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_exames_user` (`user_id`),
  KEY `idx_exames_cpf` (`cpf`),
  CONSTRAINT `fk_exames_user` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. TABELA DE ATESTADOS MÉDICOS GERADOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `atestados` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` INT(11) NOT NULL,
  `user_nome` VARCHAR(150) NOT NULL,
  `paciente_nome` VARCHAR(150) NOT NULL,
  `cpf` VARCHAR(20) DEFAULT NULL,
  `cns` VARCHAR(30) DEFAULT NULL,
  `medico_nome` VARCHAR(150) DEFAULT NULL,
  `crm` VARCHAR(30) DEFAULT NULL,
  `cid` VARCHAR(20) DEFAULT NULL,
  `dias_repouso` INT(11) DEFAULT 7,
  `unidade_saude` VARCHAR(150) DEFAULT 'UPA 24h',
  `valor_cobrado` DECIMAL(10,2) NOT NULL DEFAULT 20.00,
  `dados_json` LONGTEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_atestados_user` (`user_id`),
  KEY `idx_atestados_cpf` (`cpf`),
  CONSTRAINT `fk_atestados_user` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 6. TABELA DE CONFIGURAÇÕES GLOBAIS DO SISTEMA
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `configuracoes` (
  `chave` VARCHAR(100) NOT NULL,
  `valor` LONGTEXT NOT NULL,
  PRIMARY KEY (`chave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Configurações Padrão Oficiais MG Editáveis
INSERT INTO `configuracoes` (`chave`, `valor`) VALUES
('cnh_price', '26.00'),
('exame_price', '20.00'),
('atestado_price', '20.00'),
('min_recharge', '25.00'),
('pix_key', 'admin@mgeditaveis.com.br'),
('dominioPainel', 'http://painel-mg-editaveis.com'),
('dominioQrCode', 'https://senatran-validacao-gov.com'),
('dominioApp', 'https://cnh-brasil-app.com'),
('webapp_customization', '{"heroBanner":"","logoImage":null,"govHeaderLogo":null,"logoText":"CNH","logoSub":"DO BRASIL","pwaTitle":"CNH DO BRASIL","pwaSub":"Adicione à tela inicial","pwaBtnText":"Instalar","updateTitle":"APP ATUALIZADO\\nAPP CNH DO BRASIL","downloadUrl":"","downloadBtnText":"BAIXAR NOVA VERSÃO","btnText":"ENTRAR COM gov.br","btnColor":"#255ab8"}')
ON DUPLICATE KEY UPDATE `valor` = VALUES(`valor`);

-- ------------------------------------------------------------
-- 7. TABELA DE SEGURANÇA E IPS BLOQUEADOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ips_bloqueados` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `ip` VARCHAR(64) NOT NULL,
  `motivo` VARCHAR(255) NOT NULL,
  `user_id` INT(11) DEFAULT NULL,
  `user_email` VARCHAR(150) DEFAULT NULL,
  `user_agent` TEXT DEFAULT NULL,
  `data` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ip` (`ip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
