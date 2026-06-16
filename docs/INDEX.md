# Documentação — WorkDash

Bem-vindo à documentação completa do **WorkDash**, o painel de produtividade para fiscais.

---

## 📖 Documentos Disponíveis

| Documento | Descrição | Público-alvo |
|---|---|---|
| [**Guia do Usuário**](USER_GUIDE.md) | Manual completo de uso do sistema, cobrindo todas as funcionalidades | 👤 Usuários finais |
| [**Arquitetura**](ARCHITECTURE.md) | Visão técnica da arquitetura, stack, módulos e fluxo de dados | 🔧 Desenvolvedores |
| [**API**](API.md) | Documentação dos endpoints do backend | 🔧 Desenvolvedores |
| [**Desenvolvimento**](DEVELOPMENT.md) | Guia de configuração do ambiente de desenvolvimento local | 🔧 Desenvolvedores |
| [**Testes**](TESTING.md) | Guia de execução e criação de testes | 🔧 Desenvolvedores |
| [**S3**](S3.md) | Configuração de backups persistentes no AWS S3 | ⚙️ DevOps |

---

## 🚀 Links Rápidos

- **Repositório:** `https://github.com/laurourbano/baixa`
- **Frontend (produção):** `https://baixaparecer.netlify.app`
- **Backend (produção):** Netlify Functions (integrado ao frontend)
- **README:** [../README.md](../README.md)

---

## 🗂️ Estrutura do Projeto

```
baixa/
├── index.html              # Frontend SPA
├── css/                    # Estilos (Bootstrap + custom)
├── js/                     # Lógica frontend (13 módulos)
├── bridge/                 # Backend Node.js/Express (obsoleto, substituído por Netlify Functions)
├── netlify/
│   └── functions/          # Backend serverless (Netlify Functions)
├── assets/                 # Dados estáticos (JSON, imagens, planilhas)
├── docs/                   # 📚 Documentação (você está aqui)
├── tests/                  # Testes unitários e E2E
├── scripts/                # Scripts auxiliares
└── .github/workflows/      # CI/CD
```

---

## 🎯 Visão Geral do Sistema

O WorkDash é uma **SPA (Single Page Application)** com:

- **Frontend vanilla:** HTML5, CSS3, JavaScript ES6+ com Bootstrap 5.3
- **Backend serverless:** Netlify Functions + Blobs para sincronização
- **Multi-dashboard:** Suporte a múltiplos painéis personalizáveis
- **Base de conhecimento:** FAQ, normas, protocolos e mais com CRUD completo
- **Ferramentas integradas:** Calculadora de honorários, busca de fiscais
- **Widget de clima:** Previsão do tempo via Open-Meteo
- **Sincronização cloud:** Netlify Functions + backup via GitHub API

---

## 📊 Diagrama de Fluxo

```
Usuário ↔ index.html (SPA) ↔ api.js ↔ Netlify Functions ↔ Netlify Blobs
                                  ↕
                            localStorage
                                  ↕
                           GitHub API (backup)
```

---

## 🔐 Primeiro Acesso

- **Senha padrão:** `1234`
- Altere a senha em **Configurações (⚙️) > Alterar Senha**
- Consulte o [Guia do Usuário](USER_GUIDE.md) para instruções detalhadas
