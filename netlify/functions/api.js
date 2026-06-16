/**
 * Netlify Function — API de persistência
 *
 * GET  /.netlify/functions/api  → retorna o estado salvo
 * POST /.netlify/functions/api  → salva o estado (body JSON)
 *
 * Armazenamento: Netlify Blobs (key-value persistente, sempre online)
 */
const { connectLambda, getStore } = require('@netlify/blobs');

const STORE_NAME = 'workdash-data';
const DATA_KEY = 'state';

exports.handler = async function (event) {
  connectLambda(event);

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  try {
    const store = getStore(STORE_NAME);

    if (event.httpMethod === 'GET') {
      const raw = await store.get(DATA_KEY);
      if (!raw) {
        // Blob vazio — avisa o frontend para usar localStorage
        return { statusCode: 200, headers, body: JSON.stringify({ empty: true }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify(JSON.parse(raw)) };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      if (!body.dashboards) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'dashboards obrigatório' }) };
      }
      body._lastModified = Date.now();
      await store.set(DATA_KEY, JSON.stringify(body));
      return { statusCode: 200, headers, body: JSON.stringify({ saved: true, timestamp: body._lastModified }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não permitido' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
