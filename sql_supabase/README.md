# Scripts de Restauração do Banco de Dados Supabase (MG Editáveis)

Esta pasta contém todos os scripts SQL organizados de forma individual e também um script mestre unificado para restauração no Supabase.

---

### Opção 1 (Recomendada - Mais Rápida): Executar Tudo de Uma Vez
Execute apenas o arquivo:
- `00_EXECUTAR_TUDO_COMPLETO.sql`
Ele cria as tabelas, configura as permissões de acesso (RLS) e insere todos os usuários (com seus saldos preservados), configurações, atestados e CNHs completas com fotos em Base64.

---

### Opção 2: Executar Separadamente por Etapas
Se preferir executar tabela por tabela, siga esta ordem:

1. **`01_estrutura_tabelas_e_rls.sql`**: Criação das tabelas (`usuarios`, `configuracoes`, `atestados`, `cnhs`, `exames`, `recargas`, `indicacoes`, `atividades`) e liberação das políticas de acesso RLS.
2. **`02_usuarios_e_saldos.sql`**: Cadastro de todos os 14 usuários (clientes e administradores com R$ 8.330,00, R$ 49.925,00, etc.) + alinhamento automático da sequência de IDs (`setval`).
3. **`03_configuracoes_sistema.sql`**: Configurações gerais (preços dos documentos, chave Pix, domínios e tema visual).
4. **`04_atestados_medicos.sql`**: Registros completos dos atestados médicos.
5. **`05_cnhs_geradas.sql`**: Todas as CNHs geradas com imagens e assinaturas em Base64.

---

### Como Rodar no Supabase:
1. Abra seu painel no Supabase: https://supabase.com/dashboard
2. Selecione o seu projeto.
3. Clique em **SQL Editor** no menu esquerdo.
4. Clique em **+ New query**.
5. Abra o arquivo desejado, copie todo o código e cole no editor.
6. Clique no botão verde **Run** (Executar).
