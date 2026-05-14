const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3002;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper para ler dados
const readData = () => {
    if (!fs.existsSync(DATA_FILE)) {
        return {
            order: [],
            customs: [],
            edits: {},
            deleted: []
        };
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
};

// Endpoints de Persistência
app.get('/api/data', (req, res) => {
    try {
        const data = readData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao ler dados' });
    }
});

app.post('/api/data', (req, res) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao salvar dados' });
    }
});

app.post('/automate', (req, res) => {
    const { local, sit, julgamento, isPendencia } = req.body;
    const psScript = path.join(__dirname, 'automate_sagicon.ps1');

    console.log(`\n[${new Date().toLocaleTimeString()}] >>> Pedido recebido. Tentando disparar PowerShell...`);

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

app.listen(port, '0.0.0.0', () => {
    console.log(`\n=========================================`);
    console.log(` PONTE ON-LINE NA PORTA ${port}`);
    console.log(`=========================================\n`);
});

