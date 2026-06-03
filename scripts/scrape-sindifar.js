/**
 * scrape-sindifar.js — Busca dados de Convenções Coletivas do SINDIFAR-PR
 *
 * Acessa https://sindifar-pr.org.br/negociacoes-coletivas/
 * e extrai informações sobre CCTs vigentes: região, categoria, piso salarial.
 *
 * Os dados são usados para atualizar piso.json com valores reais.
 *
 * Uso: node scripts/scrape-sindifar.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://sindifar-pr.org.br';

// Ignora erros de certificado (site tem cert apenas para sindifar-pr.org.br sem www)
const agent = new https.Agent({ rejectUnauthorized: false });

function fetchUrl(url) {
  return new Promise(function (resolve, reject) {
    https.get(url, { agent: agent, headers: { 'User-Agent': 'Mozilla/5.0' } }, function (res) {
      var data = '';
      res.on('data', function (chunk) { data += chunk; });
      res.on('end', function () { resolve(data); });
    }).on('error', reject);
  });
}

function extractLinks(html) {
  var links = [];
  var regex = /href="([^"]+)"/g;
  var match;
  while ((match = regex.exec(html)) !== null) {
    var href = match[1];
    if (href.indexOf('negociacao') > -1 || href.indexOf('cct') > -1 || href.indexOf('convencao') > -1 ||
        href.indexOf('pdf') > -1 || href.indexOf('piso') > -1 || href.indexOf('salarial') > -1) {
      links.push(href.startsWith('http') ? href : (BASE_URL + href));
    }
  }
  return links;
}

function extractPisoInfo(html) {
  var info = {};

  // Procura por valores monetários (R$ X.XXX,XX)
  var moneyRegex = /R\$\s*([\d.]+,\d{2})/g;
  var values = [];
  var match;
  while ((match = moneyRegex.exec(html)) !== null) {
    values.push(match[1].replace('.', '').replace(',', '.'));
  }
  if (values.length > 0) info.valores = values;

  // Procura por nomes de cidades/regiões
  var regiaoRegex = /(Curitiba|Londrina|Maringá|Cascavel|Ponta\s*Grossa|Guarapuava|Francisco\s*Beltrão|Paranavaí|Santo\s*Antônio\s*da\s*Platina|Oeste|Norte|Sudoeste|Centro[-\s]Sul|Campos\s*Gerais|Litoral)/gi;
  var regioes = [];
  while ((match = regiaoRegex.exec(html)) !== null) {
    var r = match[1].trim();
    if (regioes.indexOf(r) === -1) regioes.push(r);
  }
  if (regioes.length > 0) info.regioes = regioes;

  // Procura por categorias
  var catRegex = /(Varejista|Hospitalar|Distribuidora|Laboratório|Indústria|Atacadista)/gi;
  var categorias = [];
  while ((match = catRegex.exec(html)) !== null) {
    var c = match[1].trim();
    if (categorias.indexOf(c) === -1) categorias.push(c);
  }
  if (categorias.length > 0) info.categorias = categorias;

  // Procura por vigência
  var vigenciaRegex = /(20\d{2}[-\/]20\d{2})/g;
  var vigencias = [];
  while ((match = vigenciaRegex.exec(html)) !== null) {
    var v = match[1];
    if (vigencias.indexOf(v) === -1) vigencias.push(v);
  }
  if (vigencias.length > 0) info.vigencias = vigencias;

  return info;
}

async function main() {
  console.log('=== Scraping SINDIFAR-PR — Negociações Coletivas ===\n');

  try {
    // 1. Busca a página principal de negociações
    console.log('1. Buscando página de negociações coletivas...');
    var html = await fetchUrl(BASE_URL + '/negociacoes-coletivas/');

    // 2. Extrai links
    var links = extractLinks(html);
    var uniqueLinks = [...new Set(links)];
    console.log('   Encontrados ' + uniqueLinks.length + ' links relevantes.');

    // 3. Para cada link, tenta extrair dados
    var resultados = [];

    for (var i = 0; i < Math.min(uniqueLinks.length, 20); i++) {
      try {
        console.log('   Acessando: ' + uniqueLinks[i]);
        var pageHtml = await fetchUrl(uniqueLinks[i]);
        var info = extractPisoInfo(pageHtml);
        if (Object.keys(info).length > 0) {
          info.url = uniqueLinks[i];
          resultados.push(info);
          console.log('     Dados extraídos:', JSON.stringify(info).substring(0, 120));
        }
      } catch (e) {
        // Ignora erros individuais
      }
    }

    // 4. Salva resultados
    var outPath = path.join(__dirname, '..', 'assets', 'sindifar-scraped.json');
    fs.writeFileSync(outPath, JSON.stringify(resultados, null, 2));
    console.log('\nResultados salvos em assets/sindifar-scraped.json (' + resultados.length + ' páginas)');

  } catch (err) {
    console.error('Erro ao acessar sindifar-pr.org.br:', err.message);
    console.log('O site pode estar offline ou com certificado inválido.');
    console.log('Será usado dados padrão do piso.json.');
  }
}

main();
