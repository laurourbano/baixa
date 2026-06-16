# Arquitetura do Projeto — WorkDash

Visão completa da arquitetura, organização e fluxo de dados do repositório `baixa`.

---

## Stack Tecnológica

| Camada | Tecnologia | Descrição |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JS (ES6+) | SPA estática, sem frameworks |
| **UI Framework** | Bootstrap 5.3 | Grid, modais, temas (dark/light) |
| **Ícones** | Font Awesome 6 | Ícones via CDN |
| **Planilhas** | SheetJS (xlsx) | Leitura ODS/XLSX e exportação |
| **Backend** | Netlify Functions + Blobs | API REST serverless |
| **Banco** | Netlify Blobs | Key-value persistente |
| **Backup Cloud** | AWS S3 (opcional) | Backups persistentes |
| **Dev Server** | http-server | Servir frontend local |
| **Testes Unitários** | Vitest + jsdom | `tests/unit/` |
| **Testes E2E** | Playwright | `tests/integration/` |
| **CI/CD** | GitHub Actions | Build + testes automáticos |
| **Deploy** | Netlify | Hospedagem estática + funções serverless |

---

## Estrutura de Diretórios

```
baixa/
├── index.html                  # Frontend SPA — única página com todas as views
├── css/
│   ├── padrao.css              # Estilos principais (~1748 linhas, temas dark/light)
│   └── manual.css              # Estilos da página de instruções
├── js/
│   ├── main.js                 # Bootstrap — carrega módulos em ordem
│   ├── config.js               # Configuração: URL do backend
│   ├── store.js                # Estado centralizado multi-dashboard
│   ├── api.js                  # Comunicação com backend (fetch, retry)
│   ├── auth.js                 # Autenticação local (login/logout/senha)
│   ├── cards.js                # Cards: renderização, CRUD, cópia, drag-and-drop
│   ├── dashboards.js           # Multi-dashboards: CRUD, drag, ícones
│   ├── ui.js                   # Controles de UI: sidebar, tema, switchView
│   ├── ui-helpers.js           # Toast, Confirm Dialog, Loading, Status
│   ├── consultas.js            # Base de conhecimento (~1707 linhas)
│   ├── calculator.js           # Calculadora de honorários
│   ├── fiscal.js               # Busca de fiscais por cidade
│   ├── weather.js              # Widget de clima (Open-Meteo)
│   ├── gh-backup.js            # Backup/restore via GitHub API
│   └── servicos.js             # Modelos de parecer por tipo de serviço
├── netlify/
│   └── functions/
│       └── api.js           # Netlify Function — API serverless
├── assets/
│   ├── img/                    # logo.svg, logo.png, favicon.ico
│   ├── faq.json                # Dados FAQ
│   ├── normas.json             # Normas e legislação
│   ├── protocolos-base.json    # Protocolos
│   ├── protocolos-detalhados.json
│   ├── piso.json / piso-ref.json
│   ├── orientacoes.json
│   ├── listas.json
│   ├── respostas.json / respostas-padrao.json
│   ├── nomes-empresariais.json
│   ├── calc-horas.json
│   └── dados.ods               # Planilha de fiscais
├── docs/
│   ├── INDEX.md                # Portal da documentação
│   ├── USER_GUIDE.md           # Guia do usuário
│   ├── ARCHITECTURE.md         # Este arquivo
│   ├── API.md                  # Documentação dos endpoints
│   ├── DEVELOPMENT.md          # Guia de desenvolvimento local
│   ├── TESTING.md              # Guia de testes
│   └── S3.md                   # Integração com S3
├── tests/
│   ├── unit/                   # Testes unitários (Vitest)
│   └── integration/            # Testes E2E (Playwright)
├── scripts/                    # Scripts auxiliares (extração Excel, geradores)
├── .github/workflows/ci.yml    # CI no GitHub Actions
├── netlify.toml                # Configuração de deploy no Netlify
├── package.json                # Dependências e scripts npm
└── vitest.config.js / playwright.config.js
```

---

## Fluxo de Dados

