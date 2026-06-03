# Guia do Usuário — WorkDash

Bem-vindo ao **WorkDash**, o painel de produtividade para fiscais. Este guia cobre todas as funcionalidades disponíveis.

---

## Sumário

1. [Primeiro Acesso](#primeiro-acesso)
2. [Visão Geral da Interface](#visão-geral-da-interface)
3. [Dashboards](#dashboards)
   - [Navegação entre Dashboards](#navegação-entre-dashboards)
   - [Criar um Novo Dashboard](#criar-um-novo-dashboard)
   - [Renomear Dashboard](#renomear-dashboard)
   - [Excluir Dashboard](#excluir-dashboard)
   - [Reordenar Dashboards](#reordenar-dashboards)
   - [Ordenar A-Z](#ordenar-a-z)
4. [Cards (Pareceres, Links, PDFs, Informativos)](#cards)
   - [Tipos de Card](#tipos-de-card)
   - [Criar um Card](#criar-um-card)
   - [Editar um Card](#editar-um-card)
   - [Excluir um Card](#excluir-um-card)
   - [Copiar Conteúdo](#copiar-conteúdo)
   - [Reordenar Cards (Drag & Drop)](#reordenar-cards-drag--drop)
5. [Ferramentas](#ferramentas)
   - [Calculadora de Honorários](#calculadora-de-honorários)
   - [Busca de Fiscais](#busca-de-fiscais)
6. [Consultas (Base de Conhecimento)](#consultas)
   - [FAQ](#faq)
   - [Normas](#normas)
   - [Protocolos](#protocolos)
   - [Piso](#piso)
   - [Orientações](#orientações)
   - [Listas](#listas)
   - [Respostas Padrão](#respostas-padrão)
   - [Nomes Empresariais](#nomes-empresariais)
   - [Cálculo de Horas](#cálculo-de-horas)
7. [Modelos de Parecer (Serviços)](#modelos-de-parecer)
8. [Widget de Clima](#widget-de-clima)
9. [Configurações](#configurações)
   - [Tema (Dark/Light)](#tema)
   - [Alterar Senha](#alterar-senha)
   - [Recuperar Senha](#recuperar-senha)
10. [Sincronização e Backup](#sincronização-e-backup)
    - [Backup via GitHub](#backup-via-github)
    - [Restauração via GitHub](#restauração-via-github)
    - [Sincronização Automática (Cloud)](#sincronização-automática-cloud)
11. [Exportação Excel](#exportação-excel)
12. [Dicas e Atalhos](#dicas-e-atalhos)

---

## Primeiro Acesso

Ao abrir o WorkDash, você verá a tela de login.

- **Senha padrão:** `1234`
- Digite a senha e clique em **Entrar**.

> 💡 **Dica:** Altere a senha padrão após o primeiro acesso em **Configurações > Alterar Senha**.

---

## Visão Geral da Interface

A interface do WorkDash é dividida em três áreas principais:

```
┌──────────┐  ┌─────────────────────────────────────────┐
│          │  │  [Cabeçalho]   WorkDash   🌙  ⚙️        │
│  Sidebar │  ├─────────────────────────────────────────┤
│          │  │                                         │
│  📋 Dash │  │     Área de Conteúdo                    │
│  📋 Dash │  │     (Cards / Ferramentas / Consultas)   │
│  📋 Dash │  │                                         │
│  ─────── │  │                                         │
│  🔧 Ferr │  │                                         │
│  📚 Cons │  │                                         │
│          │  │                                         │
└──────────┘  └─────────────────────────────────────────┘
```

1. **Sidebar** (esquerda): Lista de dashboards e links para Ferramentas e Consultas. Pode ser expandida/recolhida.
2. **Cabeçalho** (topo): Nome do dashboard ativo, botão de adicionar card, alternador de tema e engrenagem de configurações.
3. **Área de Conteúdo** (centro): Onde os cards, ferramentas ou consultas são exibidos.

---

## Dashboards

O WorkDash suporta **múltiplos dashboards** — cada um com seus próprios cards e organização independente.

### Navegação entre Dashboards

Clique no nome de qualquer dashboard na sidebar para alternar entre eles. O dashboard ativo fica destacado.

**Dashboards padrão pré-criados:**

| Dashboard | Ícone | Finalidade |
|---|---|---|
| Dashboard de Pareceres | 📄 | Pareceres gerais |
| Ingresso PJ | 🚪 | Ingresso de Pessoa Jurídica |
| Inscrição PF | 🪪 | Inscrição de Pessoa Física |
| Controle de Contratos | 📝 | Gestão de contratos |
| Conferência PF | ✅ | Conferência de Pessoa Física |
| Conferência PJ | ✅ | Conferência de Pessoa Jurídica |

### Criar um Novo Dashboard

1. Passe o mouse sobre a seção **DASHBOARDS** na sidebar.
2. Clique no botão **`+`** que aparece.
3. No modal:
   - **Nome:** Digite um nome descritivo (ex.: "Baixa de Ofício").
   - **Ícone:** Escolha entre 24 ícones disponíveis. O sistema sugere automaticamente um ícone baseado no nome.
4. Clique em **Criar**.

### Renomear Dashboard

1. Passe o mouse sobre o dashboard desejado na sidebar.
2. Clique no ícone de lápis **✎** que aparece.
3. Altere o nome e/ou ícone.
4. Clique em **Salvar**.

### Excluir Dashboard

1. Passe o mouse sobre o dashboard desejado.
2. Clique no ícone de lixeira **🗑**.
3. Confirme a exclusão no diálogo.

> ⚠️ **Atenção:** Não é possível excluir o último dashboard restante. É necessário manter pelo menos um.

### Reordenar Dashboards

- **Modo manual:** Arraste o ícone **⠿** (handle) de um dashboard para cima ou para baixo na sidebar.
- **Modo A-Z:** Clique no botão **⇅** ao lado do título "DASHBOARDS" para alternar entre ordem manual e alfabética.

### Ordenar A-Z

Quando o modo alfabético está ativo, os dashboards são ordenados automaticamente por nome (ordem alfabética em português). O ícone de ordenação muda para indicar o modo ativo.

---

## Cards

Os cards são os elementos principais de cada dashboard. Existem 4 tipos de cards.

### Tipos de Card

| Tipo | Ícone | Comportamento |
|---|---|---|
| **Texto (Copy)** | 📋 | Cópia de texto com data automática. Clique no card para copiar. |
| **Link** | 🔗 | Abre uma URL externa em nova aba. |
| **PDF** | 📕 | Abre um arquivo PDF em nova aba. |
| **Informativo** | ℹ️ | Apenas exibe informação, sem ação de cópia ou link. |

### Criar um Card

1. Clique no botão **`+`** no cabeçalho.
2. No modal, preencha:
   - **Título:** Nome descritivo do card (ex.: "Parecer - Ausência de Recolhimento").
   - **Tipo:** Selecione entre Texto, Link, PDF ou Informativo.
   - **Cor:** Escolha uma das 8 cores disponíveis (borda do card).
   - **Conteúdo:** O texto do parecer (para tipo Texto/Informativo) ou a descrição (para Link/PDF).
   - **Link:** URL do link ou PDF (apenas para tipos Link e PDF).
   - **Local / Situação / Julgamento:** Campos opcionais exibidos como metadados abaixo do título.
   - **Mostrar data:** Ativar/desativar a inclusão automática da data no texto copiado. Padrão: ativado.
   - **Template [00/00/0000]:** Use o placeholder `[00/00/0000]` no conteúdo — ele será substituído pela data atual ao copiar.
3. Clique em **Salvar**.

### Editar um Card

1. Clique no ícone de lápis **✎** no canto superior direito do card.
2. Altere os campos desejados.
3. Clique em **Salvar**.

### Excluir um Card

1. Clique no ícone de lixeira **🗑** no canto superior direito do card.
2. Confirme a exclusão.

### Copiar Conteúdo

- **Cards de texto:** Clique em qualquer parte do card para copiar o conteúdo para a área de transferência.
  - O card pisca brevemente em destaque para confirmar a cópia.
  - Você também pode clicar no botão **📋** no canto inferior direito do card.
- **Formato da cópia:** `dd/mm/aaaa - texto do parecer` (a data é inserida automaticamente).
- **Placeholder `[00/00/0000]`:** Se o conteúdo contiver este marcador, ele será substituído pela data atual.

### Reordenar Cards (Drag & Drop)

Arraste o ícone **⠿** (handle) no canto superior esquerdo de um card para reposicioná-lo no grid. A nova ordem é salva automaticamente.

---

## Ferramentas

Acesse clicando em **Ferramentas** na sidebar.

### Calculadora de Honorários

Calcula o valor proporcional de honorários com base no piso salarial.

1. Insira o valor do **Piso** (piso salarial de referência).
2. Insira a quantidade de **Horas** trabalhadas.
3. O resultado mostra:
   - **Total:** `(Piso × Horas) ÷ 44`
   - **Valor-Hora:** `Piso ÷ 220`

> 💡 Use para calcular rapidamente honorários proporcionais em pareceres e processos.

### Busca de Fiscais

Localiza fiscais por cidade utilizando uma base de dados em planilha (ODS/XLSX).

1. Digite o nome da **cidade** no campo de busca.
2. A busca é feita em tempo real conforme você digita.
3. Se houver apenas **1 resultado**, ele é selecionado automaticamente.
4. Se houver **múltiplos resultados**, eles são listados para seleção manual.
5. Os resultados mostram: nome do fiscal, município e telefone.

> 📊 A base de dados é carregada do arquivo `assets/dados.ods`.

---

## Consultas

Acesse clicando em **Consultas** na sidebar. A base de conhecimento é organizada em 9 abas, cada uma com suporte a **CRUD completo** (adicionar, editar, excluir itens).

### Funcionalidades comuns a todas as abas

- **Busca textual:** Campo de busca que filtra os itens em tempo real.
- **Filtro por tipo:** Dropdown para filtrar por categoria (quando aplicável).
- **Cópia individual:** Botão 📋 em cada item para copiar o texto.
- **Cópia em massa:** Botão para copiar todos os itens visíveis de uma vez.
- **Adicionar:** Botão **+** para criar novo item.
- **Editar:** Ícone de lápis em cada item.
- **Excluir:** Ícone de lixeira em cada item.
- **Persistência:** Dados salvos em localStorage, com fallback para os arquivos JSON em `assets/`.

### FAQ

Perguntas e respostas frequentes organizadas em accordion (sanfonas) com paginação.

- Itens agrupados por categoria/tipo.
- Clique na pergunta para expandir a resposta.
- Paginação de 10 itens por página.

### Normas

Legislação e normas de referência. Dados carregados de `assets/normas.json`.

### Protocolos

Protocolos e procedimentos organizados em duas fontes:
- **Protocolos Base:** `assets/protocolos-base.json`
- **Protocolos Detalhados:** `assets/protocolos-detalhados.json`

### Piso

Tabela de valores de piso salarial. Dados carregados de `assets/piso.json` e `assets/piso-ref.json`.

### Orientações

Orientações e diretrizes gerais. Dados de `assets/orientacoes.json`.

### Listas

Listas de referência diversas. Dados de `assets/listas.json`.

### Respostas Padrão

Modelos de respostas prontas para uso. Dados de `assets/respostas.json` e `assets/respostas-padrao.json`.

### Nomes Empresariais

Lista de nomes empresariais de referência. Dados de `assets/nomes-empresariais.json`.

### Cálculo de Horas

Referências para cálculo de horas. Dados de `assets/calc-horas.json`.

---

## Modelos de Parecer

Acessíveis pela sidebar com o ícone 📝, os modelos de parecer são templates para 5 tipos de serviço:

| Serviço | Finalidade |
|---|---|
| Ingresso PJ | Modelo de parecer para ingresso de Pessoa Jurídica |
| Inscrição PF | Modelo de parecer para inscrição de Pessoa Física |
| Contratos | Modelo para controle de contratos |
| Conferência PF | Modelo para conferência de Pessoa Física |
| Conferência PJ | Modelo para conferência de Pessoa Jurídica |

Cada modelo possui:
- **Textarea editável** para o texto do parecer.
- **Botão de cópia** para copiar o texto para a área de transferência.
- **Persistência** em localStorage — suas edições são salvas automaticamente.

---

## Widget de Clima

O WorkDash inclui um widget de clima que exibe a previsão do tempo.

- **Localização automática:** Ao carregar, tenta obter sua localização via GPS do navegador.
- **Busca manual:** Você pode buscar qualquer cidade brasileira (base de ~5.570 municípios via API do IBGE).
- **Dados exibidos:** Temperatura atual, máxima e mínima do dia, e ícone representativo da condição climática.
- **Fonte dos dados:** [Open-Meteo](https://open-meteo.com/) (API gratuita, sem chave).
- **Geocodificação reversa:** [Nominatim](https://nominatim.org/) (OpenStreetMap).
- **Persistência:** A cidade selecionada manualmente é salva em localStorage.

---

## Configurações

Acesse clicando no ícone ⚙️ no cabeçalho.

### Tema

Alterne entre tema **escuro** (padrão) e **claro**:

1. Clique no ícone 🌙/☀️ no cabeçalho, ou
2. No modal de configurações, selecione o tema desejado.
3. A preferência é salva em localStorage e persiste entre sessões.

### Alterar Senha

1. Abra **Configurações** (⚙️).
2. Clique em **Alterar Senha**.
3. Digite a senha atual.
4. Digite a nova senha (4 dígitos).
5. Confirme a nova senha.
6. Clique em **Salvar**.

### Recuperar Senha

Caso esqueça a senha:

1. Na tela de login, clique em **"Esqueceu a senha?"**.
2. Será exibido um lembrete com uma dica configurada.

---

## Sincronização e Backup

### Backup via GitHub

O WorkDash permite fazer backup dos seus dados em um repositório privado do GitHub:

1. Abra **Configurações** (⚙️).
2. Vá para a seção **Backup**.
3. Configure seu **Token do GitHub** (com permissão `repo`).
4. Informe o **nome do repositório** (ex.: `usuario/meu-backup`).
5. Clique em **Fazer Backup**.
6. O estado completo (todos os dashboards, cards e configurações) é enviado para o GitHub.

### Restauração via GitHub

1. Em **Configurações > Backup**, clique em **Restaurar**.
2. Selecione o backup desejado da lista.
3. Confirme a restauração — seus dados atuais serão substituídos.

### Sincronização Automática (Cloud)

O WorkDash está integrado a um backend na nuvem (Render) que sincroniza dados entre dispositivos:

- **Autosave:** Alterações nos cards são salvas automaticamente no servidor.
- **Cold-start:** O backend no Render pode hibernar; o frontend faz retry automático (3 tentativas com backoff exponencial).
- **Fallback:** Se o backend estiver indisponível, os dados são salvos localmente em localStorage.
- **Indicador de status:** Um ícone no cabeçalho mostra a origem dos dados:
  - 🟢 **API:** Dados carregados do servidor.
  - 🟡 **localStorage:** Usando dados locais (servidor indisponível).
  - 🔴 **Erro:** Falha na comunicação.

---

## Exportação Excel

Exporte todos os cards de um dashboard para uma planilha Excel (.xlsx):

1. No dashboard desejado, clique no botão **📊 Exportar**.
2. Um arquivo `.xlsx` é gerado e baixado automaticamente.
3. O arquivo contém: título, tipo, conteúdo, link, local, situação e julgamento de cada card.

---

## Dicas e Atalhos

| Ação | Como fazer |
|---|---|
| Copiar card | Clique no card |
| Mover card | Arraste o handle ⠿ |
| Mover dashboard | Arraste o handle ⠿ na sidebar |
| Alternar tema | Clique em 🌙/☀️ no cabeçalho |
| Recolher sidebar | Clique no botão ☰ no topo da sidebar |
| Forçar backup | Vá em Configurações > Backup |
| Buscar em consultas | Use o campo de busca na aba desejada |
| Copiar tudo | Use o botão de cópia em massa nas consultas |

---

## Suporte

Para dúvidas, problemas ou sugestões, abra uma issue no repositório do projeto.

---

<p align="center">WorkDash — Produtividade simplificada para fiscais ⚡</p>
