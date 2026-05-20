# API (Endpoints do Backend)

Este documento descreve os endpoints expostos pelo backend em `bridge/server.js`.

Base: `http://<HOST>:<PORT>` (ou `window.BAIXA_API_URL` quando configurado no frontend)

## Endpoints

- `POST /automate`
  - Descrição: dispara o script PowerShell `automate_sagicon.ps1` local com parâmetros.
  - Payload (JSON): `{ local, sit, julgamento, isPendencia }`
  - Resposta: `{ success: true }` (o processo é disparado de forma assíncrona).

- `POST /api/backup`
  - Descrição: salva um backup explícito; grava `bridge/data.json` e cria um arquivo timestamped em `bridge/backups/`.
  - Payload: estado completo da aplicação (objetos `order`, `customs`, `edits`, `deleted`).
  - Resposta: `{ success: true, dataFile: 'data.json', backup: 'backup-YYYY-MM-DDTHH-mm-ss-SSSZ.json' }`

- `POST /api/save`
  - Descrição: autosave usado pelo frontend; comportamento igual ao `/api/backup` (gera `save-...json`).

- `GET /api/backups`
  - Descrição: lista os arquivos de backup disponíveis em `bridge/backups/`.
  - Resposta: `{ backups: ['backup-...json', ...] }`

- `GET /api/backup/:name`
  - Descrição: serve o conteúdo de um backup específico.
  - Resposta: JSON com o estado salvo (mesmo formato que o frontend usa).

- `GET /api/data`
  - Descrição: retorna `bridge/data.json` se existir, senão retorna um arquivo de backup do projeto (`cards_backup.json`) se presente, senão estado padrão `{ order: [], customs: [], edits: {}, deleted: [] }`.

- `GET /api/health`
  - Descrição: endpoint de health check que indica se `data.json` e `cards_backup.json` existem.

## Exemplos `curl`

Salvar backup:

```bash
curl -X POST "http://localhost:3002/api/backup" \
  -H "Content-Type: application/json" \
  -d '{ "order": [], "customs": [], "edits": {}, "deleted": [] }'
```

Listar backups:

```bash
curl http://localhost:3002/api/backups
```

Baixar um backup:

```bash
curl http://localhost:3002/api/backup/backup-2026-05-20T00-00-00-000Z.json
```
