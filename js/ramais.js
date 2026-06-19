/**
 * ramais.js — Módulo de Ramais de Telefonia
 *
 * Gerencia lista de ramais e orientações de telefonia.
 * CRUD: listar, filtrar, pesquisar, editar, incluir, excluir, inativar
 * Busca incremental a partir da 3ª letra
 * Destaque de ramais duplicados
 *
 * @namespace MainApp
 */
window.MainApp = window.MainApp || {};

(function (app) {
  'use strict';

  /* ── Orientações (Manual de Telefonia) ─── */
  var ORIENTACOES_DEFAULT = {
    ligacaoFixoCelularMesmoDDD: [
      'Digite: 0 + "Senha pessoal"',
      'Aguarde o tom de linha disponível',
      'Digite: número local desejado',
      'Exemplo fixo: 0 + XXXXX + 3333-3333',
      'Exemplo móvel: 0 + XXXXX + 91234-5678'
    ],
    ligacaoOutroDDD: [
      'Digite: 0 + "Senha pessoal"',
      'Aguarde o tom de linha disponível',
      'Digite: 0 + "Cód. de Área (DDD)"',
      'Digite: número desejado',
      'Exemplo fixo: 0 + XXXXX + 0 77 + 3333-3333',
      'Exemplo móvel: 0 + XXXXX + 0 77 + 91234-5678',
      'IMPORTANTE: NÃO utilizar código de seleção de prestadora'
    ],
    capturarLigacoes: [
      'Do mesmo grupo: digite 55',
      'De outro grupo: digite 54 + ramal desejado'
    ],
    chamadaEspera: [
      'Para colocar em espera: "Flash" + 6 + posição de espera (0 a 9)',
      'Para recuperar: 56 + posição de espera (0 a 9)'
    ],
    identificarChamadas: [
      'Ligações externas: 2 toques breves e próximos',
      'Ligações internas: toque longo e distinto'
    ],
    roteiroAtendimento: [
      'Ao atender ligação externa: "Conselho Regional de Farmácia, SEU NOME, bom dia/tarde"',
      'Se colega ausente e ramal tocar: capture a ligação (55 ou 54+ramal)',
      'Anote: nome, assunto e contato. Entregue a anotação'
    ]
  };

  /* ── Ramais iniciais (extraídos do PDF) ── */
  var RAMAIS_INICIAIS = [
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
    { nome: 'Sílvia Nadal', ramal: '9916', email: 'silvia.nadal@crf-pr.org.br', departamento: 'Atendimento', ativo: true, subsetores: [] },
    { nome: 'Rafael Souza', ramal: '9915', email: 'rafael.souza@crf-pr.org.br', departamento: 'Atendimento', ativo: true, subsetores: [] },
    { nome: 'Celita Silva', ramal: '9918', email: 'celita.silva@crf-pr.org.br', departamento: 'Atendimento', ativo: true, subsetores: [] },

    // TECNOLOGIA DA INFORMAÇÃO
    { nome: 'Danilo França', ramal: '9600', email: 'danilo.franca@crf-pr.org.br', departamento: 'Tecnologia da Informação', ativo: true, subsetores: [] },
    { nome: 'Matheus Silveira', ramal: '9582', email: 'matheus.silveira@crf-pr.org.br', departamento: 'Tecnologia da Informação', ativo: true, subsetores: [] },
    { nome: 'Helpdesk TI', ramal: '9511', email: 'helpdesk@crf-pr.org.br', departamento: 'Tecnologia da Informação', ativo: true, subsetores: [] },
    { nome: 'Sanderval Santos', ramal: '9599', email: 'sanderval.santos@crf-pr.org.br', departamento: 'Tecnologia da Informação', ativo: true, subsetores: [] },
    { nome: 'Marcus Ribeiro', ramal: '9602', email: 'marcus.ribeiro@crf-pr.org.br', departamento: 'Tecnologia da Informação', ativo: true, subsetores: [] },

    // JURÍDICO
    { nome: 'Melissa Riboski', ramal: '9570', email: 'melissa.riboski@crf-pr.org.br', departamento: 'Jurídico', ativo: true, subsetores: [] },
    { nome: 'Vinícius Amorim', ramal: '9574', email: 'vinicius.amorim@crf-pr.org.br', departamento: 'Jurídico', ativo: true, subsetores: [] },
    { nome: 'Josiane Prado', ramal: '9573', email: 'josiane.prado@crf-pr.org.br', departamento: 'Jurídico', ativo: true, subsetores: [] },
    { nome: 'Estagiário', ramal: '9571', email: '', departamento: 'Jurídico', ativo: true, subsetores: [] },

    // FISCALIZAÇÃO
    { nome: 'Gabriele Pereira', ramal: '9590', email: 'gabriele.pereira@crf-pr.org.br', departamento: 'Fiscalização', ativo: true, subsetores: [] },
    { nome: 'Karoline Chuery', ramal: '9575', email: 'karoline.chuery@crf-pr.org.br', departamento: 'Fiscalização', ativo: true, subsetores: [] },
    { nome: 'Ygor Eckstein', ramal: '9592', email: 'ygor.eckstein@crf-pr.org.br', departamento: 'Fiscalização', ativo: true, subsetores: [] },
    { nome: 'Orivaldo Pinheiro', ramal: '9592', email: 'orivaldo.pinheiro@crf-pr.org.br', departamento: 'Fiscalização', ativo: true, subsetores: [] },
    { nome: 'Eduardo Shikasho', ramal: '9548', email: 'eduardo.shikasho@crf-pr.org.br', departamento: 'Fiscalização', ativo: true, subsetores: [] },
    { nome: 'Douglas Viegas', ramal: '9594', email: 'douglas.viegas@crf-pr.org.br', departamento: 'Fiscalização', ativo: true, subsetores: [] },

    // CADASTRO
    { nome: 'Thalles Souza', ramal: '9909', email: 'thalles.souza@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
    { nome: 'Júlio Freitas', ramal: '9906', email: 'julio.freitas@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
    { nome: 'Patrícia Shiozawa', ramal: '9901', email: 'patricia.shiozawa@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
    { nome: 'Tâmara Soares', ramal: '9903', email: 'tamara.soares@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
    { nome: 'Talita Fernandes', ramal: '9904', email: 'talita.fernandes@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
    { nome: 'Victoria Silva', ramal: '9913', email: 'victoria.silva@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
    { nome: 'Evanize Salomão', ramal: '9905', email: 'evanize.salomao@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
    { nome: 'Bruna Coutinho', ramal: '9910', email: 'bruna.coutinho@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
    { nome: 'Anne Lisboa', ramal: '9911', email: 'anne.lisboa@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
    { nome: 'Flávia Chaves', ramal: '9900', email: 'flavia.chaves@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
    { nome: 'Luiz Moreira', ramal: '9914', email: 'luiz.moreira@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
    { nome: 'Melany Ribeiro', ramal: '9902', email: 'melany.ribeiro@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
    { nome: 'Lourdes Pini', ramal: '9912', email: 'lourdes.pini@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
    { nome: 'Rejane Ciupka', ramal: '9908', email: 'rejane.ciupka@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [] },
    { nome: 'Lauro Urbano', ramal: '9907', email: 'lauro.urbano@crf-pr.org.br', departamento: 'Cadastro', ativo: true, subsetores: [], regiao: 'Curitiba' },

    // FINANCEIRO
    { nome: 'Cristiane Bregenski', ramal: '', email: 'cristiane.bregenski@crf-pr.org.br', departamento: 'Financeiro', ativo: true, subsetores: [] },
    { nome: 'Maria Isabel Capel', ramal: '', email: 'maria.capel@crf-pr.org.br', departamento: 'Financeiro', ativo: true, subsetores: [] },

    // COBRANÇA
    { nome: 'Guilherme Pereira', ramal: '9533', email: 'guilherme.pereira@crf-pr.org.br', departamento: 'Cobrança', ativo: true, subsetores: [] },
    { nome: 'Sérgio Freitas', ramal: '9532', email: 'sergio.freitas@crf-pr.org.br', departamento: 'Cobrança', ativo: true, subsetores: [] },
    { nome: 'Nilza Severo', ramal: '9531', email: 'nilza.severo@crf-pr.org.br', departamento: 'Cobrança', ativo: true, subsetores: [] },

    // TÉCNICO-CIENTÍFICO
    { nome: 'Jackson Rapkiewicz', ramal: '9581', email: 'jackson.rapkiewicz@crf-pr.org.br', departamento: 'Técnico-Científico', ativo: true, subsetores: [] },
    { nome: 'Rafaela Grobe', ramal: '9580', email: 'rafaela.grobe@crf-pr.org.br', departamento: 'Técnico-Científico', ativo: true, subsetores: [] },
    { nome: 'Karin Zaros', ramal: '9565', email: 'karin.zaros@crf-pr.org.br', departamento: 'Técnico-Científico', ativo: true, subsetores: [] },

    // LICITAÇÃO
    { nome: 'Ana Souza', ramal: '9569', email: 'ana.souza@crf-pr.org.br', departamento: 'Licitação', ativo: true, subsetores: [] },

    // COMPRAS
    { nome: 'Dalton Lemos', ramal: '9535', email: 'dalton.lemos@crf-pr.org.br', departamento: 'Compras', ativo: true, subsetores: [] },
    { nome: 'Arindal Junior', ramal: '9603', email: 'arindal.junior@crf-pr.org.br', departamento: 'Compras', ativo: true, subsetores: [] },
    { nome: 'Hennir Condore', ramal: '', email: 'hennir.condore@crf-pr.org.br', departamento: 'Compras', ativo: true, subsetores: [] },
    { nome: 'Rodrigo Campilho', ramal: '9586', email: 'rodrigo.campilho@crf-pr.org.br', departamento: 'Compras', ativo: true, subsetores: [] },
    { nome: 'Sara Marasca', ramal: '', email: 'sara.marasca@crf-pr.org.br', departamento: 'Compras', ativo: true, subsetores: [] },

    // DIRETORIA
    { nome: 'Valquires Godoy', ramal: '', email: 'valquires.godoy@crf-pr.org.br', departamento: 'Diretoria', ativo: true, subsetores: [] },
    { nome: 'Márcio Antoniassi', ramal: '', email: 'marcio.antoniassi@crf-pr.org.br', departamento: 'Diretoria', ativo: true, subsetores: [] },
    { nome: 'Ana Sakashita', ramal: '', email: 'ana.sakashita@crf-pr.org.br', departamento: 'Diretoria', ativo: true, subsetores: [] },
    { nome: 'Graziela Guidolin', ramal: '', email: 'graziela.guidolin@crf-pr.org.br', departamento: 'Diretoria', ativo: true, subsetores: [] },

    // ÉTICA
    { nome: 'Fernanda Penteado', ramal: '', email: 'fernanda.penteado@crf-pr.org.br', departamento: 'Ética', ativo: true, subsetores: [] },
    { nome: 'Edneia Magri', ramal: '', email: 'edneia.magri@crf-pr.org.br', departamento: 'Ética', ativo: true, subsetores: [] },

    // PESSOAL
    { nome: 'Ana Cláudia Pereira', ramal: '9545', email: 'ana.pereira@crf-pr.org.br', departamento: 'Pessoal', ativo: true, subsetores: [] },
    { nome: 'Marcel Michalski', ramal: '9547', email: 'marcel.michalski@crf-pr.org.br', departamento: 'Pessoal', ativo: true, subsetores: [] },

    // FISCAIS
    { nome: 'Tayná Lima', ramal: '', email: 'tayna.lima@crf-pr.org.br', departamento: 'Fiscais', ativo: true, subsetores: [] },
    { nome: 'Eduardo Freitas', ramal: '', email: 'eduardo.freitas@crf-pr.org.br', departamento: 'Fiscais', ativo: true, regiao: 'Curitiba', subsetores: [] },
    { nome: 'Edson Garcia', ramal: '', email: 'edson.garcia@crf-pr.org.br', departamento: 'Fiscais', ativo: true, regiao: 'Londrina', subsetores: [] },
    { nome: 'Daiane Perondi', ramal: '', email: 'daiane.perondi@crf-pr.org.br', departamento: 'Fiscais', ativo: true, subsetores: [] },
    { nome: 'Luciano Gonçalves', ramal: '', email: 'luciano.goncalves@crf-pr.org.br', departamento: 'Fiscais', ativo: true, regiao: 'Maringá', subsetores: [] },
    { nome: 'Marcelo Polak', ramal: '', email: 'marcelo.polak@crf-pr.org.br', departamento: 'Fiscais', ativo: true, regiao: 'Curitiba', subsetores: [] },
    { nome: 'Nayana Banhara', ramal: '', email: 'nayana.banhara@crf-pr.org.br', departamento: 'Fiscais', ativo: true, regiao: 'Curitiba', subsetores: [] },
    { nome: 'Ribamar Schmitz', ramal: '', email: 'ribamar.schmitz@crf-pr.org.br', departamento: 'Fiscais', ativo: true, subsetores: [] },
    { nome: 'Paulo Marchesini', ramal: '', email: 'paulo.marchesini@crf-pr.org.br', departamento: 'Fiscais', ativo: true, regiao: 'Maringá', subsetores: [] },
    { nome: 'Débora Yoshizawa', ramal: '', email: 'debora.yoshizawa@crf-pr.org.br', departamento: 'Fiscais', ativo: true, regiao: 'Ponta Grossa', subsetores: [] },
    { nome: 'Edson Alves', ramal: '', email: 'edson.alves@crf-pr.org.br', departamento: 'Fiscais', ativo: true, regiao: 'Cascavel', subsetores: [] },
    { nome: 'Welinson Silva', ramal: '', email: 'welison.silva@crf-pr.org.br', departamento: 'Fiscais', ativo: true, subsetores: [] },
    { nome: 'Elias Montin', ramal: '', email: 'elias.montin@crf-pr.org.br', departamento: 'Fiscais', ativo: true, regiao: 'Curitiba', subsetores: [] },
    { nome: 'Eduardo Pazim', ramal: '', email: 'eduardo.pazim@crf-pr.org.br', departamento: 'Fiscais', ativo: true, regiao: 'Curitiba', subsetores: [] },
    { nome: 'Josineia Baum', ramal: '', email: 'josineia.baum@crf-pr.org.br', departamento: 'Fiscais', ativo: true, regiao: 'Norte Pioneiro', subsetores: [] },

    // SECCIONAIS
    { nome: 'Seccional Cascavel', ramal: '', email: 'cascavel@crf-pr.org.br', departamento: 'Seccionais', ativo: true, telefone: '(41) 99838-0880', subsetores: [] },
    { nome: 'Seccional Londrina', ramal: '', email: 'londrina@crf-pr.org.br', departamento: 'Seccionais', ativo: true, telefone: '(41) 99838-0660', subsetores: [] },
    { nome: 'Seccional Ponta Grossa', ramal: '', email: 'pontagrossa@crf-pr.org.br', departamento: 'Seccionais', ativo: true, telefone: '(41) 99838-0550', subsetores: [] },
    { nome: 'Seccional Maringá', ramal: '', email: 'maringa@crf-pr.org.br', departamento: 'Seccionais', ativo: true, telefone: '(41) 99838-0770', subsetores: [] },

    // COPA
    { nome: 'Copa', ramal: '9578', email: '', departamento: 'Copa', ativo: true, subsetores: [] }
  ];

  /* ── Estado ────────────────────────────── */
  function getState() {
    if (!app.__state._ramais) {
      app.__state._ramais = { ramais: [], orientacoes: ORIENTACOES_DEFAULT };
    }
    return app.__state._ramais;
  }

  function ensureInicial() {
    var state = getState();
    // Migração: converte dados antigos (setor → departamento, adiciona subsetores)
    if (state.ramais && state.ramais.length > 0) {
      var migrou = false;
      state.ramais.forEach(function (r) {
        if (r.setor !== undefined && r.departamento === undefined) {
          r.departamento = r.setor;
          delete r.setor;
          migrou = true;
        }
        if (r.subsetores === undefined) {
          r.subsetores = [];
          migrou = true;
        }
      });
      if (migrou) {
        // Backup automático no localStorage antes da migração
        try { localStorage.setItem('baixa_rt_data_backup_pre_departamento', JSON.stringify(state)); } catch (e) {}
        app._save();
      }
    }
    if (!state.ramais || state.ramais.length === 0) {
      state.ramais = RAMAIS_INICIAIS.map(function (r, i) {
        return Object.assign({}, r, { id: 'ramal-' + (i + 1) });
      });
      app._save();
    }
  }

  /* ── Helpers ───────────────────────────── */
  function generateId() {
    return 'ramal-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
  }

  /** Retorna lista de ramais com indicador de duplicado */
  function ramaisComDuplicados() {
    var state = getState();
    var list = state.ramais;

    // Agrupa por ramal (ignora vazios)
    var grupos = {};
    list.forEach(function (r) {
      if (r.ramal && r.ramal.trim()) {
        var k = r.ramal.trim();
        if (!grupos[k]) grupos[k] = [];
        grupos[k].push(r.id);
      }
    });

    var duplicados = {};
    Object.keys(grupos).forEach(function (k) {
      if (grupos[k].length > 1) {
        grupos[k].forEach(function (id) { duplicados[id] = true; });
      }
    });

    return list.map(function (r) {
      return Object.assign({}, r, { _duplicado: !!duplicados[r.id] });
    });
  }

  /* ── CRUD ──────────────────────────────── */
  function getRamais() {
    ensureInicial();
    return ramaisComDuplicados();
  }

  function getDepartamentos() {
    ensureInicial();
    var state = getState();
    var depts = {};
    state.ramais.forEach(function (r) {
      if (r.departamento) depts[r.departamento] = true;
    });
    return Object.keys(depts).sort(function (a, b) {
      return a.localeCompare(b, 'pt-BR');
    });
  }

  function getSubsetores() {
    ensureInicial();
    var state = getState();
    var subs = {};
    state.ramais.forEach(function (r) {
      if (r.subsetores && r.subsetores.length) {
        r.subsetores.forEach(function (s) { if (s) subs[s] = true; });
      }
    });
    return Object.keys(subs).sort(function (a, b) {
      return a.localeCompare(b, 'pt-BR');
    });
  }

  // Alias para compatibilidade com código externo
  function getSetores() {
    return getDepartamentos();
  }

  function getRamalById(id) {
    var state = getState();
    for (var i = 0; i < state.ramais.length; i++) {
      if (state.ramais[i].id === id) return state.ramais[i];
    }
    return null;
  }

  function addRamal(dados) {
    var state = getState();
    var novo = {
      id: generateId(),
      nome: dados.nome || '',
      ramal: dados.ramal || '',
      email: dados.email || '',
      departamento: dados.departamento || '',
      subsetores: dados.subsetores || [],
      regiao: dados.regiao || '',
      telefone: dados.telefone || '',
      ativo: true
    };
    state.ramais.push(novo);
    app.notifyChange();
    return novo;
  }

  function updateRamal(id, dados) {
    var state = getState();
    var r = getRamalById(id);
    if (!r) return false;
    if (dados.nome !== undefined) r.nome = dados.nome;
    if (dados.ramal !== undefined) r.ramal = dados.ramal;
    if (dados.email !== undefined) r.email = dados.email;
    if (dados.departamento !== undefined) r.departamento = dados.departamento;
    if (dados.subsetores !== undefined) r.subsetores = dados.subsetores;
    if (dados.regiao !== undefined) r.regiao = dados.regiao;
    if (dados.telefone !== undefined) r.telefone = dados.telefone;
    app.notifyChange();
    return true;
  }

  function deleteRamal(id) {
    var state = getState();
    var idx = -1;
    for (var i = 0; i < state.ramais.length; i++) {
      if (state.ramais[i].id === id) { idx = i; break; }
    }
    if (idx === -1) return false;
    state.ramais.splice(idx, 1);
    app.notifyChange();
    return true;
  }

  function toggleAtivo(id) {
    var state = getState();
    var r = getRamalById(id);
    if (!r) return false;
    r.ativo = !r.ativo;
    app.notifyChange();
    return r.ativo;
  }

  /* ── Busca / Filtro ────────────────────── */
  function filtrarRamais(termo, departamento, somenteAtivos) {
    var lista = ramaisComDuplicados();

    if (departamento && departamento !== 'todos') {
      lista = lista.filter(function (r) { return r.departamento === departamento; });
    }

    if (somenteAtivos) {
      lista = lista.filter(function (r) { return r.ativo; });
    }

    if (termo && termo.length >= 3) {
      var t = termo.toLowerCase();
      lista = lista.filter(function (r) {
        var matchSub = r.subsetores && r.subsetores.some(function (s) {
          return s.toLowerCase().indexOf(t) !== -1;
        });
        return (r.nome && r.nome.toLowerCase().indexOf(t) !== -1) ||
               (r.ramal && r.ramal.indexOf(t) !== -1) ||
               (r.email && r.email.toLowerCase().indexOf(t) !== -1) ||
               (r.departamento && r.departamento.toLowerCase().indexOf(t) !== -1) ||
               (r.regiao && r.regiao.toLowerCase().indexOf(t) !== -1) ||
               matchSub;
      });
    }

    return lista;
  }

  /* ── Orientações ───────────────────────── */
  function getOrientacoes() {
    ensureInicial();
    return getState().orientacoes;
  }

  /* ── Render ────────────────────────────── */
  var _gruposColapsados = {};
  var _sortColuna = 'departamento';
  var _sortDir = 'asc';

  function sortRamais(coluna) {
    if (_sortColuna === coluna) {
      _sortDir = _sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      _sortColuna = coluna;
      _sortDir = 'asc';
    }
    _updateSortIcons();
    refreshRamais();
  }

  function _updateSortIcons() {
    var headers = document.querySelectorAll('#view-ramais .sortable');
    for (var i = 0; i < headers.length; i++) {
      var h = headers[i];
      var col = h.getAttribute('data-sort');
      var icon = h.querySelector('i');
      if (!icon) continue;
      if (col === _sortColuna) {
        icon.className = 'fas fa-sort-' + (_sortDir === 'asc' ? 'up' : 'down') + ' ms-1';
        icon.style.opacity = '1';
      } else {
        icon.className = 'fas fa-sort ms-1';
        icon.style.opacity = '0.25';
      }
    }
  }

  function _sortLista(lista) {
    return lista.sort(function (a, b) {
      var va = (a[_sortColuna] || '').toString().toLowerCase();
      var vb = (b[_sortColuna] || '').toString().toLowerCase();
      if (_sortColuna === 'ramal') {
        va = va.padStart(4, '0');
        vb = vb.padStart(4, '0');
      }
      var cmp = va.localeCompare(vb, 'pt-BR');
      return _sortDir === 'asc' ? cmp : -cmp;
    });
  }

  function renderTabela(lista) {
    var tbody = document.getElementById('ramais-tbody');
    if (!tbody) return;

    if (lista.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Nenhum ramal encontrado</td></tr>';
      return;
    }

    // Agrupa por departamento
    var grupos = {};
    lista.forEach(function (r) {
      var s = r.departamento || 'Sem departamento';
      if (!grupos[s]) grupos[s] = [];
      grupos[s].push(r);
    });

    var nomesDepts = Object.keys(grupos).sort(function (a, b) {
      return a.localeCompare(b, 'pt-BR');
    });

    // Ordena membros dentro de cada grupo
    nomesDepts.forEach(function (s) {
      grupos[s] = _sortLista(grupos[s]);
    });

    function rowRamal(r) {
      var statusBadge = r.ativo
        ? '<span class="badge bg-success-subtle text-success x-small">Ativo</span>'
        : '<span class="badge bg-secondary-subtle text-secondary x-small">Inativo</span>';

      var dupIcon = r._duplicado
        ? ' <i class="fas fa-circle text-warning opacity-50 ms-1" title="Ramal compartilhado" style="font-size:0.4rem"></i>'
        : '';

      var subsetoresHtml = '';
      if (r.subsetores && r.subsetores.length > 0) {
        subsetoresHtml = '<br><span class="x-small text-info">' + esc(r.subsetores.join(', ')) + '</span>';
      }

      return '<tr class="ramal-row" data-departamento="' + esc(r.departamento) + '" data-id="' + r.id + '">' +
        '<td class="small ps-3">' + esc(r.nome) + subsetoresHtml + '</td>' +
        '<td class="text-center fw-bold">' + esc(r.ramal) + dupIcon + '</td>' +
        '<td class="small">' + esc(r.departamento) + (r.regiao ? ' <span class="text-muted">(' + esc(r.regiao) + ')</span>' : '') + '</td>' +
        '<td class="small text-muted">' + (r.email ? '<a href="mailto:' + esc(r.email) + '" class="text-decoration-none">' + esc(r.email) + '</a>' : '') + '</td>' +
        '<td class="text-center">' + statusBadge + '</td>' +
        '<td class="text-end pe-2">' +
          '<button class="btn btn-sm btn-outline-info border-0 px-1 me-0" onclick="MainApp.editRamal(\'' + r.id + '\')" title="Editar"><i class="fas fa-edit fa-sm"></i></button>' +
          '<button class="btn btn-sm btn-outline-' + (r.ativo ? 'warning' : 'success') + ' border-0 px-1 me-0" onclick="MainApp.toggleRamal(\'' + r.id + '\')" title="' + (r.ativo ? 'Inativar' : 'Reativar') + '"><i class="fas fa-' + (r.ativo ? 'pause' : 'play') + ' fa-sm"></i></button>' +
          '<button class="btn btn-sm btn-outline-danger border-0 px-1" onclick="MainApp.deleteRamalConfirm(\'' + r.id + '\')" title="Excluir"><i class="fas fa-trash fa-sm"></i></button>' +
        '</td>' +
      '</tr>';
    }

    var html = '';
    nomesDepts.forEach(function (dept) {
      var membros = grupos[dept];
      var colapsado = _gruposColapsados[dept] || false;
      var icon = colapsado ? 'fa-chevron-right' : 'fa-chevron-down';

      html += '<tr class="ramal-grupo-header" data-departamento="' + esc(dept) + '" onclick="MainApp.toggleGrupoRamais(\'' + esc(dept) + '\')" style="cursor:pointer;background:rgba(255,255,255,0.03)">' +
        '<td colspan="6" class="small fw-bold text-info py-2 ps-3">' +
          '<i class="fas ' + icon + ' me-2" style="font-size:0.65rem"></i>' +
          esc(dept) + ' <span class="text-muted fw-normal">(' + membros.length + ')</span>' +
        '</td>' +
      '</tr>';

      if (!colapsado) {
        membros.forEach(function (r) {
          html += rowRamal(r);
        });
      }
    });

    tbody.innerHTML = html;
  }

  function renderDepartamentoFilter() {
    var select = document.getElementById('ramal-filtro-departamento');
    if (!select) return;
    var depts = getDepartamentos();
    var atual = select.value;
    select.innerHTML = '<option value="todos">Todos os departamentos</option>' +
      depts.map(function (s) {
        return '<option value="' + esc(s) + '"' + (atual === s ? ' selected' : '') + '>' + esc(s) + '</option>';
      }).join('');
  }

  function refreshRamais() {
    var termo = document.getElementById('ramal-busca');
    var dept = document.getElementById('ramal-filtro-departamento');
    var ativos = document.getElementById('ramal-filtro-ativos');

    var t = termo ? termo.value : '';
    var s = dept ? dept.value : 'todos';
    var a = ativos ? ativos.checked : false;

    var lista = filtrarRamais(t, s, a);

    // Atualiza contador
    var counter = document.getElementById('ramais-counter');
    if (counter) {
      counter.textContent = lista.length + ' ramal(ns)';
    }

    renderTabela(lista);
    renderDepartamentoFilter();
  }

  function toggleGrupoRamais(dept) {
    _gruposColapsados[dept] = !_gruposColapsados[dept];
    refreshRamais();
  }

  function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ── Restauração de backup ─────────────── */
  function restaurarBackup() {
    try {
      var raw = localStorage.getItem('baixa_rt_data_backup_pre_departamento');
      if (!raw) { app.showToast('Nenhum backup encontrado.', 'warning'); return false; }
      var backup = JSON.parse(raw);
      if (!backup || !backup.ramais || !backup.ramais.length) { app.showToast('Backup vazio ou inválido.', 'warning'); return false; }
      // Migra o backup também (setor → departamento)
      backup.ramais.forEach(function (r) {
        if (r.setor !== undefined && r.departamento === undefined) { r.departamento = r.setor; delete r.setor; }
        if (r.subsetores === undefined) { r.subsetores = []; }
      });
      var state = getState();
      state.ramais = backup.ramais;
      state.orientacoes = backup.orientacoes || ORIENTACOES_DEFAULT;
      app._save();
      app.notifyChange();
      refreshRamais();
      app.showToast('Backup restaurado! ' + backup.ramais.length + ' ramais recuperados.', 'success');
      return true;
    } catch (e) {
      app.showToast('Erro ao restaurar backup: ' + e.message, 'danger');
      return false;
    }
  }

  /* ── Sincronização com servidor ────────── */
  function syncServer() {
    app.showToast('Puxando dados do servidor...', 'info');
    app.fetchData().then(function (backend) {
      if (backend && backend._ramais && backend._ramais.ramais && backend._ramais.ramais.length) {
        app.__state._ramais = backend._ramais;
        app.__state._ramais.ramais.forEach(function (r) {
          if (r.setor !== undefined && r.departamento === undefined) { r.departamento = r.setor; delete r.setor; }
          if (r.subsetores === undefined) { r.subsetores = []; }
        });
        app._save();
        app.notifyChange();
        refreshRamais();
        app.showToast('Sincronizado! ' + backend._ramais.ramais.length + ' ramais do servidor.', 'success');
      } else {
        app.showToast('Servidor sem dados de ramais.', 'warning');
      }
    }).catch(function () {
      app.showToast('Erro ao conectar com o servidor.', 'danger');
    });
  }

  /* ── Datalist helpers ──────────────────── */
  function populaDatalistDepartamentos() {
    var dl = document.getElementById('ramal-departamentos-list');
    if (!dl) return;
    var depts = getDepartamentos();
    dl.innerHTML = depts.map(function (d) {
      return '<option value="' + esc(d) + '">';
    }).join('');
  }

  function populaDatalistSubsetores() {
    var dl = document.getElementById('ramal-subsetores-list');
    if (!dl) return;
    var subs = getSubsetores();
    dl.innerHTML = subs.map(function (s) {
      return '<option value="' + esc(s) + '">';
    }).join('');
  }

  /* ── Modal handlers ────────────────────── */
  function openAddModal() {
    var modal = document.getElementById('ramalModal');
    if (!modal) return;
    document.getElementById('ramal-modal-title').textContent = 'Novo Ramal';
    document.getElementById('ramal-modal-id').value = '';
    document.getElementById('ramal-nome').value = '';
    document.getElementById('ramal-numero').value = '';
    document.getElementById('ramal-email').value = '';
    document.getElementById('ramal-departamento').value = '';
    document.getElementById('ramal-subsetores').value = '';
    document.getElementById('ramal-regiao').value = '';
    document.getElementById('ramal-telefone').value = '';
    // Popula datalists
    populaDatalistDepartamentos();
    populaDatalistSubsetores();
    var bsModal = bootstrap.Modal.getOrCreateInstance(modal);
    bsModal.show();
  }

  function editRamal(id) {
    var r = getRamalById(id);
    if (!r) return;
    var modal = document.getElementById('ramalModal');
    if (!modal) return;
    document.getElementById('ramal-modal-title').textContent = 'Editar Ramal';
    document.getElementById('ramal-modal-id').value = r.id;
    document.getElementById('ramal-nome').value = r.nome || '';
    document.getElementById('ramal-numero').value = r.ramal || '';
    document.getElementById('ramal-email').value = r.email || '';
    document.getElementById('ramal-departamento').value = r.departamento || '';
    document.getElementById('ramal-subsetores').value = (r.subsetores || []).join(', ');
    document.getElementById('ramal-regiao').value = r.regiao || '';
    document.getElementById('ramal-telefone').value = r.telefone || '';
    populaDatalistDepartamentos();
    populaDatalistSubsetores();
    var bsModal = bootstrap.Modal.getOrCreateInstance(modal);
    bsModal.show();
  }

  function saveRamal() {
    var id = document.getElementById('ramal-modal-id').value;
    var subsetoresRaw = document.getElementById('ramal-subsetores').value.trim();
    var subsetores = subsetoresRaw ? subsetoresRaw.split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; }) : [];
    var dados = {
      nome: document.getElementById('ramal-nome').value.trim(),
      ramal: document.getElementById('ramal-numero').value.trim(),
      email: document.getElementById('ramal-email').value.trim(),
      departamento: document.getElementById('ramal-departamento').value.trim(),
      subsetores: subsetores,
      regiao: document.getElementById('ramal-regiao').value.trim(),
      telefone: document.getElementById('ramal-telefone').value.trim()
    };

    if (!dados.nome) {
      app.showToast('Nome é obrigatório.', 'warning');
      return;
    }

    if (id) {
      updateRamal(id, dados);
      app.showToast('Ramal atualizado!', 'success');
    } else {
      addRamal(dados);
      app.showToast('Ramal adicionado!', 'success');
    }

    var modal = document.getElementById('ramalModal');
    var bsModal = bootstrap.Modal.getInstance(modal);
    if (bsModal) bsModal.hide();
    refreshRamais();
  }

  function toggleRamal(id) {
    var ativo = toggleAtivo(id);
    app.showToast(ativo ? 'Ramal reativado!' : 'Ramal inativado!', ativo ? 'success' : 'warning');
    refreshRamais();
  }

  function deleteRamalConfirm(id) {
    var r = getRamalById(id);
    if (!r) return;
    if (confirm('Excluir permanentemente o ramal de "' + r.nome + '"?\nEsta ação não pode ser desfeita.')) {
      deleteRamal(id);
      app.showToast('Ramal excluído!', 'success');
      refreshRamais();
    }
  }

  function switchRamaisTab(tab) {
    var view = document.getElementById('view-ramais');
    if (!view) return;

    // Alterna botões
    var btns = view.querySelectorAll('.ramais-tab-btn');
    for (var i = 0; i < btns.length; i++) { btns[i].classList.remove('active'); }
    var activeBtn = document.getElementById('ramais-tab-' + tab);
    if (activeBtn) activeBtn.classList.add('active');

    // Alterna panes
    var panes = view.querySelectorAll('.ramais-tab-pane');
    for (var j = 0; j < panes.length; j++) { panes[j].classList.add('d-none'); }
    var targetPane = document.getElementById('ramais-pane-' + tab);
    if (targetPane) targetPane.classList.remove('d-none');

    if (tab === 'ramais') { refreshRamais(); _updateSortIcons(); }
  }

  /* ── Init ──────────────────────────────── */
  function initRamais() {
    ensureInicial();

    // Busca com delay (dispara a partir da 3ª letra)
    var buscaInput = document.getElementById('ramal-busca');
    if (buscaInput) {
      var buscaTimer;
      buscaInput.addEventListener('input', function () {
        var val = this.value;
        if (val.length > 0 && val.length < 3) return; // não busca com < 3 letras
        clearTimeout(buscaTimer);
        buscaTimer = setTimeout(refreshRamais, 200);
      });
    }

    // Filtro por departamento
    var deptSelect = document.getElementById('ramal-filtro-departamento');
    if (deptSelect) {
      deptSelect.addEventListener('change', refreshRamais);
    }

    // Filtro somente ativos
    var ativosCheck = document.getElementById('ramal-filtro-ativos');
    if (ativosCheck) {
      ativosCheck.addEventListener('change', refreshRamais);
    }

    refreshRamais();
  }

  /* ── Expor API ─────────────────────────── */
  app.getRamais = getRamais;
  app.getSetores = getSetores;
  app.getDepartamentos = getDepartamentos;
  app.getSubsetores = getSubsetores;
  app.getRamalById = getRamalById;
  app.addRamal = addRamal;
  app.updateRamal = updateRamal;
  app.deleteRamal = deleteRamal;
  app.toggleAtivo = toggleAtivo;
  app.filtrarRamais = filtrarRamais;
  app.getOrientacoes = getOrientacoes;
  app.openAddModal = openAddModal;
  app.editRamal = editRamal;
  app.saveRamal = saveRamal;
  app.toggleRamal = toggleRamal;
  app.deleteRamalConfirm = deleteRamalConfirm;
  app.switchRamaisTab = switchRamaisTab;
  app.toggleGrupoRamais = toggleGrupoRamais;
  app.sortRamais = sortRamais;
  app.initRamais = initRamais;
  app.refreshRamais = refreshRamais;
  app.restaurarBackup = restaurarBackup;
  app.syncServer = syncServer;

}(window.MainApp));
