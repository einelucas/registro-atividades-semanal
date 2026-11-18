# INPASA • Projetos & Arquitetura

Conversão do protótipo HTML v7 para uma aplicação com **Next.js 15 + React 19 + MUI 7 + Lucide React + ApexCharts**, com API PostgreSQL no **Neon**. Inclui cliente **React + Vite** compatível com o build estático necessário para publicar como **Power Apps Code App**.

## O que foi implementado

- Login demonstrativo por seleção de perfil e fluxo separado de autenticação com Microsoft Entra ID em produção.
- Registrar atividade, edição, repetição e exclusão próprias.
- Histórico pessoal, busca, filtro de situação.
- Dashboard de gestão com quatro gráficos ApexCharts e estatísticas, filtros de período/unidade/colaborador.
- Registros da equipe, exportação CSV com proteção básica contra injeção de fórmulas.
- Configuração de unidades e categorias (desativação lógica; históricos preservados).
- Modo apresentação e layout responsivo, incluindo navegação móvel.
- API Next.js, consultas parametrizadas, validação Zod, checagem de propriedade e autorização por perfil.
- Banco Neon criado na organização **Lucas F N**, projeto `inpasa-projetos-arquitetura`, database `inpasa_projetos_arquitetura` (ID do projeto `young-pond-67754083`).

**Importante:** o cliente Power Apps é estático e chama a API do Next.js hospedada externamente. **Não** coloque credenciais PostgreSQL no Vite ou em variáveis `VITE_*`.

## Instalação Next.js

1. Instale Node.js LTS, extraia o projeto e execute:

   ```powershell
   npm install
   Copy-Item .env.example .env.local
   ```

2. No Neon, abra **Projects > inpasa-projetos-arquitetura > Connect** e copie a connection string para `DATABASE_URL` em `.env.local`. Este ZIP **não inclui senhas**.
3. Para explorar dados fictícios, mantenha `ENABLE_DEMO_AUTH=true` **somente localmente**.

   ```powershell
   npm run dev
   ```

4. Abra `http://localhost:3000`. Para gerar build de produção:

   ```powershell
   npm run lint
   npm run build
   npm start
   ```

**Produção:** use `ENABLE_DEMO_AUTH=false`, configure `ENTRA_TENANT_ID`, `ENTRA_API_AUDIENCE`, `NEXT_PUBLIC_ENTRA_CLIENT_ID`, `NEXT_PUBLIC_ENTRA_TENANT_ID` e `NEXT_PUBLIC_ENTRA_API_SCOPE` e cadastre o `entra_oid` dos usuários no banco após obter a autorização corporativa adequada. Registre no Entra o redirect URI exato do Next e do Power Apps Code App, configure permissões da API e consentimento. A API valida a assinatura JWT usando JWKS oficial da Microsoft, emissor, audience e `oid`, e exige o usuário cadastrado e ativo. O identificador que vem do frontend nunca concede privilégios em produção.

SQL ilustrativo para **vincular** usuário corporativo já existente (substitua dados reais adequados e execute só com autorização):

```sql
UPDATE app_users SET entra_oid='OID-DO-ENTRA', email='usuario@empresa.com'
WHERE display_name='Lucas';
```

Não publique com `ENABLE_DEMO_AUTH=true`: neste modo o seletor não autentica, e qualquer pessoa com acesso à API de demonstração poderia atuar como os perfis fictícios.

## Neon

O banco já foi criado e populado para demonstração:

- 10 perfis (`app_users`), 6 unidades (`units`), 6 categorias (`categories`), 82 atividades fictícias (`activities`).
- O arquivo `db/schema.sql` permite recriar o esquema em outro ambiente (não execute novamente se não precisar).
- Não há integração direta Neon–Power Apps: a arquitetura segura utiliza **Power Apps (cliente) → API Next.js hospedada → Neon PostgreSQL**.

## Implantar a API Next.js em Render ou Vercel

