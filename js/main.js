/**
 * main.js — O Cérebro do Sistema (Versão Corrigida)
 */
const MainApp = (function () {
    'use strict';

    const API_BASE_URL = 'https://baixa-backend.onrender.com';
    const API_URL = `${API_BASE_URL}/api/baixa`;
    const API_HEALTH_URL = `${API_BASE_URL}/api/health`;
    let state = {
        order: [],
        customs: [],
        edits: {},
        deleted: []
    };
    const actualDate = new Date();
    const formattedDate = actualDate.toLocaleDateString('pt-BR');
    
    let lastCopiedId = null;
    let _copying = false;

    function resetCardHighlight(id) {
        if (!id) return;
        const card = document.querySelector(`[data-id="${id}"]`);
        if (!card) return;

        const contentEl = card.querySelector('.content-display');
        const originalColor = card.getAttribute('data-color') || 'light';
        
        if (contentEl) contentEl.classList.remove('fw-bold');
        card.classList.remove('shadow-lg', 'copied-active');

        const btn = card.querySelector('.btn-copy-mini');
        if (btn) {
            btn.classList.remove('btn-active');
            btn.innerHTML = '<i class="fas fa-copy"></i>';
        }
        
        if (originalColor !== 'success') {
            card.classList.remove('border-success');
            card.classList.add(`border-${originalColor}`);
        }
    }


    /* ── UI Helpers (Standardized Popups) ────────────────── */
    function showToast(message, type = 'success', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `custom-toast toast-${type}`;

        const icons = {
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            danger: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <i class="fas ${icons[type]} toast-icon"></i>
            <span class="toast-message small">${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px) scale(0.9)';
            toast.style.transition = '0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    function showConfirm(title, message, type = 'warning') {
        return new Promise((resolve) => {
            const modalEl = document.getElementById('confirmModal');
            const modal = new bootstrap.Modal(modalEl);

            document.getElementById('confirm-title').textContent = title;
            document.getElementById('confirm-message').textContent = message;

            const iconEl = document.getElementById('confirm-icon');
            const icons = {
                warning: '<i class="fas fa-question-circle fa-3x text-warning"></i>',
                danger: '<i class="fas fa-exclamation-triangle fa-3x text-danger"></i>',
                info: '<i class="fas fa-info-circle fa-3x text-info"></i>'
            };
            iconEl.innerHTML = icons[type] || icons.warning;

            const yesBtn = document.getElementById('confirm-btn-yes');
            const newYesBtn = yesBtn.cloneNode(true);
            yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);

            newYesBtn.onclick = () => {
                modal.hide();
                resolve(true);
            };

            modalEl.addEventListener('hidden.bs.modal', () => {
                resolve(false);
            }, { once: true });

            modal.show();
        });
    }

    async function loadDataFromServer() {
        try {
            const response = await fetch(API_URL);
            if (response.ok) {
                const serverData = await response.json();
                state.order = serverData.order || [];
                state.customs = serverData.customs || [];
                state.edits = serverData.edits || {};
                state.deleted = serverData.deleted || [];
                await checkBackendHealth();
            } else {
                const backupRes = await fetch('cards_backup.json');
                if (backupRes.ok) {
                    const backupData = await backupRes.json();
                    state.order = backupData.order || [];
                    state.customs = backupData.customs || [];
                    state.edits = backupData.edits || {};
                    state.deleted = backupData.deleted || [];
                }
            }
        } catch (e) {
            console.error("Erro ao conectar ao servidor:", e);
        }
        render();
    }

    function showCloudStatus(message) {
        const status = document.getElementById('gh-status');
        if (status) status.textContent = message;
    }

    async function checkBackendHealth() {
        try {
            const response = await fetch(API_HEALTH_URL);
            const health = await response.json().catch(() => ({}));
            const github = health.github || {};
            if (github.status === 'valid') showCloudStatus('GitHub configurado e ativo.');
        } catch (error) {}
    }

    async function init() {
        window.bsModal = new bootstrap.Modal(document.getElementById('cardModal'));
        window.locModal = new bootstrap.Modal(document.getElementById('locationModal'));

        const isAuth = localStorage.getItem('baixa_rt_auth') === 'true';
        if (isAuth) {
            const email = localStorage.getItem('baixa_rt_user_email') || 'usuario@portal.com';
            document.getElementById('user-display-email').textContent = email;
            
            const initials = email.split('@')[0].substring(0, 2).toUpperCase();
            document.getElementById('user-avatar').textContent = initials;

            const overlay = document.getElementById('login-overlay');
            if (overlay) {
                overlay.classList.remove('d-flex');
                overlay.classList.add('d-none');
            }
            // Só carrega dados após login confirmado
            await loadDataFromServer();
            initFiscalSearch();
            initCalculator();
            initWeather();
        } else {
            const emailInput = document.getElementById('login-email');
            const passInput = document.getElementById('login-password');
            if (emailInput) {
                [emailInput, passInput].forEach(el => {
                    el.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') checkLogin();
                    });
                });
                emailInput.focus();
            }
        }

        setupDragAndDrop();
        initPlanoInspection();
    }

    function render() {
        const grid = document.getElementById('dynamic-cards');
        if (!grid) return;

        grid.innerHTML = state.customs
            .filter(c => !state.deleted.includes(c.id))
            .map(c => ({ ...c, ...state.edits[c.id] }))
            .sort((a, b) => {
                let ia = state.order.indexOf(a.id);
                let ib = state.order.indexOf(b.id);
                return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
            })
            .map(card => {
                const color = card.color || 'light';
                const canCopy = card.type !== 'link' && card.type !== 'info';

                return `
                <div class="col-6 col-md-6 col-lg-3 mb-3">
                    <div class="card h-100 border-${color}" data-id="${card.id}" data-color="${color}" draggable="true" ${canCopy ? `onclick="MainApp.copy(this, '${card.id}')"` : ''}>
                        <div class="card-head" onclick="event.stopPropagation()">
                            <span class="handle">⠿</span>
                            <span class="card-title-header">${card.title}</span>
                            <div class="actions">
                                <i class="fa fa-pen" onclick="MainApp.edit('${card.id}')"></i>
                                <i class="fa fa-trash" onclick="MainApp.del('${card.id}')"></i>
                            </div>
                        </div>
                        <div class="content-display">${card.content}</div>
                    </div>
                </div>`;
            }).join('');
    }

    function checkLogin() {
        const emailInput = document.getElementById('login-email');
        const passInput = document.getElementById('login-password');
        const errorMsg = document.getElementById('login-error');
        const savedPass = localStorage.getItem('baixa_rt_password') || '1234';

        if (emailInput.value.includes('@') && passInput.value === savedPass) {
            localStorage.setItem('baixa_rt_auth', 'true');
            localStorage.setItem('baixa_rt_user_email', emailInput.value);
            location.reload(); // Recarrega para inicializar o app logado
        } else {
            if (errorMsg) errorMsg.classList.remove('d-none');
            if (passInput) {
                passInput.value = '';
                passInput.focus();
            }
        }
    }

    function edit(id) {
        const card = { ...state.customs.find(c => c.id === id), ...state.edits[id] };
        document.getElementById('m-id').value = id;
        document.getElementById('m-title').value = card.title;
        document.getElementById('m-content').value = card.content;
        window.bsModal.show();
    }

    async function del(id) {
        if (await showConfirm('Excluir', 'Deseja excluir este card?', 'danger')) {
            state.deleted.push(id);
            render();
            save();
        }
    }

    async function copy(el, id) {
        if (_copying) return;
        _copying = true;
        const card = document.querySelector(`[data-id="${id}"]`);
        const contentEl = card.querySelector('.content-display');
        await navigator.clipboard.writeText(contentEl.innerText);
        showToast('Copiado!');
        _copying = false;
    }

    function initFiscalSearch() {}
    function initCalculator() {}
    function initWeather() {}
    function initPlanoInspection() {}
    function setupDragAndDrop() {}
    function toggleLinkField() {}
    function save() {}
    function closeModal() { window.bsModal.hide(); }
    function logout() {
        localStorage.removeItem('baixa_rt_auth');
        location.reload();
    }

    document.addEventListener('DOMContentLoaded', init);

    // Exportação Global
    const instance = {
        edit, del, copy, closeModal, toggleLinkField,
        checkLogin, logout, init, render
    };
    window.MainApp = instance;
    return instance;
})();
