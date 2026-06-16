# ⚡ WorkDash

[![Netlify Status](https://img.shields.io/badge/Netlify-Deploy-00C7B7?style=for-the-badge&logo=netlify)](https://baixaparecer.netlify.app/)
[![Licença MIT](https://img.shields.io/badge/Licença-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Status do Projeto](https://img.shields.io/badge/Status-Ativo-success?style=for-the-badge)](https://baixaparecer.netlify.app/)
[![Node 22](https://img.shields.io/badge/Node-22.x-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)

O **WorkDash** é um painel de produtividade para fiscais, reunindo pareceres, contratos, conferências, busca de fiscais, calculadora e links úteis em um só lugar — com sincronização em nuvem e múltiplos dashboards personalizáveis.

---

## ✨ Funcionalidades Principais

- **🔐 Acesso Protegido**: Camada de segurança por senha (padrão: `1234`), com possibilidade de troca e recuperação.
- **🗂️ Múltiplos Dashboards**: Crie quantos dashboards quiser — cada um com seus próprios cards e organização independente.
- **📋 Cards Inteligentes**: Cards de texto com cópia automática de data, links para URLs externas, PDFs e informativos.
- **⚡ Cópia Inteligente**: Um clique para copiar pareceres formatados com inserção automática de data (`dd/mm/aaaa`).
- **🎨 Interface Moderna**: Temas Dark/Light, sidebar retrátil, drag-and-drop e modais Bootstrap 5.3.
- **🧮 Calculadora de Honorários**: Cálculo rápido de valores baseados em horas de trabalho (`Piso × Horas ÷ 44`).
- **🔍 Busca de Fiscais**: Localização rápida de fiscais por cidade via planilha ODS.
- **📚 Base de Conhecimento**: FAQ, Normas, Protocolos, Piso, Orientações e mais — com CRUD completo e busca textual.
- **📝 Modelos de Parecer**: Templates por tipo de serviço (Ingresso PJ, Inscrição PF, Contratos, Conferências) com cópia fácil.
- **🌤️ Widget de Clima**: Previsão do tempo em tempo real (Open-Meteo) com busca de cidades brasileiras (IBGE).
- **☁️ Sincronização Cloud**: Autosave via Netlify Functions + Netlify Blobs com fallback para localStorage.
- **💾 Backup & Restore**: Backup manual via GitHub API. Backups timestamped.
- **📊 Exportação Excel**: Gere planilhas (.xlsx) com todos os cards de um dashboard.

---

## 🛠️ Tecnologias

- **Frontend**: HTML5 Semântico, CSS3, Vanilla JavaScript (ES6+)
- **UI**: Bootstrap 5.3, Font Awesome 6, Fonte Inter (Google Fonts)
- **Planilhas**: SheetJS (xlsx) — leitura ODS/XLSX e exportação
- **Backend**: Netlify Functions + Netlify Blobs (serverless)
- **Cloud**: Netlify (frontend + backend integrado)
- **Testes**: Vitest + jsdom (unitários), Playwright (E2E)
- **CI/CD**: GitHub Actions

---

## 🚀 Como Executar Localmente

### Pré-requisitos

- [Node.js 22.x](https://nodejs.org/)

### Frontend

```bash
git clone https://github.com/laurourbano/baixa.git
cd baixa
npm install
npm run dev
# Acesse http://localhost:8000
```

### Backend (opcional — para sincronização cloud)

O backend usa Netlify Functions + Netlify Blobs, rodando diretamente na infraestrutura do Netlify — sem necessidade de servidor separado.

```bash
# Para testar localmente com netlify-cli:
netlify dev
# Backend rodando em http://localhost:8888/.netlify/functions/api
```

---

## 📚 Documentação

Documentação completa disponível na pasta [`docs/`](docs/):

| Documento | Conteúdo |
|---|---|
| [📘 Guia do Usuário](docs/USER_GUIDE.md) | Manual completo de uso — dashboards, cards, ferramentas, consultas |
| [🏗️ Arquitetura](docs/ARCHITECTURE.md) | Stack, estrutura, módulos e fluxo de dados |
| [🔌 API](docs/API.md) | Documentação dos endpoints do backend |
| [💻 Desenvolvimento](docs/DEVELOPMENT.md) | Guia do ambiente de desenvolvimento |
| [🧪 Testes](docs/TESTING.md) | Como rodar e criar testes |
| [☁️ S3](docs/S3.md) | Configuração de backups no AWS S3 |

---

## 🌍 Deploy

### Netlify (Frontend + Backend)

1. Conecte seu GitHub na [Netlify](https://netlify.com/).
2. Importe o repositório.
3. Configurações automáticas via `netlify.toml`.
4. As funções serverless (API) são deployadas junto com o frontend.

---

## 📜 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---

<p align="center">Desenvolvido com ❤️ para agilizar processos administrativos.</p>
