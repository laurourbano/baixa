/**
 * extract-excel-v3.js — Extração ULTRA-completa de todas as abas da planilha.
 * Gera JSONs para cada seção do portal de Consultas.
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const wb = XLSX.readFile(path.join(__dirname, '..', 'assets', 'Cópia de Thais v4..xlsx'));
const outDir = path.join(__dirname, '..', 'assets');
const out = (name, data) => { fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2)); console.log('  ' + name + ': ' + (Array.isArray(data) ? data.length : 'object') + ' itens'); };

console.log('=== Extraindo dados da planilha ===\n');

// ── NORMAS ──
const rawN = XLSX.utils.sheet_to_json(wb.Sheets['NORMAS'], { header: 1 });
const normas = rawN.slice(2).filter(r => r[1] && r[1] !== 'NORMA').map(r => ({
  norma: (r[1] || '').trim(), orgao: (r[2] || '').trim(), link: (r[3] || '').trim(), assunto: (r[4] || '').trim()
}));
out('normas.json', normas);

// ── FAQ (RESPOSTAS) ──
const rawR = XLSX.utils.sheet_to_json(wb.Sheets['RESPOSTAS'], { header: 1 });
const faq = rawR.slice(1).filter(r => r[0] && r[1]).map(r => ({
  tipo: (r[0] || '').trim(), pergunta: (r[1] || '').trim(), resposta: (r[2] || '').trim(), complemento: (r[3] || '').trim()
}));
out('faq.json', faq);

// ── PROTOCOLOS BASE ──
const rawB = XLSX.utils.sheet_to_json(wb.Sheets['Base protocolos'], { header: 1 });
const protoBase = rawB.filter(r => r[0]).map(r => ({
  protocolo: (r[0] || '').trim(), status: (r[2] || '').trim(), estabelecimento: (r[4] || '').trim()
}));
out('protocolos-base.json', protoBase);

// ── PROTOCOLOS DETALHADOS (527 registros!) ──
const rawP = XLSX.utils.sheet_to_json(wb.Sheets['PROTOCOLOS'], { header: 1 });
const protoDetalhados = rawP.slice(1).filter(r => r[0] || r[1] || r[3]).map(r => ({
  situacao: (r[0] || '').toString().trim(),
  numProtocolo: (r[1] || '').toString().trim(),
  data: typeof r[2] === 'number' ? excelDateToISO(r[2]) : (r[2] || '').toString().trim(),
  tipoEstabelecimento: (r[3] || '').toString().trim(),
  inscricao: (r[4] || '').toString().trim(),
  nomeEstabelecimento: (r[5] || '').toString().trim(),
  obs: (r[6] || '').toString().trim(),
  ocorrencia: (r[7] || '').toString().trim()
}));
out('protocolos-detalhados.json', protoDetalhados);

// ── ORIENTAÇÕES (documentos + situações) ──
const rawO = XLSX.utils.sheet_to_json(wb.Sheets['ORIENTAÇÕES'], { header: 1 });
const orientacoes = { documentos: [], situacoes: [], checklist: [] };
let currentSection = '';
for (let i = 0; i < rawO.length; i++) {
  const r = rawO[i];
  const val = (r[3] || '').trim();
  if (!val) continue;
  if (/^documentos$/i.test(val)) { currentSection = 'documentos'; continue; }
  if (/^situa[cç][oõ]es\s*espec[ií]ficas/i.test(val)) { currentSection = 'situacoes'; continue; }
  if (/^lan[cç]amentos\s+no\s+sagicon/i.test(val)) { currentSection = 'checklist'; continue; }
  if (/^\*$/.test(val) || /^requerimento\s+do\s+estabelecimento/i.test(val)) continue;
  // Pula linhas que são cabeçalhos de seção (SITUAÇÕES ESPECÍFICAS, POSTO DE COLETA, etc.)
  if (/^situa[cç][oõ]es/i.test(val) || /^posto\s+de\s+coleta/i.test(val)) continue;
  if (currentSection && orientacoes[currentSection]) {
    orientacoes[currentSection].push(val);
  }
}
out('orientacoes.json', orientacoes);

// ── RESPOSTAS PADRÃO (extração completa com suporte a múltiplas entradas) ──
const rpSheet = wb.Sheets['RESPOSTAS PADRÃO'];
// Lê todas as células individualmente para capturar dados de colunas não lineares
const rpCells = {};
Object.keys(rpSheet).forEach(function (cell) {
  if (cell === '!ref' || cell === '!merges' || cell === '!type') return;
  var v = rpSheet[cell];
  if (v && v.v !== undefined && String(v.v).trim()) {
    var addr = XLSX.utils.decode_cell(cell);
    if (!rpCells[addr.r]) rpCells[addr.r] = {};
    rpCells[addr.r][addr.c] = String(v.v).trim();
  }
});
// Também lê via header:1 para não perder estrutura de colunas
const rawRP = XLSX.utils.sheet_to_json(rpSheet, { header: 1 });
const respostasPadrao = {};
let currentTitle = '';
let currentLines = [];

function isHeaderOrLabel(val) {
  var v = val.toLowerCase();
  return v === 'resposta padrão:' || v === 'resposta padrão' ||
         v.startsWith('(copiar') || /^respostas?\s+padr[ãa]o/i.test(val);
}

for (let i = 0; i < rawRP.length; i++) {
  var r = rawRP[i];
  var col1 = (r[0] || '').toString().trim();
  var col2 = (r[1] || '').toString().trim();
  // Também verifica coluna 0 (algumas entradas podem estar lá)
  var candidate = col2 || col1;
  
  if (!candidate) {
    // Linha vazia após acumular texto → finaliza entrada
    if (currentTitle && currentLines.length) {
      respostasPadrao[currentTitle] = currentLines.join('\n').trim();
      currentTitle = ''; currentLines = [];
    }
    continue;
  }

  if (isHeaderOrLabel(candidate)) continue;

  // Detecta se é um título de resposta (maiúsculas, termina com ':' ou parece nome de categoria)
  var isTitle = !currentTitle && (
    candidate === candidate.toUpperCase() ||
    /^(ARQUIVAMENTO|ASSINATURA|CANCELAMENTO|CARGA HORÁRIA|DAP |DECLAROU|DOCUMENTOS|FORMULÁRIOS|HABILITAÇÕES|INDEFERIMENTO|PROTOCOLOS?|REGISTRO|RESPOSTAS?|SALÁRIO|SEM |SOLICITAÇÃO|TRANSFERÊNCIAS|VÍNCULO)/i.test(candidate)
  );

  if (isTitle) {
    if (currentTitle && currentLines.length) {
      respostasPadrao[currentTitle] = currentLines.join('\n').trim();
    }
    currentTitle = candidate;
    currentLines = [];
  } else if (currentTitle) {
    currentLines.push(candidate);
  }
}
// Última entrada
if (currentTitle && currentLines.length) {
  respostasPadrao[currentTitle] = currentLines.join('\n').trim();
}

// Se nenhuma entrada foi encontrada, faz fallback para o formato antigo
if (Object.keys(respostasPadrao).length === 0) {
  let rpTitulo = '', rpTexto = '';
  for (let i = 0; i < rawRP.length; i++) {
    var r = rawRP[i];
    var val = (r[1] || r[0] || '').toString().trim();
    if (!val) continue;
    if (val.toUpperCase() === val && !isHeaderOrLabel(val)) rpTitulo = val;
    if (val.length > 30 && !isHeaderOrLabel(val)) rpTexto = val;
  }
  if (rpTitulo && rpTexto) respostasPadrao[rpTitulo] = rpTexto;
}

out('respostas-padrao.json', respostasPadrao);

// ── PISO ──
const rawPi = XLSX.utils.sheet_to_json(wb.Sheets['PISO'], { header: 1 });
const piso = {
  curitiba: {
    varejista: parseFloat(rawPi[3]?.[4]) || 4729.62,
    hospitalar: parseFloat(rawPi[3]?.[6]) || 4567,
    distribuidora: parseFloat(rawPi[3]?.[8]) || 4764,
    laboratorios: parseFloat(rawPi[3]?.[10]) || 3763.08,
    industrias: parseFloat(rawPi[3]?.[12]) || 4211.45
  },
  default: { varejista: 4729.62, hospitalar: 4567, distribuidora: 4764, laboratorios: 3763.08, industrias: 4211.45 },
  horasSemana: 44,
  // Valores por hora
  valorHora: {
    varejista: parseFloat(rawPi[5]?.[4]) || 21.50,
    hospitalar: parseFloat(rawPi[5]?.[6]) || 20.76,
    distribuidora: parseFloat(rawPi[5]?.[8]) || 21.65,
    laboratorios: parseFloat(rawPi[5]?.[10]) || 17.10,
    industrias: parseFloat(rawPi[5]?.[12]) || 19.14
  },
  // Piso para 10h (proporcional)
  proporcional10h: {
    varejista: parseFloat(rawPi[17]?.[4]) || 1074.91,
    hospitalar: parseFloat(rawPi[17]?.[6]) || 1037.95,
    distribuidora: parseFloat(rawPi[17]?.[8]) || 1082.73,
    laboratorios: parseFloat(rawPi[17]?.[10]) || 855.25,
    industrias: parseFloat(rawPi[17]?.[12]) || 957.15
  }
};
out('piso.json', piso);

// ── PISO REFERÊNCIA ──
const rawPR = XLSX.utils.sheet_to_json(wb.Sheets['PISO_REF. '], { header: 1 });
const pisoRef = {
  valorReferencia: parseFloat(rawPR[2]?.[5]) || 4483,
  horasReferencia: parseFloat(rawPR[4]?.[5]) || 30,
  resultado: parseFloat(rawPR[11]?.[5]) || 3056.59,
  valorHora: parseFloat(rawPR[15]?.[5]) || 20.38
};
out('piso-ref.json', pisoRef);

// ── NOMES EMPRESARIAIS ──
const rawNE = XLSX.utils.sheet_to_json(wb.Sheets['NOMES EMPRESARIAIS'], { header: 1 });
const nomesEmpresariais = [];
for (let i = 0; i < rawNE.length; i++) {
  const val = (rawNE[i][1] || '').trim();
  if (val && val !== '0') nomesEmpresariais.push(val);
}
out('nomes-empresariais.json', nomesEmpresariais);

// ── CALC. HORAS ──
const rawCH = XLSX.utils.sheet_to_json(wb.Sheets['CALC. HORAS'], { header: 1 });
const calcHoras = {
  instrucoes: [],
  totalHorasSemana: parseFloat(rawCH[9]?.[4]) || 0
};
for (let i = 12; i < rawCH.length; i++) {
  const val = (rawCH[i][4] || '').toString().trim();
  if (val) calcHoras.instrucoes.push(val);
}
out('calc-horas.json', calcHoras);

// ── LISTAS (completo) ──
const rawL = XLSX.utils.sheet_to_json(wb.Sheets['listas'], { header: 1 });
const listas = { documentos: [], tiposEstabelecimento: [], respostasPadrao: [], prazosAssistencia: [] };
let prazosMode = false;
for (let i = 1; i < rawL.length; i++) {
  const r = rawL[i];
  const col0 = (r[0] || '').trim();
  const col1 = (r[1] || '').trim();
  const col2 = (r[2] || '').trim();

  if (col0 === 'PRAZOS E ASSISTÊNCIA POR TIPOS DE ESTABELECIMENTO') {
    prazosMode = true;
    continue;
  }
  if (prazosMode) {
    if (col0) listas.prazosAssistencia.push(col0);
    continue;
  }
  if (col0 && col0 !== 'LISTAS DE ORIENTAÇÕES' && col0 !== 'DOCUMENTOS') {
    listas.documentos.push(col0);
  }
  if (col1 && col1 !== 'TIPO ESTABELECIMENTO') {
    listas.tiposEstabelecimento.push(col1);
  }
  if (col2 && col2 !== 'RESPOSTAS PADRÃO') {
    listas.respostasPadrao.push(col2);
  }
}
out('listas.json', listas);

console.log('\n=== Extração completa! ===');

function excelDateToISO(serial) {
  if (!serial) return '';
  // Excel epoch: 1900-01-01 = 1 (with the 1900 leap year bug)
  const excelEpoch = new Date(1899, 11, 30);
  const d = new Date(excelEpoch.getTime() + serial * 86400000);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}
