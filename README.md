# 🏛️ Portal de Pareceres - Baixa RT

[![Vercel Deploy](https://img.shields.io/badge/Vercel-Deploy-000?style=for-the-badge&logo=vercel)](https://vercel.com/)
[![Licença MIT](https://img.shields.io/badge/Licença-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Status do Projeto](https://img.shields.io/badge/Status-Ativo-success?style=for-the-badge)](https://baixaparecer.netlify.app/)

O **Portal de Pareceres - Baixa RT** é uma solução centralizada e inteligente desenvolvida para otimizar o fluxo de trabalho jurídico-administrativo. A ferramenta permite a gestão dinâmica de modelos de pareceres, cálculos automatizados e sincronização em nuvem, garantindo agilidade e precisão nas atividades diárias.

---

## 📸 Demonstração

![Captura Real do Portal](file:///C:/Users/lauro.urbano/.gemini/antigravity/brain/06a10fc0-71dc-4bda-b189-4f6367a77571/app_initial_state_1777290417176.png)

> [!NOTE]
> O design foi projetado para ser intuitivo, com foco na produtividade e no conforto visual (Dark Mode).

---

## ✨ Funcionalidades Principais

- **🔐 Acesso Protegido**: Camada de segurança por senha (Padrão: `1234`) para proteger seus modelos.
- **⚡ Cópia Inteligente**: Botões de um clique para copiar pareceres pré-formatados com inserção automática de data.
- **🗂️ Gestão Dinâmica (CRUD)**: Adicione, edite e remova cards de pareceres, links externos ou PDFs diretamente pela interface.
- **🧮 Calculadora de Piso**: Ferramenta integrada para cálculo rápido de valores baseados em horas de trabalho.
- **🔍 Busca de Fiscal**: Localização rápida de fiscais por cidade.
- **☁️ Sincronização Cloud**: Backup e restauração via GitHub API para nunca perder seus dados.
- **📊 Exportação**: Gere relatórios em Excel (.xlsx) de todos os seus pareceres cadastrados.

---

## 🛠️ Tecnologias Utilizadas

O projeto utiliza uma stack leve e performática, focada em zero dependências pesadas de backend:

- **Frontend**: HTML5 Semântico, CSS3 (Bootstrap 5.3 + Custom CSS)
- **Lógica**: Vanilla JavaScript (ES6+)
- **Bibliotecas**:
  - [Font Awesome 6](https://fontawesome.com/) (Ícones)
  - [SheetJS](https://sheetjs.com/) (Exportação Excel)
  - [Bootstrap 5.3](https://getbootstrap.com/) (UI/UX)

---

## 🚀 Como Executar Localmente

1. **Clone o repositório**:

   ```bash
   git clone https://github.com/laurourbano/baixa.git
   ```

2. **Entre na pasta**:

   ```bash
   cd baixa
   ```

3. **Abra o arquivo**:
   Basta abrir o `index.html` em qualquer navegador moderno.

---

## 🌍 Deploy na Vercel

Para hospedar este projeto na Vercel de forma gratuita e profissional:

1. **Conecte seu GitHub** na [Vercel](https://vercel.com/).
2. **Importe o repositório** `baixa`.
3. **Configurações**:
   - Build Command: (Deixe em branco ou `npm run build` se houver)
   - Output Directory: `.` (Diretório raiz)
4. **Pronto!** A Vercel fornecerá um link `.vercel.app` com SSL automático.

---

## 📜 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---

<p align="center">Desenvolvido com ❤️ para agilizar processos administrativos.</p>
