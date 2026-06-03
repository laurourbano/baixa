/**
 * normalizar-cidades.js — Remove acentos, duplicatas e normaliza nomes
 *
 * Regras:
 * - Tudo minúsculo
 * - Sem acentos (á→a, ç→c, etc.)
 * - Sem espaços (substituídos por _)
 * - Cada cidade pertence a UMA única região (a primeira encontrada)
 */
const fs = require('fs');
const path = require('path');

function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // remove acentos
    .replace(/ç/g, 'c')                // cedilha
    .replace(/\s+/g, '_')              // espaços → underline
    .replace(/[^a-z0-9_]/g, '')        // remove qualquer outro caractere especial
    .replace(/_+/g, '_')               // underlines múltiplos → um só
    .replace(/^_|_$/g, '');            // remove underlines nas pontas
}

// 1. Corrige cidades-parana.json
const cidadesRaw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'assets', 'cidades-parana.json'), 'utf-8'));
const seen = {};
const cidadesFixed = [];

cidadesRaw.cidades.forEach(function (c) {
  var norm = normalize(c.cidade);
  if (!norm) return;
  if (seen[norm]) return; // já existe, pula duplicata
  seen[norm] = true;
  cidadesFixed.push({
    cidade: norm,
    regiao: c.regiao,
    label: norm.replace(/_/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); })
  });
});

// Ordena por label
cidadesFixed.sort(function (a, b) { return a.label.localeCompare(b.label, 'pt-BR'); });

fs.writeFileSync(
  path.join(__dirname, '..', 'assets', 'cidades-parana.json'),
  JSON.stringify({ cidades: cidadesFixed }, null, 2)
);
console.log('cidades-parana.json: ' + cidadesFixed.length + ' cidades (sem duplicatas, sem acentos)');

// 2. Corrige piso.json
const pisoRaw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'assets', 'piso.json'), 'utf-8'));
const seenPiso = {};
const regioesFixed = {};

Object.keys(pisoRaw.regioes).forEach(function (regiaoNome) {
  var regData = pisoRaw.regioes[regiaoNome];
  var cidadesFixedReg = {};

  Object.keys(regData.cidades).forEach(function (cidadeKey) {
    var norm = normalize(cidadeKey);
    if (!norm || seenPiso[norm]) return; // duplicata cross-região → mantém na primeira região
    seenPiso[norm] = true;
    cidadesFixedReg[norm] = regData.cidades[cidadeKey];
  });

  if (Object.keys(cidadesFixedReg).length > 0) {
    regioesFixed[regiaoNome] = {
      _actVigente: regData._actVigente,
      _ultimaCCT: regData._ultimaCCT,
      _fonte: regData._fonte,
      cidades: cidadesFixedReg
    };
  }
});

// Reconstrói campos flat para compatibilidade
var primeiraRegiao = Object.keys(regioesFixed)[0];
var primeiraCidade = Object.keys(regioesFixed[primeiraRegiao].cidades)[0];
var valoresRef = regioesFixed[primeiraRegiao].cidades[primeiraCidade];

var pisoFixed = {
  regioes: regioesFixed,
  curitiba: valoresRef,
  default: valoresRef,
  horasSemana: 44,
  valorHora: {},
  proporcional10h: {}
};

['varejista', 'hospitalar', 'distribuidora', 'laboratorios', 'industrias'].forEach(function (cat) {
  pisoFixed.valorHora[cat] = parseFloat((valoresRef[cat] / 220).toFixed(2));
  pisoFixed.proporcional10h[cat] = parseFloat((valoresRef[cat] * 10 / 44).toFixed(2));
});

fs.writeFileSync(
  path.join(__dirname, '..', 'assets', 'piso.json'),
  JSON.stringify(pisoFixed, null, 2)
);

var totalCidades = Object.values(regioesFixed).reduce(function (sum, r) { return sum + Object.keys(r.cidades).length; }, 0);
console.log('piso.json: ' + Object.keys(regioesFixed).length + ' regiões, ' + totalCidades + ' cidades (sem duplicatas, sem acentos)');

// 3. Verifica consistência cruzada
var cidadesPiso = new Set();
Object.values(regioesFixed).forEach(function (r) {
  Object.keys(r.cidades).forEach(function (c) { cidadesPiso.add(c); });
});
var cidadesLista = new Set(cidadesFixed.map(function (c) { return c.cidade; }));

var noPiso = cidadesFixed.filter(function (c) { return !cidadesPiso.has(c.cidade); });
var naoNaLista = [...cidadesPiso].filter(function (c) { return !cidadesLista.has(c); });

if (noPiso.length > 0) console.log('Cidades na lista mas NÃO no piso: ' + noPiso.length);
if (naoNaLista.length > 0) console.log('Cidades no piso mas NÃO na lista: ' + naoNaLista.length);
if (noPiso.length === 0 && naoNaLista.length === 0) console.log('✓ Consistência cruzada OK');
