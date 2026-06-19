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
    { nome: 'Marissol Alves', ramal: '9542', email: 'marissol.alves@crf-pr.org.br', setor: 'Gabinete da Diretoria', ativo: true },
    { nome: 'Viviana Botega', ramal: '9553', email: 'viviana.botega@crf-pr.org.br', setor: 'Gabinete da Diretoria', ativo: true },

    // COMUNICAÇÃO E EVENTOS
    { nome: 'Estagiário(a)', ramal: '9571', email: '', setor: 'Comunicação e Eventos', ativo: true },
    { nome: 'Michelly Lemes', ramal: '9560', email: 'michelly.lemes@crf-pr.org.br', setor: 'Comunicação e Eventos', ativo: true },
    { nome: 'Gabriele Pereira', ramal: '9590', email: 'gabriele.pereira@crf-pr.org.br', setor: 'Comunicação e Eventos', ativo: true },
    { nome: 'Eduarda Santos', ramal: '9561', email: 'eduarda.santos@crf-pr.org.br', setor: 'Comunicação e Eventos', ativo: true },
    { nome: 'Karoline Chuery', ramal: '9575', email: 'karoline.chuery@crf-pr.org.br', setor: 'Comunicação e Eventos', ativo: true },
    { nome: 'Ygor Eckstein', ramal: '9592', email: 'ygor.eckstein@crf-pr.org.br', setor: 'Comunicação e Eventos', ativo: true },
    { nome: 'Thalles Souza', ramal: '9510', email: 'thalles.souza@crf-pr.org.br', setor: 'Comunicação e Eventos', ativo: true },
    { nome: 'Orivaldo Pinheiro', ramal: '9592', email: 'orivaldo.pinheiro@crf-pr.org.br', setor: 'Comunicação e Eventos', ativo: true },
    { nome: 'Camila Castro', ramal: '9589', email: 'camila.castro@crf-pr.org.br', setor: 'Comunicação e Eventos', ativo: true },
    { nome: 'Júlio Freitas', ramal: '9545', email: 'julio.freitas@crf-pr.org.br', setor: 'Comunicação e Eventos', ativo: true },
    { nome: 'Patrícia Shiozawa', ramal: '9501', email: 'patricia.shiozawa@crf-pr.org.br', setor: 'Comunicação e Eventos', ativo: true },

    // GERÊNCIA GERAL
    { nome: 'Tâmara Soares', ramal: '9607', email: 'tamara.soares@crf-pr.org.br', setor: 'Gerência Geral', ativo: true },
    { nome: 'Talita Fernandes', ramal: '9504', email: 'talita.fernandes@crf-pr.org.br', setor: 'Gerência Geral', ativo: true },
    { nome: 'Victoria Silva', ramal: '9507', email: 'victoria.silva@crf-pr.org.br', setor: 'Gerência Geral', ativo: true },

    // GERÊNCIA DE PLANEJAMENTO
    { nome: 'Evanize Salomão', ramal: '9503', email: 'evanize.salomao@crf-pr.org.br', setor: 'Gerência de Planejamento', ativo: true },
    { nome: 'Bruna Coutinho', ramal: '', email: 'bruna.coutinho@crf-pr.org.br', setor: 'Gerência de Planejamento', ativo: true },
    { nome: 'Viviane Possamai', ramal: '9608', email: 'viviane.possamai@crf-pr.org.br', setor: 'Gerência de Planejamento', ativo: true },
    { nome: 'Anne Lisboa', ramal: '9506', email: 'anne.lisboa@crf-pr.org.br', setor: 'Gerência de Planejamento', ativo: true },

    // ATENDIMENTO
    { nome: 'Thais Cezar', ramal: '9521', email: 'thais.cezar@crf-pr.org.br', setor: 'Atendimento', ativo: true },
    { nome: 'Sílvia Nadal', ramal: '', email: 'silvia.nadal@crf-pr.org.br', setor: 'Atendimento', ativo: true },
    { nome: 'Rafael Souza', ramal: '', email: 'rafael.souza@crf-pr.org.br', setor: 'Atendimento', ativo: true },
    { nome: 'Celita Silva', ramal: '9604', email: 'celita.silva@crf-pr.org.br', setor: 'Atendimento', ativo: true },
    { nome: 'Danilo França', ramal: '9600', email: 'danilo.franca@crf-pr.org.br', setor: 'Atendimento', ativo: true },
    { nome: 'Matheus Silveira', ramal: '9582', email: 'matheus.silveira@crf-pr.org.br', setor: 'Atendimento', ativo: true },
    { nome: 'Guilherme Pereira', ramal: '9533', email: 'guilherme.pereira@crf-pr.org.br', setor: 'Atendimento', ativo: true },
    { nome: 'Helpdesk TI', ramal: '9511', email: 'helpdesk@crf-pr.org.br', setor: 'Atendimento', ativo: true },

    // JURÍDICO
    { nome: 'Nilze Muller', ramal: '', email: 'nilze.muller@crf-pr.org.br', setor: 'Jurídico', ativo: true },
    { nome: 'Melissa Riboski', ramal: '', email: 'melissa.riboski@crf-pr.org.br', setor: 'Jurídico', ativo: true },
    { nome: 'Vinícius Amorim', ramal: '', email: 'vinicius.amorim@crf-pr.org.br', setor: 'Jurídico', ativo: true },
    { nome: 'Josiane Prado', ramal: '', email: 'josiane.prado@crf-pr.org.br', setor: 'Jurídico', ativo: true },

    // FISCALIZAÇÃO
    { nome: 'Ana Bruno', ramal: '', email: 'ana.bruno@crf-pr.org.br', setor: 'Fiscalização', ativo: true },
    { nome: 'Tayná Lima', ramal: '', email: 'tayna.lima@crf-pr.org.br', setor: 'Fiscalização', ativo: true },
    { nome: 'Eduardo Shikasho', ramal: '', email: 'eduardo.shikasho@crf-pr.org.br', setor: 'Fiscalização', ativo: true },
    { nome: 'Douglas Viegas', ramal: '', email: 'douglas.viegas@crf-pr.org.br', setor: 'Fiscalização', ativo: true },

    // CADASTRO
    { nome: 'Flávia Chaves', ramal: '', email: 'flavia.chaves@crf-pr.org.br', setor: 'Cadastro', ativo: true },
    { nome: 'Luiz Moreira', ramal: '', email: 'luiz.moreira@crf-pr.org.br', setor: 'Cadastro', ativo: true },
    { nome: 'Melany Ribeiro', ramal: '', email: 'melany.ribeiro@crf-pr.org.br', setor: 'Cadastro', ativo: true },
    { nome: 'Lourdes Pini', ramal: '', email: 'lourdes.pini@crf-pr.org.br', setor: 'Cadastro', ativo: true },
    { nome: 'Rejane Ciupka', ramal: '', email: 'rejane.ciupka@crf-pr.org.br', setor: 'Cadastro', ativo: true },
    { nome: 'Lauro Urbano', ramal: '', email: 'lauro.urbano@crf-pr.org.br', setor: 'Cadastro', ativo: true },

    // FINANCEIRO
    { nome: 'Cristiane Bregenski', ramal: '', email: 'cristiane.bregenski@crf-pr.org.br', setor: 'Financeiro', ativo: true },
    { nome: 'Maria Isabel Capel', ramal: '', email: 'maria.capel@crf-pr.org.br', setor: 'Financeiro', ativo: true },
    { nome: 'Edivar Gomes', ramal: '', email: 'edivar.gomes@crf-pr.org.br', setor: 'Financeiro', ativo: true },

    // COBRANÇA
    { nome: 'Sérgio Freitas', ramal: '', email: 'sergio.freitas@crf-pr.org.br', setor: 'Cobrança', ativo: true },
    { nome: 'Nilza Severo', ramal: '', email: 'nilza.severo@crf-pr.org.br', setor: 'Cobrança', ativo: true },
    { nome: 'Sanderval Santos', ramal: '', email: 'sanderval.santos@crf-pr.org.br', setor: 'Cobrança', ativo: true },
    { nome: 'Marcus Ribeiro', ramal: '', email: 'marcus.ribeiro@crf-pr.org.br', setor: 'Cobrança', ativo: true },

    // TÉCNICO-CIENTÍFICO
    { nome: 'Jackson Rapkiewicz', ramal: '', email: 'jackson.rapkiewicz@crf-pr.org.br', setor: 'Técnico-Científico', ativo: true },
    { nome: 'Rafaela Grobe', ramal: '', email: 'rafaela.grobe@crf-pr.org.br', setor: 'Técnico-Científico', ativo: true },
    { nome: 'Karin Zaros', ramal: '', email: 'karin.zaros@crf-pr.org.br', setor: 'Técnico-Científico', ativo: true },

    // LICITAÇÃO
    { nome: 'Ana Carolina', ramal: '9569', email: '', setor: 'Licitação', ativo: true },

    // COMPRAS
    { nome: 'Dalton Lemos', ramal: '9535', email: 'dalton.lemos@crf-pr.org.br', setor: 'Compras', ativo: true },
    { nome: 'Arindal Junior', ramal: '9603', email: 'arindal.junior@crf-pr.org.br', setor: 'Compras', ativo: true },
    { nome: 'Hennir Condore', ramal: '', email: 'hennir.condore@crf-pr.org.br', setor: 'Compras', ativo: true },
    { nome: 'Rodrigo Campilho', ramal: '9586', email: 'rodrigo.campilho@crf-pr.org.br', setor: 'Compras', ativo: true },
    { nome: 'Sara Marasca', ramal: '', email: 'sara.marasca@crf-pr.org.br', setor: 'Compras', ativo: true },

    // DIRETORIA
    { nome: 'Valquires Godoy', ramal: '', email: 'valquires.godoy@crf-pr.org.br', setor: 'Diretoria', ativo: true },
    { nome: 'Márcio Antoniassi', ramal: '', email: 'marcio.antoniassi@crf-pr.org.br', setor: 'Diretoria', ativo: true },
    { nome: 'Ana Sakashita', ramal: '', email: 'ana.sakashita@crf-pr.org.br', setor: 'Diretoria', ativo: true },
    { nome: 'Graziela Guidolin', ramal: '9568', email: 'graziela.guidolin@crf-pr.org.br', setor: 'Diretoria', ativo: true },

    // ÉTICA
    { nome: 'Fernanda Penteado', ramal: '', email: 'fernanda.penteado@crf-pr.org.br', setor: 'Ética', ativo: true },
    { nome: 'Edneia Magri', ramal: '', email: 'edneia.magri@crf-pr.org.br', setor: 'Ética', ativo: true },

    // PESSOAL
    { nome: 'Ana Cláudia Pereira', ramal: '', email: 'ana.pereira@crf-pr.org.br', setor: 'Pessoal', ativo: true },
    { nome: 'Marcel Michalski', ramal: '9547', email: 'marcel.michalski@crf-pr.org.br', setor: 'Pessoal', ativo: true },
    { nome: 'Ana Souza', ramal: '', email: 'ana.souza@crf-pr.org.br', setor: 'Pessoal', ativo: true },

    // FISCAIS
    { nome: 'Eduardo Freitas', ramal: '', email: 'eduardo.freitas@crf-pr.org.br', setor: 'Fiscais', ativo: true, regiao: 'Curitiba' },
    { nome: 'Edson Garcia', ramal: '', email: 'edson.garcia@crf-pr.org.br', setor: 'Fiscais', ativo: true, regiao: 'Londrina' },
    { nome: 'Daiane Perondi', ramal: '', email: 'daiane.perondi@crf-pr.org.br', setor: 'Fiscais', ativo: true },
    { nome: 'Luciano Gonçalves', ramal: '', email: 'luciano.goncalves@crf-pr.org.br', setor: 'Fiscais', ativo: true, regiao: 'Maringá' },
    { nome: 'Marcelo Polak', ramal: '', email: 'marcelo.polak@crf-pr.org.br', setor: 'Fiscais', ativo: true, regiao: 'Curitiba' },
    { nome: 'Nayana Banhara', ramal: '', email: 'nayana.banhara@crf-pr.org.br', setor: 'Fiscais', ativo: true, regiao: 'Curitiba' },
    { nome: 'Ribamar Schmitz', ramal: '', email: 'ribamar.schmitz@crf-pr.org.br', setor: 'Fiscais', ativo: true },
    { nome: 'Paulo Marchesini', ramal: '', email: 'paulo.marchesini@crf-pr.org.br', setor: 'Fiscais', ativo: true, regiao: 'Maringá' },
    { nome: 'Débora Yoshizawa', ramal: '', email: 'debora.yoshizawa@crf-pr.org.br', setor: 'Fiscais', ativo: true, regiao: 'Ponta Grossa' },
    { nome: 'Edson Alves', ramal: '', email: 'edson.alves@crf-pr.org.br', setor: 'Fiscais', ativo: true, regiao: 'Cascavel' },
    { nome: 'Welinson Silva', ramal: '', email: 'welison.silva@crf-pr.org.br', setor: 'Fiscais', ativo: true },
    { nome: 'Elias Montin', ramal: '', email: 'elias.montin@crf-pr.org.br', setor: 'Fiscais', ativo: true, regiao: 'Curitiba' },
    { nome: 'Eduardo Pazim', ramal: '', email: 'eduardo.pazim@crf-pr.org.br', setor: 'Fiscais', ativo: true, regiao: 'Curitiba' },
    { nome: 'Josineia Baum', ramal: '', email: 'josineia.baum@crf-pr.org.br', setor: 'Fiscais', ativo: true, regiao: 'Norte Pioneiro' },

    // SECCIONAIS
    { nome: 'Seccional Cascavel', ramal: '', email: 'cascavel@crf-pr.org.br', setor: 'Seccionais', ativo: true, telefone: '(41) 99838-0880' },
    { nome: 'Seccional Londrina', ramal: '', email: 'londrina@crf-pr.org.br', setor: 'Seccionais', ativo: true, telefone: '(41) 99838-0660' },
    { nome: 'Seccional Ponta Grossa', ramal: '', email: 'pontagrossa@crf-pr.org.br', setor: 'Seccionais', ativo: true, telefone: '(41) 99838-0550' },
    { nome: 'Seccional Maringá', ramal: '', email: 'maringa@crf-pr.org.br', setor: 'Seccionais', ativo: true, telefone: '(41) 99838-0770' },

    // COPA
    { nome: 'Copa', ramal: '9578', email: '', setor: 'Copa', ativo: true }
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

  function getSetores() {
    ensureInicial();
    var state = getState();
    var setores = {};
    state.ramais.forEach(function (r) {
      if (r.setor) setores[r.setor] = true;
    });
    return Object.keys(setores).sort(function (a, b) {
      return a.localeCompare(b, 'pt-BR');
    });
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
      setor: dados.setor || '',
      regiao: dados.regiao || '',
      telefone: dados.telefone || '',
      ativo: true
    };
    state.ramais.push(novo);
    app._save();
    return novo;
  }

  function updateRamal(id, dados) {
    var state = getState();
    var r = getRamalById(id);
    if (!r) return false;
    if (dados.nome !== undefined) r.nome = dados.nome;
    if (dados.ramal !== undefined) r.ramal = dados.ramal;
    if (dados.email !== undefined) r.email = dados.email;
    if (dados.setor !== undefined) r.setor = dados.setor;
    if (dados.regiao !== undefined) r.regiao = dados.regiao;
    if (dados.telefone !== undefined) r.telefone = dados.telefone;
    app._save();
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
    app._save();
    return true;
  }

  function toggleAtivo(id) {
    var state = getState();
    var r = getRamalById(id);
    if (!r) return false;
    r.ativo = !r.ativo;
    app._save();
    return r.ativo;
  }

  /* ── Busca / Filtro ────────────────────── */
  function filtrarRamais(termo, setor, somenteAtivos) {
    var lista = ramaisComDuplicados();

    if (setor && setor !== 'todos') {
      lista = lista.filter(function (r) { return r.setor === setor; });
    }

    if (somenteAtivos) {
      lista = lista.filter(function (r) { return r.ativo; });
    }

    if (termo && termo.length >= 3) {
      var t = termo.toLowerCase();
      lista = lista.filter(function (r) {
        return (r.nome && r.nome.toLowerCase().indexOf(t) !== -1) ||
               (r.ramal && r.ramal.indexOf(t) !== -1) ||
               (r.email && r.email.toLowerCase().indexOf(t) !== -1) ||
               (r.setor && r.setor.toLowerCase().indexOf(t) !== -1) ||
               (r.regiao && r.regiao.toLowerCase().indexOf(t) !== -1);
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

  function renderTabela(lista) {
    var tbody = document.getElementById('ramais-tbody');
    if (!tbody) return;

    if (lista.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Nenhum ramal encontrado</td></tr>';
      return;
    }

    // Agrupa por setor
    var grupos = {};
    lista.forEach(function (r) {
      var s = r.setor || 'Sem setor';
      if (!grupos[s]) grupos[s] = [];
      grupos[s].push(r);
    });

    var nomesSetores = Object.keys(grupos).sort(function (a, b) {
      return a.localeCompare(b, 'pt-BR');
    });

    function rowRamal(r) {
      var statusBadge = r.ativo
        ? '<span class="badge bg-success-subtle text-success x-small">Ativo</span>'
        : '<span class="badge bg-secondary-subtle text-secondary x-small">Inativo</span>';

      var dupIcon = r._duplicado
        ? ' <i class="fas fa-circle text-warning opacity-50 ms-1" title="Ramal compartilhado" style="font-size:0.4rem"></i>'
        : '';

      return '<tr class="ramal-row" data-setor="' + esc(r.setor) + '" data-id="' + r.id + '">' +
        '<td class="small ps-3">' + esc(r.nome) + '</td>' +
        '<td class="text-center fw-bold">' + esc(r.ramal) + dupIcon + '</td>' +
        '<td class="small">' + esc(r.setor) + (r.regiao ? ' <span class="text-muted">(' + esc(r.regiao) + ')</span>' : '') + '</td>' +
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
    nomesSetores.forEach(function (setor) {
      var membros = grupos[setor];
      var colapsado = _gruposColapsados[setor] || false;
      var icon = colapsado ? 'fa-chevron-right' : 'fa-chevron-down';

      html += '<tr class="ramal-grupo-header" data-setor="' + esc(setor) + '" onclick="MainApp.toggleGrupoRamais(\'' + esc(setor) + '\')" style="cursor:pointer;background:rgba(255,255,255,0.03)">' +
        '<td colspan="6" class="small fw-bold text-info py-2 ps-3">' +
          '<i class="fas ' + icon + ' me-2" style="font-size:0.65rem"></i>' +
          esc(setor) + ' <span class="text-muted fw-normal">(' + membros.length + ')</span>' +
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

  function renderSetorFilter() {
    var select = document.getElementById('ramal-filtro-setor');
    if (!select) return;
    var setores = getSetores();
    var atual = select.value;
    select.innerHTML = '<option value="todos">Todos os setores</option>' +
      setores.map(function (s) {
        return '<option value="' + esc(s) + '"' + (atual === s ? ' selected' : '') + '>' + esc(s) + '</option>';
      }).join('');
  }

  function refreshRamais() {
    var termo = document.getElementById('ramal-busca');
    var setor = document.getElementById('ramal-filtro-setor');
    var ativos = document.getElementById('ramal-filtro-ativos');

    var t = termo ? termo.value : '';
    var s = setor ? setor.value : 'todos';
    var a = ativos ? ativos.checked : false;

    var lista = filtrarRamais(t, s, a);

    // Atualiza contador
    var counter = document.getElementById('ramais-counter');
    if (counter) {
      counter.textContent = lista.length + ' ramal(ns)';
    }

    renderTabela(lista);
    renderSetorFilter();
  }

  function toggleGrupoRamais(setor) {
    _gruposColapsados[setor] = !_gruposColapsados[setor];
    refreshRamais();
  }

  function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
    document.getElementById('ramal-setor').value = '';
    document.getElementById('ramal-regiao').value = '';
    document.getElementById('ramal-telefone').value = '';
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
    document.getElementById('ramal-setor').value = r.setor || '';
    document.getElementById('ramal-regiao').value = r.regiao || '';
    document.getElementById('ramal-telefone').value = r.telefone || '';
    var bsModal = bootstrap.Modal.getOrCreateInstance(modal);
    bsModal.show();
  }

  function saveRamal() {
    var id = document.getElementById('ramal-modal-id').value;
    var dados = {
      nome: document.getElementById('ramal-nome').value.trim(),
      ramal: document.getElementById('ramal-numero').value.trim(),
      email: document.getElementById('ramal-email').value.trim(),
      setor: document.getElementById('ramal-setor').value.trim(),
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

    if (tab === 'ramais') refreshRamais();
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

    // Filtro por setor
    var setorSelect = document.getElementById('ramal-filtro-setor');
    if (setorSelect) {
      setorSelect.addEventListener('change', refreshRamais);
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
  app.initRamais = initRamais;
  app.refreshRamais = refreshRamais;

}(window.MainApp));
