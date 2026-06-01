/**
 * extrair-atualizadores.js
 * Extrai dados das planilhas A. Atualizador e gera JSONs atualizados.
 * Executar: node scripts/extrair-atualizadores.js
 */
var XLSX = require('xlsx');
var fs = require('fs');
var path = require('path');

var PLANILHAS = 'assets/planilhas';
var OUTPUT = 'assets';

// ── 1. Respostas Padrão ──────────────────
function extrairRespostas() {
  console.log('\n### Extraindo respostas padrão...');
  var wb = XLSX.readFile(path.join(PLANILHAS, 'A. Atualizador Respostas Base.xlsx'));
  var ws = wb.Sheets[wb.SheetNames[0]];
  var rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  var respostas = {};
  rows.forEach(function (r) {
    var nome = (r[0] || '').trim();
    var texto = (r[1] || '').trim();
    if (nome && texto && nome !== 'SOLICITAÇÃO DE CORREÇÃO') {
      respostas[nome] = texto;
    }
  });

  // Mantém a existente também
  var existente = {};
  try { existente = JSON.parse(fs.readFileSync(path.join(OUTPUT, 'consultas/respostas-padrao.json'), 'utf8')); } catch(e) {}
  Object.keys(existente).forEach(function (k) { respostas[k] = existente[k]; });

  fs.writeFileSync(path.join(OUTPUT, 'consultas/respostas-padrao.json'), JSON.stringify(respostas, null, 2), 'utf8');
  console.log('  -> ' + Object.keys(respostas).length + ' respostas salvas em consultas/respostas-padrao.json');
}

// ── 2. Orientações expandidas ────────────
function extrairOrientacoes() {
  console.log('\n### Extraindo orientações...');
  var wb = XLSX.readFile(path.join(PLANILHAS, 'A. Atualizador orientações.xlsx'));
  var ws = wb.Sheets[wb.SheetNames[0]];
  var rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  var documentos = [];
  var situacoes = [];
  var checklist = [];
  var currentSection = '';
  var currentDoc = null;
  var subItems = [];

  rows.forEach(function (r) {
    var text = (r[0] || '').trim();
    if (!text) return;
    // Detecta seção
    if (text === 'DOCUMENTOS' || text.toUpperCase().indexOf('CHECKLIST') > -1) {
      if (currentDoc) documentos.push(currentDoc);
      currentDoc = null;
      if (text.toUpperCase().indexOf('CHECKLIST') > -1) currentSection = 'checklist';
      else currentSection = 'documentos';
      return;
    }
    if (text.toUpperCase().indexOf('SITUAÇÕES') > -1) {
      if (currentDoc) documentos.push(currentDoc);
      currentDoc = null;
      currentSection = 'situacoes';
      return;
    }

    // Detecta título (maiúsculo sem pontuação no final)
    var isTitle = /^[A-ZÀ-Ú\s\/\-]{5,}$/.test(text) && !text.endsWith('.');
    var isSubItem = text.startsWith('•') || text.startsWith('-') || text.startsWith('*') || /^[a-zà-ú]/.test(text);

    if (currentSection === 'documentos' || currentSection === 'checklist') {
      if (isTitle) {
        if (currentDoc) {
          if (currentSection === 'documentos') documentos.push(currentDoc);
          else checklist.push(currentDoc);
        }
        currentDoc = text;
      } else if (currentDoc) {
        currentDoc += '\n  ' + text;
      } else {
        if (currentSection === 'documentos') documentos.push(text);
        else checklist.push(text);
      }
    } else if (currentSection === 'situacoes') {
      situacoes.push(text);
    }
  });
  if (currentDoc) {
    if (currentSection === 'documentos') documentos.push(currentDoc);
    else checklist.push(currentDoc);
  }

  var orientacoes = {
    documentos: documentos,
    situacoes: situacoes,
    checklist: checklist
  };

  fs.writeFileSync(path.join(OUTPUT, 'consultas/orientacoes.json'), JSON.stringify(orientacoes, null, 2), 'utf8');
  console.log('  -> docs:' + documentos.length + ' sit:' + situacoes.length + ' check:' + checklist.length + ' salvas em consultas/orientacoes.json');
}

// ── 3. Piso com 400 cidades ──────────────
function extrairPiso() {
  console.log('\n### Extraindo piso...');
  var wb = XLSX.readFile(path.join(PLANILHAS, 'A. Atualizador piso.xlsx'));
  var ws = wb.Sheets['cidades'];
  var rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  // Header: Cidades, varejista, varejista , varejista ing, distribuidoras, distribuidoras, distribuidoras ing, laboratórios, laboratórios, laboratórios ing, industrias, industrias, industrias ing, hospitais, hospitais, hospitais ing
  // Pattern: nome, var_label, valor, ingresso, dist_label, valor, ingresso, labo_label, valor, ingresso, ind_label, valor, ingresso, hosp_label, valor, ingresso

  var cidades = {};
  var count = 0;

  rows.forEach(function (r) {
    var nome = (r[0] || '').toString().trim();
    if (!nome || nome === 'Cidades') return;

    // Normalizar nome da cidade
    var key = nome.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    var valores = {};
    // Colunas: 1=var label, 2=var valor, 3=var ingresso,
    //          4=dist label, 5=dist valor, 6=dist ingresso,
    //          7=labo label, 8=labo valor, 9=labo ingresso,
    //          10=ind label, 11=ind valor, 12=ind ingresso,
    //          13=hosp label, 14=hosp valor, 15=hosp ingresso
    if (r[2] && !isNaN(parseFloat(r[2]))) valores.varejista = parseFloat(r[2]);
    if (r[5] && !isNaN(parseFloat(r[5]))) valores.distribuidora = parseFloat(r[5]);
    if (r[8] && !isNaN(parseFloat(r[8]))) valores.laboratorios = parseFloat(r[8]);
    if (r[11] && !isNaN(parseFloat(r[11]))) valores.industrias = parseFloat(r[11]);
    if (r[14] && !isNaN(parseFloat(r[14]))) valores.hospitalar = parseFloat(r[14]);

    if (Object.keys(valores).length > 0) {
      cidades[key] = valores;
      count++;
    }
  });

  // Lê piso.json existente para manter estrutura de regiões
  var pisoExistente = {};
  try { pisoExistente = JSON.parse(fs.readFileSync(path.join(OUTPUT, 'piso/piso.json'), 'utf8')); } catch(e) {}

  // Atualiza os valores nas regiões existentes
  if (pisoExistente.regioes) {
    Object.keys(pisoExistente.regioes).forEach(function (regiao) {
      var reg = pisoExistente.regioes[regiao];
      if (reg.cidades) {
        Object.keys(reg.cidades).forEach(function (cid) {
          if (cidades[cid]) {
            reg.cidades[cid] = cidades[cid];
          }
        });
      }
    });
    fs.writeFileSync(path.join(OUTPUT, 'piso/piso.json'), JSON.stringify(pisoExistente, null, 2), 'utf8');
    console.log('  -> ' + count + ' cidades extraídas. piso.json atualizado.');
  } else {
    console.log('  -> ' + count + ' cidades extraídas (piso.json não tem estrutura de regiões)');
  }

  // Salva cache plano de cidades para consulta rápida
  fs.writeFileSync(path.join(OUTPUT, 'piso/piso-extraido.json'), JSON.stringify(cidades, null, 2), 'utf8');
  console.log('  -> piso-extraido.json com ' + Object.keys(cidades).length + ' cidades');
}

// ── Executar tudo ─────────────────────────
extrairRespostas();
extrairOrientacoes();
extrairPiso();
console.log('\n=== Extração concluída! ===');
