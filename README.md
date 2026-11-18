# Registro de atividades semanal — Next.js

Aplicativo standalone com Next.js 16, React 19, MUI, Lucide, ApexCharts e PostgreSQL no Neon. Não depende do Power Apps nem do Microsoft Entra.

## Funcionalidades

- Login e cadastro por nome, e-mail e senha (mínimo de 12 caracteres).
- Sessões aleatórias persistidas como hashes SHA-256 no Neon, com cookie HttpOnly, SameSite=Lax, Secure em produção e expiração de 7 dias.
- Senhas usando scrypt com salt aleatório, sem armazenamento em texto puro.
- Novos cadastros entram como COLLABORATOR. Contas MANAGER acessam dashboard, equipe e configurações.
- Registros por usuário, filtros, edição, repetição, exportação CSV e gráficos permanecem na aplicação.
- Limite de tentativas de login por conta e verificação de origem em requisições de autenticação.
- Alteração de senha disponível na API autenticada POST /api/auth/password.

## Executar

```bash
npm install
cp .env.example .env.local
# Preencha DATABASE_URL com a connection string do Neon
npm run dev
```

Acesse http://localhost:3000 e escolha login ou cadastro. Para produção: `npm run lint && npm run build && npm start`. Em Vercel conecte este repositório; em Render configure build `npm ci && npm run build` e start `npm start`. Configure a variável secreta `DATABASE_URL`, HTTPS e um domínio próprio. Nunca coloque DATABASE_URL em NEXT_PUBLIC_*.

## Banco de dados

Projeto Neon existente: `inpasa-projetos-arquitetura` na organização Lucas F N; banco `inpasa_projetos_arquitetura`. Migração `db/migrations/001_local_auth.sql` aplicada à branch principal. O administrador inicial foi criado diretamente no Neon; suas credenciais devem ser alteradas assim que acessar. Não adicione senhas nem hashes fixos ao Git. Dados fictícios antigos continuam no banco, mas não aparecem nos relatórios dos usuários autenticados.

Para redefinir a senha em sessão autenticada, use POST /api/auth/password com JSON `{"currentPassword":"...","newPassword":"..."}` (12 ou mais caracteres). O cadastro público não concede privilégios de administrador.

## Observação

Os dados em `app_users` sem senha são perfis antigos de demonstração; estão excluídos das consultas de usuários e atividades da interface autenticada. Revise-os antes de uma migração real dos registros históricos.
