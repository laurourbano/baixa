const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3002;
const host = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json());

app.post('/automate', (req, res) => {
    const { local, sit, julgamento, isPendencia } = req.body;
    const psScript = path.join(__dirname, 'automate_sagicon.ps1');

    console.log(`\n[${new Date().toLocaleTimeString()}] >>> Pedido recebido. Tentando disparar PowerShell...`);

    // Comando simplificado usando exec
    const command = `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${psScript}" -local "${local}" -sit "${sit}" -julgamento "${julgamento}" -isPendencia ${isPendencia ? 'true' : 'false'}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`[ERRO DE EXECUÇÃO]: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`[PS ERRO]: ${stderr}`);
            return;
        }
        console.log(`[PS SAÍDA]: ${stdout}`);
    });

    res.json({ success: true });
});

// Dev endpoint: servir dados do backup/local
app.get('/api/data', (req, res) => {
    const dataFile = path.join(__dirname, 'data.json');
    const projectBackup = path.join(__dirname, '..', 'cards_backup.json');

    try {
        if (fs.existsSync(dataFile)) {
            const content = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
            return res.json(content);
        }

        if (fs.existsSync(projectBackup)) {
            const content = JSON.parse(fs.readFileSync(projectBackup, 'utf8'));
            return res.json(content);
        }

        return res.json({ order: [], customs: [], edits: {}, deleted: [] });
    } catch (err) {
        console.error('[ERRO /api/data]:', err);
        return res.status(500).json({ error: 'Erro ao ler dados' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ success: true, service: 'baixa-backend', dataFile: fs.existsSync(path.join(__dirname, 'data.json')), projectBackup: fs.existsSync(path.join(__dirname, '..', 'cards_backup.json')) });
});

app.listen(port, host, () => {
    console.log(`\n=========================================`);
    console.log(` PONTE ON-LINE NA PORTA ${port}`);
    console.log(`=========================================\n`);
});
