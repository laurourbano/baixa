/**
 * gh-backup.js — Backup e restore via GitHub API
 *
 * @module gh-backup
 * @description
 * Permite fazer backup e restaurar dados usando a API do GitHub.
 *
 * Funcionalidades:
 * - Autenticação por token GitHub (permissão repo)
 * - Backup: PUT do estado completo no repositório do usuário
 * - Restore: GET e aplicação do estado salvo
 * - Suporte a migração de formato antigo (dashboard único) para multi-dashboard
 * - Interface via modal de configurações
 *
 * Requer:
 * - Token GitHub com permissão `repo`
 * - Nome do repositório no formato `usuario/repo`
 *
 * @namespace MainApp
 */
window.MainApp = window.MainApp || {};

(function (app) {
  'use strict';

  function cloudBackup() {
    var token = document.getElementById('gh-token').value.trim();
    var repo = document.getElementById('gh-repo').value.trim();
    var status = document.getElementById('gh-status');

    if (!token || !repo) {
      app.showToast('Preencha token e repositório.', 'warning');
      return Promise.resolve();
    }

    var headers = {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github.v3+json'
    };

    var username = null;

    return fetch('https://api.github.com/user', { headers: headers })
      .then(function (r) {
        if (r.status !== 200) throw new Error('Token inválido');
        return r.json();
      })
      .then(function (user) {
        username = user.login;
        // Verifica se o arquivo já existe para pegar o SHA
        return fetch('https://api.github.com/repos/' + username + '/' + repo + '/contents/cards_backup.json', { headers: headers });
      })
      .then(function (r) {
        if (r.ok) return r.json().then(function (f) { return f.sha; });
        return null;
      })
      .then(function (sha) {
        var content = btoa(unescape(encodeURIComponent(JSON.stringify(app.__state, null, 2))));
        var body = {
          message: 'Backup via Baixa RT: ' + new Date().toISOString(),
          content: content
        };
        if (sha) body.sha = sha;

        return fetch('https://api.github.com/repos/' + username + '/' + repo + '/contents/cards_backup.json', {
          method: 'PUT',
          headers: Object.assign({}, headers, { 'Content-Type': 'application/json' }),
          body: JSON.stringify(body)
        });
      })
      .then(function (r) {
        if (!r.ok) throw new Error('Falha ao salvar backup');
        // Salva token e repo no localStorage
        localStorage.setItem('gh_token', token);
        localStorage.setItem('gh_repo', repo);
        if (status) {
          status.className = 'badge bg-transparent border border-success x-small text-success';
          status.innerHTML = '<i class="fas fa-check-circle me-1"></i>Backup ok!';
          status.title = 'Backup salvo no GitHub';
        }
        app.showToast('Backup salvo no GitHub!', 'success');
      })
      .catch(function (err) {
        app.showToast('Erro no backup: ' + err.message, 'danger');
        if (status) {
          status.className = 'badge bg-transparent border border-danger x-small text-danger';
          status.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i>Erro no backup';
        }
      });
  }

  function cloudRestore() {
    var token = document.getElementById('gh-token').value.trim();
    var repo = document.getElementById('gh-repo').value.trim();
    var status = document.getElementById('gh-status');

    if (!token || !repo) {
      app.showToast('Preencha token e repositório.', 'warning');
      return Promise.resolve();
    }

    var headers = {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github.v3+json'
    };

    var username = null;

    return app.showConfirm('Restaurar Backup', 'Deseja restaurar o backup do GitHub? Isso substituirá todos os dados locais.', 'warning')
      .then(function (confirmed) {
        if (!confirmed) return Promise.reject(new Error('cancel'));
        return fetch('https://api.github.com/user', { headers: headers });
      })
      .then(function (r) {
        if (r.status !== 200) throw new Error('Token inválido');
        return r.json();
      })
      .then(function (user) {
        username = user.login;
        return fetch('https://api.github.com/repos/' + username + '/' + repo + '/contents/cards_backup.json', { headers: headers });
      })
      .then(function (r) {
        if (!r.ok) throw new Error('Arquivo de backup não encontrado');
        return r.json();
      })
      .then(function (file) {
        var decoded = JSON.parse(atob(file.content));
        if (decoded.dashboards) {
          app.__state.dashboards = decoded.dashboards;
          app.__state.activeDashboard = decoded.activeDashboard || decoded.dashboards[0].id;
          app.__state.dashSortMode = decoded.dashSortMode || 'custom';
        } else if (decoded.order || decoded.customs) {
          // Formato antigo (flat) — migrar para multi-dashboard
          var activeDash = app.getActiveDash();
          activeDash.order = decoded.order || [];
          activeDash.customs = decoded.customs || [];
          activeDash.edits = decoded.edits || {};
          activeDash.deleted = decoded.deleted || [];
        }
        app.__state.servicos = decoded.servicos || {};
        app._save();
        localStorage.setItem('gh_token', token);
        localStorage.setItem('gh_repo', repo);
        app.render();
        app.initDashboards();
        if (status) {
          status.className = 'badge bg-transparent border border-success x-small text-success';
          status.innerHTML = '<i class="fas fa-cloud-download-alt me-1"></i>Sincronizado!';
          status.title = 'Dados restaurados do GitHub';
        }
        app.showToast('Backup restaurado com sucesso!', 'success');
      })
      .catch(function (err) {
        if (err.message === 'cancel') return;
        app.showToast('Erro ao restaurar: ' + err.message, 'danger');
        if (status) {
          status.className = 'badge bg-transparent border border-danger x-small text-danger';
          status.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i>Erro ao restaurar';
        }
      });
  }

  app.cloudBackup = cloudBackup;
  app.cloudRestore = cloudRestore;
}(window.MainApp));
