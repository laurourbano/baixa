/**
 * routes.js — Rotas da API
 */
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const db = require('./db');

// S3 (opcional)
let s3Client = null;
let S3Bucket = process.env.S3_BUCKET_NAME || process.env.S3_BUCKET;

try {
  if (S3Bucket) {
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    s3Client = new S3Client({ region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION });
    global.__PutObjectCommand = PutObjectCommand;
  }
} catch (e) {
  console.warn('AWS SDK not configured:', e.message);
}

function uploadToS3(key, body) {
  if (s3Client && S3Bucket) {
    const PutObjectCommand = global.__PutObjectCommand;
    s3Client.send(new PutObjectCommand({
      Bucket: S3Bucket,
      Key: key,
      Body: body,
      ContentType: 'application/json'
    }))
      .then(() => console.log('[S3] Upload OK:', key))
      .catch(err => console.error('[S3] Upload falhou:', err.message));
  }
}

/* ── Validação ──────────────────────────── */
function validateDataPayload(body) {
  if (!body || typeof body !== 'object') return 'Payload deve ser um objeto JSON';

  // Novo formato (multi-dashboard)
  if (body.dashboards) {
    if (!Array.isArray(body.dashboards)) return 'dashboards deve ser um array';
    return null;
  }

  // Formato antigo (compatibilidade)
  if (body.order && !Array.isArray(body.order)) return 'order deve ser um array';
  if (body.customs && !Array.isArray(body.customs)) return 'customs deve ser um array';
  if (body.deleted && !Array.isArray(body.deleted)) return 'deleted deve ser um array';
  if (body.edits && typeof body.edits !== 'object') return 'edits deve ser um objeto';

  return null;
}

/* ── Helpers ───────────────────────────── */
function updateLocalDataFile(payload) {
  const dataPath = path.join(__dirname, 'data.json');
  try {
    fs.writeFileSync(dataPath, payload, 'utf8');
    console.log('[data.json] Atualizado em disco');
  } catch (err) {
    console.error('[data.json] Erro ao atualizar:', err.message);
  }
}

/* ── Rotas ──────────────────────────────── */
function registerRoutes(app) {
  /* POST /automate */
  app.post('/automate', (req, res) => {
    const { local, sit, julgamento, isPendencia } = req.body;
    const psScript = path.join(__dirname, 'automate_sagicon.ps1');

    console.log(`\n[${new Date().toLocaleTimeString()}] >>> Pedido recebido. Disparando PowerShell...`);

    const command =
      `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${psScript}"` +
      ` -local "${local}" -sit "${sit}" -julgamento "${julgamento}"` +
      ` -isPendencia ${isPendencia ? 'true' : 'false'}`;

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

  /* POST /api/backup */
  app.post('/api/backup', (req, res) => {
    const err = validateDataPayload(req.body);
    if (err) return res.status(400).json({ error: err });

    const payload = JSON.stringify(req.body, null, 2);
    const ts = new Date();
    const isoStr = ts.toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${isoStr}.json`;

    try {
      db.saveState(payload, ts.toISOString());
      db.insertBackup(backupName, payload, ts.toISOString());
      updateLocalDataFile(payload);
      uploadToS3(`backups/${backupName}`, payload);
      return res.json({ success: true, dataFile: 'baixa.db', backup: backupName });
    } catch (err) {
      console.error('[ERRO /api/backup]:', err);
      return res.status(500).json({ error: 'Erro ao salvar backup', detail: err.message });
    }
  });

  /* POST /api/save */
  app.post('/api/save', (req, res) => {
    const err = validateDataPayload(req.body);
    if (err) return res.status(400).json({ error: err });

    const payload = JSON.stringify(req.body, null, 2);
    const ts = new Date();
    const isoStr = ts.toISOString().replace(/[:.]/g, '-');
    const backupName = `save-${isoStr}.json`;

    try {
      db.saveState(payload, ts.toISOString());
      db.insertBackup(backupName, payload, ts.toISOString());
      updateLocalDataFile(payload);
      uploadToS3(`backups/${backupName}`, payload);
      return res.json({ success: true, saved: 'baixa.db', backup: backupName });
    } catch (err) {
      console.error('[ERRO /api/save]:', err);
      return res.status(500).json({ error: 'Erro ao salvar data', detail: err.message });
    }
  });

  /* GET /api/backups */
  app.get('/api/backups', (_req, res) => {
    try {
      const rows = db.getAllBackups();
      return res.json({ backups: rows.map(r => r.name) });
    } catch (err) {
      console.error('[ERRO /api/backups]:', err);
      return res.status(500).json({ error: 'Erro ao listar backups' });
    }
  });

  /* GET /api/backup/:name */
  app.get('/api/backup/:name', (req, res) => {
    const name = req.params.name;
    try {
      const data = db.getBackupByName(name);
      if (!data) return res.status(404).json({ error: 'Backup não encontrado' });
      return res.json(JSON.parse(data));
    } catch (err) {
      console.error('[ERRO /api/backup/:name]:', err);
      return res.status(500).json({ error: 'Erro ao ler backup' });
    }
  });

  /* GET /api/data */
  app.get('/api/data', (_req, res) => {
    try {
      const data = db.getState();
      if (data) {
        return res.json(JSON.parse(data));
      }

      // Fallbacks
      const projectBackup = path.join(__dirname, '..', 'cards_backup.json');
      if (fs.existsSync(projectBackup)) {
        const content = fs.readFileSync(projectBackup, 'utf8');
        return res.json(JSON.parse(content));
      }

      const bridgeData = path.join(__dirname, 'data.json');
      if (fs.existsSync(bridgeData)) {
        const content = fs.readFileSync(bridgeData, 'utf8');
        return res.json(JSON.parse(content));
      }

      return res.json({ order: [], customs: [], edits: {}, deleted: [] });
    } catch (err) {
      console.error('[ERRO /api/data]:', err);
      return res.status(500).json({ error: 'Erro ao carregar dados' });
    }
  });

  /* GET /api/health */
  app.get('/api/health', (_req, res) => {
    try {
      const state = db.getState();
      return res.json({
        success: true,
        service: 'baixa-backend',
        database: 'SQLite (baixa.db)',
        hasState: !!state
      });
    } catch (err) {
      return res.json({
        success: true,
        service: 'baixa-backend',
        database: 'SQLite (baixa.db)',
        error: err.message
      });
    }
  });
}

module.exports = { registerRoutes };
