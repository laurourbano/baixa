var fs = require('fs');
var path = 'js/ramais.js';
var content = fs.readFileSync(path, 'utf8');

var novosRamais = [
  // GABINETE DA DIRETORIA
  { nome: 'Marissol Alves', ramal: '9542', email: 'marissol.alves@crf-pr.org.br', departamento: 'Gabinete da Diretoria', ativo: true, subsetores: [] },
  { nome: 'Viviana Botega', ramal: '9553', email: 'viviana.botega@crf-pr.org.br', departamento: 'Gabinete da Diretoria', ativo: true, subsetores: [] },
  { nome: 'Nilze Muller', ramal: '9544', email: 'nilze.muller@crf-pr.org.br', departamento: 'Gabinete da Diretoria', ativo: true, subsetores: [] },

  // COMUNICAÇÃO E EVENTOS
  { nome: 'Michelly Lemes', ramal: '9560', email: 'michelly.lemes@crf-pr.org.br', departamento: 'Comunicação e Eventos', ativo: true, subsetores: [] },
  { nome: 'Eduarda Santos', ramal: '9561', email: 'eduarda.santos@crf-pr.org.br', departamento: 'Comunicação e Eventos', ativo: true, subsetores: [] },
  { nome: 'Ana Bruno', ramal: '9561', email: 'ana.bruno@crf-pr.org.br', departamento: 'Comunicação e Eventos', ativo: true, subsetores: [] },

  // GERÊNCIA GERAL
  { nome: 'Edivar Gomes', ramal: '9512', email: 'edivar.gomes@crf-pr.org.br', departamento: 'Gerência Geral', ativo: true, subsetores: [] },

  // GERÊNCIA DE PLANEJAMENTO
  { nome: 'Viviane Possamai', ramal: '9608', email: 'viviane.possamai@crf-pr.org.br', departamento: 'Gerência de Planejamento', ativo: true, subsetores: [] },

  // ATENDIMENTO
  { nome: 'Thais Cezar', ramal: '9917', email: 'thais.cezar@crf-pr.org.br', departamento: 'Atendimento', ativo: true, subsetores: [] },
  { nome: 'Silvia Nadal', ramal: '9916', email: 'silvia.nadal@crf-pr.org.br', departamento: 'Atendimento', ativo: true, subsetores: [] },
  { nome: 'Rafael Souza', ramal: '9915', email: 'rafael.souza@crf-pr.org.br', departamento: 'Atendimento', ativo: true, subsetores: [] },
  { nome: 'Celita Silva', ramal: '9918', email: 'celita.silva@crf-pr.org.br', departamento: 'Atendimento', ativo: true, subsetores: [] },

  // TECNOLOGIA DA INFORMAÇÃO
  { nome: 'Danilo Franca', ramal: '9600', email: 'danilo.franca@crf-pr.org.br', departamento: 'Tecnologia da Informação', ativo: true, subsetores: [] },
  { nome: 'Matheus Silveira', ramal: '9582', email: 'matheus.silveira@crf-pr.org.br', departamento: 'Tecnologia da Informação', ativo: true, subsetores: [] },
  { nome: 'Helpdesk TI', ramal: '9511', email: 'helpdesk@crf-pr.org.br', departamento: 'Tecnologia da Informação', ativo: true, subsetores: [] },
  { nome: 'Sanderval Santos', ramal: '9599', email: 'sanderval.santos@crf-pr.org.br', departamento: 'Tecnologia da Informação', ativo: true, subsetores: [] },
  { nome: 'Marcus Ribeiro', ramal: '9602', email: 'marcus.ribeiro@crf-pr.org.br', departamento: 'Tecnologia da Informação', ativo: true, subsetores: [] },

  // JURIDICO
  { nome: 'Melissa Riboski', ramal: '9570', email: 'melissa.riboski@crf-pr.org.br', departamento: 'Juridico', ativo: true, subsetores: [] },
  { nome: 'Vinicius Amorim', ramal: '9574', email: 'vinicius.amorim@crf-pr.org.br', departamento: 'Juridico', ativo: true, subsetores: [] },
  { nome: 'Josiane Prado', ramal: '9573', email: 'josiane.prado@crf-pr.org.br', departamento: 'Juridico', ativo: true, subsetores: [] },
  { nome: 'Estagiario', ramal: '9571', email: '', departamento: 'Juridico', ativo: true, subsetores: [] },

  // FISCALIZACAO
  { nome: 'Gabriele Pereira', ramal: '9590', email: 'gabriele.pereira@crf-pr.org.br', departamento: 'Fiscalizacao', ativo: true, subsetores: [] },
  { nome: 'Karoline Chuery', ramal: '9575', email: 'karoline.chuery@crf-pr.org.br', departamento: 'Fiscalizacao', ativo: true, subsetores: [] },
  { nome: 'Ygor Eckstein', ramal: '9592', email: 'ygor.eckstein@crf-pr.org.br', departamento: 'Fiscalizacao', ativo: true, subsetores: [] },
  { nome: 'Orivaldo Pinheiro', ramal: '9592', email: 'orivaldo.pinheiro@crf-pr.org.br', departamento: 'Fiscalizacao', ativo: true, subsetores: [] },
  { nome: 'Eduardo Shikasho', ramal: '9548', email: 'eduardo.shikasho@crf-pr.org.br', departamento: 'Fiscalizacao', ativo: true, subsetores: [] },
  { nome: 'Douglas Viegas', ramal: '9594', email: 'douglas.viegas@crf-pr.org.br', departamento: 'Fiscalizacao', ativo: true, subsetores: [] },

  // CADASTRO
  { nome: 'Thalles Souza', ramal: '9909', email: 'thalles.souza@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
  { nome: 'Julio Freitas', ramal: '9906', email: 'julio.freitas@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
  { nome: 'Patricia Shiozawa', ramal: '9901', email: 'patricia.shiozawa@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
  { nome: 'Tamara Soares', ramal: '9903', email: 'tamara.soares@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
  { nome: 'Talita Fernandes', ramal: '9904', email: 'talita.fernandes@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
  { nome: 'Victoria Silva', ramal: '9913', email: 'victoria.silva@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
  { nome: 'Evanize Salomao', ramal: '9905', email: 'evanize.salomao@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
  { nome: 'Bruna Coutinho', ramal: '9910', email: 'bruna.coutinho@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
  { nome: 'Anne Lisboa', ramal: '9911', email: 'anne.lisboa@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
  { nome: 'Flavia Chaves', ramal: '9900', email: 'flavia.chaves@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
  { nome: 'Luiz Moreira', ramal: '9914', email: 'luiz.moreira@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
  { nome: 'Melany Ribeiro', ramal: '9902', email: 'melany.ribeiro@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
  { nome: 'Lourdes Pini', ramal: '9912', email: 'lourdes.pini@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
  { nome: 'Rejane Ciupka', ramal: '9908', email: 'rejane.ciupka@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
  { nome: 'Lauro Urbano', ramal: '9907', email: 'lauro.urbano@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [], regiao: 'Curitiba' },

  // FINANCEIRO
  { nome: 'Cristiane Bregenski', ramal: '', email: 'cristiane.bregenski@crf-pr.org.br', departamento: 'Financeiro', ativo: true, subsetores: [] },
  { nome: 'Maria Isabel Capel', ramal: '', email: 'maria.capel@crf-pr.org.br', departamento: 'Financeiro', ativo: true, subsetores: [] },

  // COBRANCA
  { nome: 'Guilherme Pereira', ramal: '9533', email: 'guilherme.pereira@crf-pr.org.br', departamento: 'Cobranca', ativo: true, subsetores: [] },
  { nome: 'Sergio Freitas', ramal: '9532', email: 'sergio.freitas@crf-pr.org.br', departamento: 'Cobranca', ativo: true, subsetores: [] },
  { nome: 'Nilza Severo', ramal: '9531', email: 'nilza.severo@crf-pr.org.br', departamento: 'Cobranca', ativo: true, subsetores: [] },

  // TECNICO-CIENTIFICO
  { nome: 'Jackson Rapkiewicz', ramal: '9581', email: 'jackson.rapkiewicz@crf-pr.org.br', departamento: 'Tecnico-Cientifico', ativo: true, subsetores: [] },
  { nome: 'Rafaela Grobe', ramal: '9580', email: 'rafaela.grobe@crf-pr.org.br', departamento: 'Tecnico-Cientifico', ativo: true, subsetores: [] },
  { nome: 'Karin Zaros', ramal: '9565', email: 'karin.zaros@crf-pr.org.br', departamento: 'Tecnico-Cientifico', ativo: true, subsetores: [] },

  // LICITACAO
  { nome: 'Ana Souza', ramal: '9569', email: 'ana.souza@crf-pr.org.br', departamento: 'Licitacao', ativo: true, subsetores: [] },

  // COMPRAS
  { nome: 'Dalton Lemos', ramal: '9535', email: 'dalton.lemos@crf-pr.org.br', departamento: 'Compras', ativo: true, subsetores: [] },
  { nome: 'Arindal Junior', ramal: '9603', email: 'arindal.junior@crf-pr.org.br', departamento: 'Compras', ativo: true, subsetores: [] },
  { nome: 'Hennir Condore', ramal: '', email: 'hennir.condore@crf-pr.org.br', departamento: 'Compras', ativo: true, subsetores: [] },
  { nome: 'Rodrigo Campilho', ramal: '9586', email: 'rodrigo.campilho@crf-pr.org.br', departamento: 'Compras', ativo: true, subsetores: [] },
  { nome: 'Sara Marasca', ramal: '', email: 'sara.marasca@crf-pr.org.br', departamento: 'Compras', ativo: true, subsetores: [] },

  // DIRETORIA
  { nome: 'Valquires Godoy', ramal: '', email: 'valquires.godoy@crf-pr.org.br', departamento: 'Diretoria', ativo: true, subsetores: [] },
  { nome: 'Marcio Antoniassi', ramal: '', email: 'marcio.antoniassi@crf-pr.org.br', departamento: 'Diretoria', ativo: true, subsetores: [] },
  { nome: 'Ana Sakashita', ramal: '', email: 'ana.sakashita@crf-pr.org.br', departamento: 'Diretoria', ativo: true, subsetores: [] },
  { nome: 'Graziela Guidolin', ramal: '', email: 'graziela.guidolin@crf-pr.org.br', departamento: 'Diretoria', ativo: true, subsetores: [] },

  // ETICA
  { nome: 'Fernanda Penteado', ramal: '', email: 'fernanda.penteado@crf-pr.org.br', departamento: 'Etica', ativo: true, subsetores: [] },
  { nome: 'Edneia Magri', ramal: '', email: 'edneia.magri@crf-pr.org.br', departamento: 'Etica', ativo: true, subsetores: [] },

  // PESSOAL
  { nome: 'Ana Claudia Pereira', ramal: '9545', email: 'ana.pereira@crf-pr.org.br', departamento: 'Pessoal', ativo: true, subsetores: [] },
  { nome: 'Marcel Michalski', ramal: '9547', email: 'marcel.michalski@crf-pr.org.br', departamento: 'Pessoal', ativo: true, subsetores: [] },

  // FISCAIS
  { nome: 'Tayna Lima', ramal: '', email: 'tayna.lima@crf-pr.org.br', departamento: 'Fiscais', ativo: true, subsetores: [] },
  { nome: 'Eduardo Freitas', ramal: '', email: 'eduardo.freitas@crf-pr.org.br', departamento: 'Fiscais', ativo: true, regiao: 'Curitiba', subsetores: [] },
  { nome: 'Edson Garcia', ramal: '', email: 'edson.garcia@crf-pr.org.br', departamento: 'Fiscais', ativo: true, regiao: 'Londrina', subsetores: [] },
  { nome: 'Daiane Perondi', ramal: '', email: 'daiane.perondi@crf-pr.org.br', departamento: 'Fiscais', ativo: true, subsetores: [] },
  { nome: 'Luciano Goncalves', ramal: '', email: 'luciano.goncalves@crf-pr.org.br', departamento: 'Fiscais', ativo: true, regiao: 'Maringa', subsetores: [] },
  { nome: 'Marcelo Polak', ramal: '', email: 'marcelo.polak@crf-pr.org.br', departamento: 'Fiscais', ativo: true, regiao: 'Curitiba', subsetores: [] },
  { nome: 'Nayana Banhara', ramal: '', email: 'nayana.banhara@crf-pr.org.br', departamento: 'Fiscais', ativo: true, regiao: 'Curitiba', subsetores: [] },
  { nome: 'Ribamar Schmitz', ramal: '', email: 'ribamar.schmitz@crf-pr.org.br', departamento: 'Fiscais', ativo: true, subsetores: [] },
  { nome: 'Paulo Marchesini', ramal: '', email: 'paulo.marchesini@crf-pr.org.br', departamento: 'Fiscais', ativo: true, regiao: 'Maringa', subsetores: [] },
  { nome: 'Debora Yoshizawa', ramal: '', email: 'debora.yoshizawa@crf-pr.org.br', departamento: 'Fiscais', ativo: true, regiao: 'Ponta Grossa', subsetores: [] },
  { nome: 'Edson Alves', ramal: '', email: 'edson.alves@crf-pr.org.br', departamento: 'Fiscais', ativo: true, regiao: 'Cascavel', subsetores: [] },
  { nome: 'Welinson Silva', ramal: '', email: 'welison.silva@crf-pr.org.br', departamento: 'Fiscais', ativo: true, subsetores: [] },
  { nome: 'Elias Montin', ramal: '', email: 'elias.montin@crf-pr.org.br', departamento: 'Fiscais', ativo: true, regiao: 'Curitiba', subsetores: [] },
  { nome: 'Eduardo Pazim', ramal: '', email: 'eduardo.pazim@crf-pr.org.br', departamento: 'Fiscais', ativo: true, regiao: 'Curitiba', subsetores: [] },
  { nome: 'Josineia Baum', ramal: '', email: 'josineia.baum@crf-pr.org.br', departamento: 'Fiscais', ativo: true, regiao: 'Norte Pioneiro', subsetores: [] },

  // SECCIONAIS
  { nome: 'Seccional Cascavel', ramal: '', email: 'cascavel@crf-pr.org.br', departamento: 'Seccionais', ativo: true, telefone: '(41) 99838-0880', subsetores: [] },
  { nome: 'Seccional Londrina', ramal: '', email: 'londrina@crf-pr.org.br', departamento: 'Seccionais', ativo: true, telefone: '(41) 99838-0660', subsetores: [] },
  { nome: 'Seccional Ponta Grossa', ramal: '', email: 'pontagrossa@crf-pr.org.br', departamento: 'Seccionais', ativo: true, telefone: '(41) 99838-0550', subsetores: [] },
  { nome: 'Seccional Maringa', ramal: '', email: 'maringa@crf-pr.org.br', departamento: 'Seccionais', ativo: true, telefone: '(41) 99838-0770', subsetores: [] },

  // COPA
  { nome: 'Copa', ramal: '9578', email: '', departamento: 'Copa', ativo: true, subsetores: [] }
];

// Gera bloco formatado (sem aspas nas chaves)
var jsonStr = JSON.stringify(novosRamais, null, 4);
// Substitui "chave": por chave:
jsonStr = jsonStr.replace(/"([^"]+)":/g, '$1:');
// Ajusta valores string com aspas simples para duplas (mas mantém o formato)
var newBlock = '  /* ── Ramais iniciais (extraídos do PDF) ── */\n  var RAMAIS_INICIAIS = ' + jsonStr + ';';

var startMarker = '  /* ── Ramais iniciais (extraídos do PDF) ── */';
var endMarker = '/* ── Estado ──';
var start = content.indexOf(startMarker);
var end = content.indexOf(endMarker, start);

if (start === -1 || end === -1) {
  console.log('ERRO: marcadores nao encontrados');
  console.log('start:', start, 'end:', end);
  process.exit(1);
}

var before = content.substring(0, start);
// Pula linhas em branco antes do marcador
var afterIdx = end;
while (afterIdx > 0 && content[afterIdx - 1] === '\n') afterIdx--;
var after = '\n' + content.substring(afterIdx);
var result = before + newBlock + after;

fs.writeFileSync(path, result, 'utf8');
console.log('OK - ' + novosRamais.length + ' ramais atualizados');
