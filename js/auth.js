/**
 * auth.js — Autenticação local
 *
 * @module auth
 * @description
 * Gerencia autenticação local do usuário no frontend.
 *
 * Funcionalidades:
 * - checkLogin: valida email + senha de 4 dígitos (padrão: "1234")
 * - forgotPassword: exibe diálogo de recuperação de senha
 * - updatePassword: altera senha com validações (tamanho mínimo, não repetida)
 * - logout: remove autenticação e recarrega a página
 *
 * Armazenamento:
 * - Senha: localStorage (baixa_rt_password)
 * - Sessão: localStorage (baixa_rt_auth)
 * - Email: localStorage (baixa_rt_user_email)
 *
 * @namespace MainApp
 */
window.MainApp = window.MainApp || {};

(function (app) {
  'use strict';

  function checkLogin() {
    var emailInput = document.getElementById('login-email');
    var passInput = document.getElementById('login-password');
    var errorMsg = document.getElementById('login-error');
    var savedPass = localStorage.getItem('baixa_rt_password') || '1234';

    if (emailInput.value.indexOf('@') > -1 && passInput.value === savedPass) {
      localStorage.setItem('baixa_rt_auth', 'true');
      localStorage.setItem('baixa_rt_user_email', emailInput.value);

      document.getElementById('user-display-email').textContent = emailInput.value;
      document.getElementById('modal-email').textContent = emailInput.value;

      var initials = emailInput.value.split('@')[0].substring(0, 2).toUpperCase();
      document.getElementById('user-avatar').textContent = initials;
      document.getElementById('modal-avatar').textContent = initials;

      document.getElementById('login-overlay').classList.add('hidden');
      app.showToast('Bem-vindo, ' + emailInput.value.split('@')[0] + '!', 'success');

      // Carrega dados e inicializa o app após login bem-sucedido
      if (app.loadAndInit) app.loadAndInit();
    } else {
      errorMsg.classList.remove('d-none');
      passInput.value = '';
      passInput.focus();

      var card = document.querySelector('.login-card');
      card.style.animation = 'none';
      void card.offsetWidth;
      card.style.animation = 'pop-in 0.3s ease, shake 0.4s ease';
    }
  }

  function forgotPassword(e) {
    if (e) e.preventDefault();
    var email = document.getElementById('login-email').value;
    if (!email || email.indexOf('@') === -1) {
      app.showToast('Por favor, insira um e-mail válido primeiro.', 'warning');
      return;
    }
    app.showConfirm('Recuperar Senha', 'Deseja enviar um link de redefinição para ' + email + '?', 'info').then(function (confirmed) {
      if (confirmed) {
        app.showToast('Link de redefinição enviado para o seu e-mail!', 'info', 5000);
      }
    });
  }

  function updatePassword() {
    var oldPass = document.getElementById('old-password').value;
    var p1 = document.getElementById('new-password').value;
    var p2 = document.getElementById('confirm-new-password').value;
    var savedPass = localStorage.getItem('baixa_rt_password') || '1234';

    if (oldPass !== savedPass) {
      app.showToast('A senha anterior está incorreta!', 'danger');
      return;
    }
    if (!p1 || p1.length < 4) {
      app.showToast('A nova senha deve ter pelo menos 4 dígitos', 'warning');
      return;
    }
    if (p1 === oldPass) {
      app.showToast('A nova senha não pode ser igual à anterior!', 'warning');
      return;
    }
    if (p1 !== p2) {
      app.showToast('As novas senhas não coincidem!', 'danger');
      return;
    }

    localStorage.setItem('baixa_rt_password', p1);
    app.showToast('Senha alterada com sucesso!', 'success');
    bootstrap.Modal.getInstance(document.getElementById('settingsModal')).hide();

    document.getElementById('old-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-new-password').value = '';
  }

  function logout() {
    localStorage.removeItem('baixa_rt_auth');
    location.reload();
  }

  app.checkLogin = checkLogin;
  app.forgotPassword = forgotPassword;
  app.updatePassword = updatePassword;
  app.logout = logout;
}(window.MainApp));
