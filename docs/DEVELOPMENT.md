# Desenvolvimento Local

Passos para rodar e desenvolver o projeto localmente.

## Dependências

- Node.js (versão indicada em `package.json` — `node: 22.x` recomendado)
- npm

## Instalação

```bash
git clone https://github.com/laurourbano/baixa.git
cd baixa
npm install
```

## Rodar o backend (bridge)

```bash
npm run bridge
# ou
node bridge/server.js
```

O backend por padrão roda na porta `3002` (ou `process.env.PORT`).

## Servir o frontend

Você pode abrir `index.html` diretamente no navegador ou servir via um servidor estático:

```bash
# servidor simples em Python
python -m http.server 8000
# acesse http://localhost:8000
```

## Scripts úteis

- `npm run bridge` — inicia o backend.
- `npm test` — executa testes unitários (Vitest) e de integração (Playwright) se configurados.
