# 🚀 GUIA COMPLETO DE HOSPEDAGEM NA HOSTGATOR (PHP + MYSQL)

Este guia explica o passo a passo exato para subir a plataforma **HappyNation / CNH Digital** na sua conta de hospedagem da **HostGator** (ou qualquer servidor com cPanel) utilizando **Banco de Dados MySQL**.

---

## 📋 Pré-requisitos
- Conta de Hospedagem ativa na HostGator (P, M, Turbo ou VPS).
- Um domínio configurado (exemplo: `seudominio.com.br`).
- Acesso ao **cPanel** da HostGator.

---

## 🛠️ PASSO 1: Criar o Banco de Dados MySQL na HostGator
1. Faça login no **cPanel** da HostGator (ex: `https://seudominio.com.br/cpanel` ou pelo portal do cliente).
2. Na seção **Bancos de Dados**, clique em **Assistente de Banco de Dados MySQL** (ou *Bancos de Dados MySQL*).
3. **Nome do Banco**: Digite um nome para o banco (exemplo: `happydb`). O nome final ficará algo como `seuusuario_happydb`. Clique em **Próximo Passo**.
4. **Usuário do Banco**: Digite um nome de usuário (exemplo: `userhappy`).
5. **Senha**: Crie uma senha forte e guarde-a (exemplo: `SenhaForte#2026`). Clique em **Criar Usuário**.
6. **Privilégios**: Marque a opção **TODOS OS PRIVILÉGIOS** e clique em **Fazer Alterações**.

---

## 📥 PASSO 2: Importar o Arquivo `database.sql` no phpMyAdmin
1. De volta ao menu principal do **cPanel**, vá na seção **Bancos de Dados** e clique em **phpMyAdmin**.
2. No menu da esquerda do phpMyAdmin, clique no nome do banco de dados criado (ex: `seuusuario_happydb`).
3. No menu superior, clique na aba **Importar**.
4. Clique no botão **Escolher Arquivo** e selecione o arquivo **`database.sql`** que está na pasta raiz deste projeto.
5. Deixe as opções padrão e clique em **Executar** no final da página.
6. As 4 tabelas (`usuarios`, `recargas`, `cnhs`, `configuracoes`) e os dados padrão serão importados com sucesso!

---

## ⚙️ PASSO 3: Configurar o Arquivo `api/config.php`
1. Abra a pasta `api/` e edite o arquivo **`config.php`**.
2. Atualize os dados de conexão com as credenciais que você criou no Passo 1:

```php
$DB_HOST = 'localhost';               // Servidor MySQL (geralmente localhost)
$DB_USER = 'seuusuario_userhappy';     // Seu usuário do MySQL cPanel
$DB_PASS = 'SuaSenhaForte#2026';       // Sua senha do MySQL cPanel
$DB_NAME = 'seuusuario_happydb';       // Nome completo do Banco MySQL
```
3. Salve as alterações.

---

## 📤 PASSO 4: Enviar os Arquivos para a HostGator
Você pode enviar os arquivos via **Gerenciador de Arquivos do cPanel** ou via **FTP (FileZilla)**.

### Método A: Via Gerenciador de Arquivos (Recomendado)
1. No **cPanel**, acesse **Gerenciador de Arquivos**.
2. Abra a pasta **`public_html`** (ou a subpasta do subdomínio).
3. Compacte os arquivos do projeto em um arquivo `.zip` no seu computador.
4. Clique em **Carregar / Upload** no Gerenciador de Arquivos e envie o arquivo `.zip`.
5. Selecione o arquivo enviado no cPanel e clique em **Extrair (Extract)**.

---

## 🌐 PASSO 5: Acessar e Testar o Sistema Online

Após enviar os arquivos, seus links estarão ativos imediatamente:

- 📊 **Painel Administrativo**: `https://seudominio.com.br/admin.html`
- 🔑 **Tela de Login / Cadastro**: `https://seudominio.com.br/login.html`
- 📄 **Gerador de CNH**: `https://seudominio.com.br/criar-cnh.html`
- 📱 **WebApp Mobile CNH**: `https://seudominio.com.br/app/index.html`

---

## 🔑 Credenciais Padrão para Login Inicial:
- **Painel Admin / Usuário Máster**:
  - **E-mail**: `moritzpj@gmail.com`
  - **Senha**: `840169`
- **Cliente de Teste**:
  - **E-mail**: `lucas.francisco@gmail.com`
  - **Senha**: `123456`
