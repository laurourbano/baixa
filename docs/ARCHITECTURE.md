# Arquitetura do Projeto

Visão geral da arquitetura e organização do repositório `baixa`.

## Estrutura principal

- `index.html` — frontend estático (UI e interação).
- `css/` — estilos customizados (tema escuro, skeletons, etc.).
- `js/` — lógica do frontend (`main.js`, `ui.js`).
- `bridge/` — pequeno backend em Node/Express responsável por:
  - servir endpoints da API para salvar/ler backups (`/api/*`),
  - expor um endpoint de automação (`/automate`) que dispara um script PowerShell local.
  - armazenar `data.json` e backups em `bridge/backups/`.
- `package.json` — scripts úteis (`npm run bridge` para rodar o backend).

## Fluxo de dados

1. O frontend carrega dados via `/api/data` (chamada feita por `js/main.js::callApi`).
2. Alterações no frontend acionam `POST /api/save` (autosave) e `POST /api/backup` (backup manual).
3. Backups timestamped são gravados em `bridge/backups/` e o backup corrente fica em `bridge/data.json`.
4. `GET /api/backups` e `GET /api/backup/:name` permitem listar e restaurar backups.

## Notas sobre deployment

- Em provedores como Render, o filesystem é efêmero — arquivos escritos no disco podem ser perdidos após deploy/restart.
- Para backups duráveis, **use armazenamento externo** (S3, Blob Storage ou banco de dados). Veja `docs/DEPLOY_RENDER.md`.

## Segurança e limites

- Atualmente não há autenticação da API; o backend presume execução em ambiente controlado.
- O endpoint `/automate` executa scripts locais (PowerShell) — mantenha o acesso restrito.
