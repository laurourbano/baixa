# Deploy no Render (Backend)

Este guia explica como publicar o backend (`bridge/server.js`) no Render e pontos importantes sobre armazenamento.

## Passos rápidos

1. Crie um novo **Web Service** no Render conectado ao repositório `baixa` no GitHub.
2. Configure as opções:
   - **Environment**: Node
   - **Build Command**: (vazio)
   - **Start Command**: `npm run bridge`  (ou `node bridge/server.js`)
3. Render fornece `PORT` automaticamente — o `server.js` já suporta `process.env.PORT`.

## Variáveis de ambiente recomendadas

- `NODE_ENV=production`
- (Opcional) `BAIXA_API_URL` — se você hospedar o frontend separadamente, configure `window.BAIXA_API_URL` ou defina uma variável equivalente para o ambiente do frontend.

## Atentar para o filesystem efêmero

- Render não garante persistência de arquivos gravados localmente. Arquivos em `bridge/backups/` e `bridge/data.json` podem desaparecer após redeploys.
- Recomendação: configurar um bucket S3 (ou equivalente) e modificar o backend para fazer upload/backup para lá. Em `docs/ARCHITECTURE.md` há mais contexto.

## Sugestão mínima para S3 (exemplo)

- Instalar `aws-sdk` e usar variáveis `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`.
- No backend, ao salvar backup, envie o arquivo para o bucket além de gravar localmente.