```
┌──────────────────────────────────────────────────────┐
│                   USUÁRIO                            │
└──────────────┬───────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────┐
│        index.html (SPA)      │
│                              │
│  ┌────────────────────────┐  │
│  │       store.js         │  │  ◄── Estado centralizado
│  │  (multi-dashboard)     │  │      (localStorage)
│  └───────────┬────────────┘  │
│              │                │
│  ┌───────────▼────────────┐  │
│  │       api.js           │  │  ◄── Comunicação HTTP
│  │  fetch               │  │
│  └───────────┬────────────┘  │
└──────────────┼───────────────┘
               │
               ▼
┌──────────────────────────────┐
│   Netlify Functions          │
│                              │
│  ┌────────────────────────┐  │
│  │   api.js (serverless)  │  │
│  └───────────┬────────────┘  │
│              │                │
│  ┌───────────▼────────────┐  │
│  │   Netlify Blobs        │  │
│  │   (key-value store)    │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
               │ (opcional)
               ▼
┌──────────────────────────────┐
│        GitHub API            │
│   (backup manual)            │
└──────────────────────────────┘
```

### Fluxo de carregamento

1. **Frontend inicia** → `api.js::callApi('GET /api')`
2. Se backend disponível → dados retornados do Netlify Blobs
3. Se backend indisponível → fallback para `localStorage`
4. Se localStorage vazio → estado inicial com dashboards padrão

### Fluxo de salvamento

1. Usuário modifica card → `store.save()` → grava em localStorage
2. `api.js` detecta mudança → `POST /api` (autosave)
3. Backend grava no Netlify Blobs
4. Opcional: backup manual via GitHub API (`gh-backup.js`)

---

## Módulos Frontend

### `main.js` — Bootstrap

Carrega todos os módulos na ordem correta:

```
config.js → store.js → api.js → auth.js → cards.js → dashboards.js →
ui.js → ui-helpers.js → consultas.js → calculator.js → fiscal.js →
weather.js → gh-backup.js → servicos.js
```

Em ambiente Node (testes), os módulos são importados via `require()`. Em browser, são carregados via tags `<script>`.

### `config.js`

Define `window.BAIXA_API_URL` — URL base do backend. Em produção: `/api` (redireciona para a Netlify Function).

### `store.js`

Gerenciamento de estado centralizado:

- **Estrutura de estado:**

  ```js
  {
    dashboards: [ { id, name, icon, order, customs, edits, deleted } ],
    activeDashboard: 'default',
    dashSortMode: 'custom' | 'alpha',
    servicos: { 'ingresso-pj': '...', 'inscricao-pf': '...', ... }
  }
  ```

- **Migração automática:** Formato antigo (único dashboard) → multi-dashboard
- **Dashboards padrão:** 6 dashboards pré-criados, recriados se ausentes
- **Persistência:** `localStorage` com chave `baixa_rt_data`

### `cards.js`

Gerenciamento de cards (~323 linhas):

- **Renderização:** Grid responsivo Bootstrap (`col-12 col-md-6 col-lg-3`)
- **Tipos suportados:** `copy` (texto), `link` (URL), `pdf`, `info` (informativo)
- **Ordenação:** Via array `order` no dashboard, manipulada por drag-and-drop
- **Cópia:** `navigator.clipboard.writeText()` com feedback visual
- **Placeholder `[00/00/0000]`:** Substituído pela data atual formatada (pt-BR)
- **Drag-and-drop:** HTML5 Drag and Drop API nos handles `⠿`
- **Exportação Excel:** SheetJS para gerar `.xlsx` com todos os cards

### `dashboards.js`

Gerenciamento de múltiplos dashboards (~456 linhas):

- **CRUD completo:** Criar, renomear, excluir dashboards
- **24 ícones** Font Awesome disponíveis
- **Sugestão automática de ícone:** Baseada em palavras-chave no nome (ex.: "ingresso" → 🚪, "baixa" → 🚪)
- **Drag-and-drop:** Reordenação na sidebar
- **Ordenação A-Z:** Alternância entre ordem manual e alfabética
- **Sidebar dinâmica:** Renderização da lista de dashboards com controles hover

### `ui.js`

Controles de interface (~111 linhas):

- **`toggleSidebar()`:** Expandir/recolher sidebar com persistência
- **`toggleTheme()`:** Alternar dark/light com persistência
- **`switchView(viewName)`:** Navegar entre views (dashboard, ferramentas, consultas, instruções)

