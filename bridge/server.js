/**
 * server.js — Bootstrap do servidor Express
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const { registerRoutes } = require('./routes');

const app = express();
const port = process.env.PORT || 3002;

// Inicializa schema do banco
db.initSchema();

// Middleware
app.use(cors());
app.use(express.json());

// Rotas da API
registerRoutes(app);

// Serve arquivos estáticos (frontend)
const PUBLIC_DIR = path.join(__dirname, '..');
app.use(express.static(PUBLIC_DIR));
app.get('/', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

// Inicia servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`\n=========================================`);
  console.log(` PONTE ON-LINE NA PORTA http://localhost:${port}`);
  console.log(` SQLite: ${db.getDb().name}`);
  console.log(`=========================================\n`);
});
