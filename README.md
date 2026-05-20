# 🏛️ Portal de Pareceres - Baixa RT

[![Vercel Deploy](https://img.shields.io/badge/Vercel-Deploy-000?style=for-the-badge&logo=vercel)](https://vercel.com/)
[![Licença MIT](https://img.shields.io/badge/Licença-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Status do Projeto](https://img.shields.io/badge/Status-Ativo-success?style=for-the-badge)](https://baixaparecer.netlify.app/)

O **Portal de Pareceres - Baixa RT** é uma solução centralizada e inteligente desenvolvida para otimizar o fluxo de trabalho jurídico-administrativo. A ferramenta permite a gestão dinâmica de modelos de pareceres, cálculos automatizados e sincronização em nuvem, garantindo agilidade e precisão nas atividades diárias.

---

## 📸 Demonstração

## 📸 Demonstração

- **Screenshot (interface principal)**

   ![Screenshot do Portal](assets/img/screenshots/screenshot-1.png)

- **GIF de demonstração (exemplo)**

   ![Demo GIF](assets/img/screenshots/demo.gif)

> Nota: os arquivos acima são placeholders — substitua por capturas reais em `assets/img/screenshots/`.

### Como capturar screenshots / GIFs rapidamente

- Abrir a aplicação localmente (ex.: via `python -m http.server 8000` ou abrindo `index.html`).
- Para captura de tela estática use a ferramenta nativa do seu sistema (Snipping Tool, macOS Screenshot, etc.).
- Para GIFs simples (Linux/Windows/macOS) você pode gravar a tela com `ffmpeg` e converter:

```bash
# Gravar janela (Windows exemplo com gdigrab) - ajuste o título da janela
ffmpeg -f gdigrab -framerate 15 -i title="Portal de Pareceres - Baixa RT" -video_size 1280x720 demo.mp4
# Converter para GIF otimizado
ffmpeg -i demo.mp4 -vf "fps=15,scale=800:-1:flags=lanczos" -gifflags +transdiff -y demo.gif
```

Coloque `screenshot-1.png` e `demo.gif` em `assets/img/screenshots/` e o README exibirá as imagens.

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

## 📚 Documentação Detalhada

Para documentação completa do projeto (arquitetura, API, deploy, desenvolvimento e testes), veja a pasta `docs/`:

- [Arquitetura](docs/ARCHITECTURE.md)
- [API](docs/API.md)
- [Deploy no Render](docs/DEPLOY_RENDER.md)
- [Desenvolvimento](docs/DEVELOPMENT.md)
- [Testes](docs/TESTING.md)

### Servir localmente (dev)

Para servir o frontend localmente via `npm`:

```bash
npm install
npm run dev
# acesse http://localhost:8000
```

### Backups persistentes (S3)

O backend suporta envio de backups para S3 quando as variáveis de ambiente estiverem configuradas:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` ou `AWS_DEFAULT_REGION`
- `S3_BUCKET_NAME` (ou `S3_BUCKET`)

Veja `docs/S3.md` para detalhes.

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