### `ui-helpers.js`

Componentes reutilizáveis de UI:

- **Toast:** Notificações temporárias (sucesso, erro, info)
- **Confirm Dialog:** Diálogo de confirmação baseado em Promise
- **Loading Overlay:** Tela de carregamento com skeleton loading
- **Status Indicator:** Indicador de origem dos dados (🟢 API / 🟡 localStorage / 🔴 erro)

### `consultas.js`

Base de conhecimento (~1707 linhas):

- **9 tabs/seções:** FAQ, Normas, Protocolos, Piso, Orientações, Listas, Respostas, Nomes, Horas
- **CRUD completo** em cada seção
- **Accordion + paginação** no FAQ (10 itens/página)
- **Filtro por tipo** e **busca textual**
- **Cópia individual e em massa**
- **Persistência:** localStorage + fallback para JSON assets

### `calculator.js`

Calculadora de honorários:

- Fórmula: `(Piso × Horas) ÷ 44` para total
- Valor-hora: `Piso ÷ 220`
- Inputs simples e resultado em tempo real

### `fiscal.js`

Busca de fiscais:

- Carrega planilha ODS via SheetJS
- Filtro por cidade em tempo real
- Auto-seleção quando 1 resultado
- Exibe nome, telefone, município

### `weather.js`

Widget de clima:

- Geolocalização via `navigator.geolocation`
- Geocodificação reversa via Nominatim (OpenStreetMap)
- Base de ~5.570 municípios via API IBGE
- Previsão via Open-Meteo (gratuita, sem chave)
- Seleção manual de cidade com persistência

### `gh-backup.js`

Backup/restore via GitHub API:

- Autenticação por token (permissão `repo`)
- PUT/GET no repositório do usuário
- Suporta migração de formato antigo → multi-dashboard

### `servicos.js`

Modelos de parecer:

- 5 tipos: ingresso-pj, inscricao-pf, contratos, conf-pf, conf-pj
- Textarea editável com persistência
- Cópia via Clipboard API

---

## Backend

### `netlify/functions/api.js`

Netlify Function serverless:

- GET `/api` → retorna estado salvo do Netlify Blobs
- POST `/api` → salva estado no Netlify Blobs
- CORS habilitado para qualquer origem
- Usa `connectLambda` para injetar contexto do Netlify

---

## Persistência

### Camadas de persistência (em ordem de prioridade)

| Camada | Localização | Persistência |
|---|---|---|
| 1. Netlify Blobs | `netlify/functions/api.js` | Persistente (nuvem) |
| 2. localStorage | Navegador | Local ao dispositivo |
| 3. GitHub API | Repositório do usuário | Durável |

### Estratégia de fallback

```
API disponível?
  ├── SIM → Usar dados da API → Salvar em localStorage como cache
  └── NÃO → localStorage disponível?
               ├── SIM → Usar localStorage
               └── NÃO → Estado inicial (dashboards padrão)
```

---

## Segurança

- **Autenticação local:** Senha de 4 dígitos armazenada em localStorage (hash simples)
- **Token GitHub:** Armazenado em localStorage (cliente-side); use token com escopo mínimo (`repo` apenas)
- **CORS:** Configurado para permitir qualquer origem (API pública)

---

## Deploy

| Componente | Plataforma | Configuração |
|---|---|---|
| Frontend + Backend | Netlify | `netlify.toml`, funções serverless |
| CI | GitHub Actions | `.github/workflows/ci.yml` |

---

## Testes

| Tipo | Framework | Localização | Comando |
|---|---|---|---|
| Unitários | Vitest + jsdom | `tests/unit/` | `npm run test:unit` |
| E2E | Playwright | `tests/integration/` | `npm run test:integration` |
| Completo | Ambos | — | `npm test` |

---

## Convenções de Código

- **Namespace:** `window.MainApp` para todos os módulos
- **Padrão IIFE:** `(function(app) { 'use strict'; ... }(window.MainApp))`
- **Storage key:** `baixa_rt_data` (localStorage)
- **IDs de dashboard:** `dash-{timestamp}` para novos, nomes semânticos para padrão
- **IDs de card:** `card-{timestamp}`
- **Formato de data:** `pt-BR` (`dd/mm/aaaa`)
