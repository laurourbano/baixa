/**
 * servicos.js — Modelos de parecer por tipo de serviço
 *
 * @module servicos
 * @description
 * Gerencia templates de parecer para 5 tipos de serviço.
 *
 * Serviços disponíveis:
 * - ingresso-pj: Ingresso de Pessoa Jurídica
 * - inscricao-pf: Inscrição de Pessoa Física
 * - contratos: Controle de Contratos
 * - conf-pf: Conferência de Pessoa Física
 * - conf-pj: Conferência de Pessoa Jurídica
 *
 * Funcionalidades:
 * - Textarea editável para cada serviço com persistência em localStorage
 * - Botão de cópia via Clipboard API
 * - Salvamento automático ao editar
 *
 * @namespace MainApp
 */
window.MainApp = window.MainApp || {};

(function (app) {
  'use strict';

  /* ── Serviços disponíveis ─────────────── */
  var SERVICO_IDS = [
    'ingresso-pj',
    'inscricao-pf',
    'contratos',
    'conf-pf',
    'conf-pj'
  ];

  /* ── Inicialização ────────────────────── */
  function initServicos() {
    // Garante que o objeto servicos existe no estado
    if (!app.__state.servicos) {
      app.__state.servicos = {};
    }
    // Inicializa cada serviço com valores padrão se não existir
    SERVICO_IDS.forEach(function (id) {
      if (!app.__state.servicos[id]) {
        app.__state.servicos[id] = {
          conteudo: '',
          atualizadoEm: null
        };
      }
    });
    app._save();
  }

  /* ── Carregar conteúdo no textarea ────── */
  function loadServico(id) {
    var textarea = document.getElementById('servico-content-' + id);
    if (!textarea) return;
    var dados = app.__state.servicos && app.__state.servicos[id]
      ? app.__state.servicos[id]
      : { conteudo: '', atualizadoEm: null };
    textarea.value = dados.conteudo || '';
    // Atualiza status de última modificação
    updateStatus(id, dados.atualizadoEm);
  }

  /* ── Salvar conteúdo do textarea ──────── */
  function saveServico(id) {
    var textarea = document.getElementById('servico-content-' + id);
    if (!textarea) return;
    var now = new Date().toISOString();
    app.__state.servicos[id] = {
      conteudo: textarea.value,
      atualizadoEm: now
    };
    app._save();
    app.showToast('Modelo de parecer salvo com sucesso!', 'success', 2500);
    updateStatus(id, now);
    // Dispara sincronização com backend
    if (typeof app.notifyChange === 'function') {
      app.notifyChange();
    }
  }

  /* ── Copiar conteúdo para clipboard ───── */
  function copyServico(id) {
    var textarea = document.getElementById('servico-content-' + id);
    if (!textarea || !textarea.value.trim()) {
      app.showToast('Nenhum conteúdo para copiar.', 'warning', 2500);
      return;
    }
    navigator.clipboard.writeText(textarea.value).then(function () {
      app.showToast('Texto copiado para a área de transferência!', 'success', 2500);
    }).catch(function () {
      // Fallback para navegadores antigos
      textarea.select();
      textarea.setSelectionRange(0, 99999999);
      try {
        document.execCommand('copy');
        app.showToast('Texto copiado!', 'success', 2500);
      } catch (e) {
        app.showToast('Falha ao copiar texto.', 'danger', 3000);
      }
    });
  }

  /* ── Atualizar indicador de status ────── */
  function updateStatus(id, updatedAt) {
    var statusEl = document.getElementById('servico-status-' + id);
    if (!statusEl) return;
    if (updatedAt) {
      var d = new Date(updatedAt);
      var formatted = d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      statusEl.textContent = 'Última alteração: ' + formatted;
    } else {
      statusEl.textContent = '';
    }
  }

  /* ── Expor API pública ────────────────── */
  app.initServicos = initServicos;
  app.loadServico = loadServico;
  app.saveServico = saveServico;
  app.copyServico = copyServico;

}(window.MainApp));