- Crie um serviço Node/Web para esta pasta raiz.
- Build: `npm install && npm run build`.
- Start: `npm start` (Render). Para Vercel, conecte o repositório Next.js normalmente.
- Configure as variáveis da `.env.example` como **segredos do serviço**, sem valores de demonstração em produção.
- Configure `ALLOWED_ORIGINS` como lista separada por vírgulas de **origens HTTPS exatas** dos clientes Power Apps para liberar CORS. Não use `*` em produção.
- Use HTTPS e revise CSP/allowlist do ambiente Power Platform, caso restrinja requisições externas.

## Publicar no Power Apps Code Apps (CLI moderna)

**Pré-requisitos:** Power Apps Code Apps habilitado no ambiente pelo administrador, licenças adequadas para usuários finais, conta Microsoft com permissões e CLI instalada. O Next.js deve estar hospedado (Power Apps hospeda somente o bundle do cliente Vite, não executa a API/servidor Next).

No PowerShell:

```powershell
cd powerapps
npm install
Copy-Item .env.example .env.local
```

Configure `VITE_API_URL=https://URL-PUBLICA-DA-API` em `powerapps/.env.local`. Para login corporativo, preencha também `VITE_ENTRA_CLIENT_ID`, `VITE_ENTRA_TENANT_ID` e `VITE_ENTRA_API_SCOPE`, e configure as origens permitidas no backend e os redirect URIs no Entra. Todas as `VITE_*` aparecem no código do navegador: **não use senhas nem DATABASE_URL**.

```powershell
npm install --global @microsoft/power-apps-cli
npm install --global @microsoft/power-apps
pa app init --display-name "INPASA - Projetos e Arquitetura" --environment-id SEU_ENVIRONMENT_ID
npm run build
pa app push
```

Para executar localmente sob o contexto do Power Apps:

```powershell
pa app run
```

**CLI antiga (Power Platform CLI / pac)**: se seu ambiente ainda utilizar os comandos legados, após autenticação:

```powershell
pac auth create --environment SEU_ENVIRONMENT_ID
pac code init --displayName "INPASA - Projetos e Arquitetura" --buildPath dist --fileEntryPoint index.html
npm run build
pac code push
```

**Atenção:** `pac pcf push` publica um **componente PCF**, não este aplicativo Code App. `pa app push` é o fluxo recomendado pela documentação Microsoft mais recente. O comando deve rodar **na pasta `powerapps`**. A CLI gera arquivos de configuração específicos da sua organização/ambiente durante a inicialização, por isso eles não estão pré-preenchidos neste ZIP.

Documentação oficial:
- [Quickstart Code Apps](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/create-an-app-from-scratch)
- [CLI `pa`](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/reference/cli)
- [CLI `pac code` legado](https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/code)
- [Requisitos Code Apps](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/overview)

## Limites e pendências de integração

- **Sem publicação remota realizada:** é necessário executar `pa app init` e `pa app push` com a conta corporativa e ID do ambiente Power Platform.
- **Sem build de dependências verificado neste ambiente:** acesso à registry npm indisponível na execução de geração. Execute `npm install`, `npm run lint` e `npm run build` no seu ambiente e corrija incompatibilidades se aparecerem.
- Modo Entra preparado, mas depende de cadastro de aplicativo, configuração de audience/escopos e vínculo do OID dos colaboradores. A autenticação em pop-up no host Power Apps pode exigir ajustes conforme a política do tenant e o fluxo de login incorporado. Para produção, teste dentro do host Power Apps real.
- O cliente Power Apps faz requisições diretas HTTPS para o backend Next. Sua organização deve autorizar essa integração nas políticas de CSP, DLP e CORS.
- Os 82 registros presentes no Neon são **fictícios** e devem ser removidos/isolados antes de uso real; para evitar perda acidental de dados, o projeto não contém uma rotina automática de exclusão.
