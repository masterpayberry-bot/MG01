# 🚀 Guia de Hospedagem no XAMPP — MG Editáveis

Tudo já foi configurado e preparado para rodar perfeitamente no **XAMPP** (Apache + PHP + MySQL).

---

## 📁 Onde os Arquivos Estão

Os arquivos do projeto já foram instalados e sincronizados na sua pasta do XAMPP:
👉 **`C:\xampp\htdocs\mgeditaveis\`**

*(Você também pode mover os arquivos diretamente para a raiz `C:\xampp\htdocs\` se preferir acessar diretamente por `http://localhost/`)*

---

## ⚡ Como Iniciar e Usar

1. Abra o **XAMPP Control Panel**.
2. Clique em **Start** no **Apache**.
3. Clique em **Start** no **MySQL**.
4. Abra o navegador e acesse:

* 🏠 **Página Principal / Início:**
  👉 **`http://localhost/mgeditaveis/`**

* 🔐 **Painel Administrativo:**
  👉 **`http://localhost/mgeditaveis/admin.html`**

* 🚗 **Editor de CNH (+ Nova CNH):**
  👉 **`http://localhost/mgeditaveis/criar-cnh.html`**

* 📱 **Aplicativo CNH Digital / CDT:**
  👉 **`http://localhost/mgeditaveis/app/index.html?view=cnh`**  
  ou **`http://localhost/mgeditaveis/habilitacao.html`**

---

## 🔑 Contas Pré-cadastradas

| Tipo | E-mail | Senha | Saldo |
|---|---|---|---|
| **Administrador** | `moritzpj@gmail.com` | `840169` | R$ 1.170,00 |
| **Cliente Teste** | `lucas.francisco@gmail.com` | `123456` | R$ 240,00 |

---

## 🗄️ Configuração do Banco de Dados MySQL (XAMPP)

Conforme solicitado, a conexão local está configurada com:
* **Host:** `localhost`
* **Banco de Dados (Db nome):** `test`
* **Usuário (Db usuario):** `root`
* **Senha (Db senha):** `root`

* **Criação e Importação Automática:** Ao iniciar o MySQL no XAMPP e abrir o site, o próprio PHP verifica se a tabela `usuarios` existe dentro do banco `test`. Se não existir, ele importa automaticamente a estrutura do arquivo `database.sql`!
* **Fallback Seguro:** Caso o MySQL esteja temporariamente parado, o sistema continua funcionando através dos arquivos locais `app/db.json` e `app/config.json`.
* **Fallback Seguro:** Caso o MySQL esteja desligado no momento, o sistema continua funcionando normalmente gravando em `app/db.json` e `app/config.json`, sem travar ou dar erro.

---

## ⚙️ O que foi preparado:
1. **`.htaccess` Completo**: URLs limpas (`/app`, `/verificador`, `/admin`) e rotas da API (`/api/config`, `/api/db/*`).
2. **Endpoints Nativos em PHP**:
   - `api/config/index.php`: Leitura e gravação de configurações.
   - `api/db/index.php`: API REST para gerenciar usuários, CNHs, recargas, tickets e roadmap.
   - `api/index.php`: Roteador com suporte completo para emissão de CNH, relatórios, login e validação.
3. **Adaptador de Subpasta**: Funciona perfeitamente tanto em subpasta (`/mgeditaveis/`) quanto na raiz (`/`).
