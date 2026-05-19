/**
 * main.js — Versão Corrigida e Limpa (Sem Login)
 */

const MainApp = (function () {
    'use strict';

    const API_BASE_URL = (typeof window !== 'undefined' && window.__API_BASE_URL__) ? window.__API_BASE_URL__ : 'https://baixa-backend.onrender.com';
    const API_URL = `${API_BASE_URL}/api/baixa`;
    const API_HEALTH_URL = `${API_BASE_URL}/api/health`;

    let state = {
        order: [],
        customs: [],
        edits: {},
        deleted: []
    };

    let _copying = false;

    /* ====================== TOAST & CONFIRM ====================== */
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
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    function showConfirm(title, message, type = 'warning') {
        return new Promise((resolve) => {
            const modalEl = document.getElementById('confirmModal');
            if (!modalEl) return resolve(false);

            const modal = new bootstrap.Modal(modalEl);
            document.getElementById('confirm-title').textContent = title;
            document.getElementById('confirm-message').textContent = message;

            const iconEl = document.getElementById('confirm-icon');
            iconEl.innerHTML = type === 'danger'
                ? '<i class="fas fa-exclamation-triangle fa-3x text-danger"></i>'
                : '<i class="fas fa-question-circle fa-3x text-warning"></i>';

            const yesBtn = document.getElementById('confirm-btn-yes');
            const newYesBtn = yesBtn.cloneNode(true);
            yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);

            newYesBtn.onclick = () => {
                modal.hide();
                resolve(true);
            };

            modalEl.addEventListener('hidden.bs.modal', () => resolve(false), { once: true });
            modal.show();
        });
    }

    /* ====================== DATA ====================== */
    async function loadDataFromServer() {
        try {
            const response = await fetch(API_URL);
            if (response.ok) {
                const serverData = await response.json();
                // If server returned no cards, try local backup
                if (Array.isArray(serverData.customs) && serverData.customs.length === 0) {
                    const backupRes = await fetch('cards_backup.json').catch(() => ({ ok: false }));
                    if (backupRes && backupRes.ok) {
                        const backupData = await backupRes.json();
                        state.order = backupData.order || [];
                        state.customs = backupData.customs || [];
                        state.edits = backupData.edits || {};
                        state.deleted = backupData.deleted || [];
                    } else {
                        state.order = serverData.order || [];
                        state.customs = serverData.customs || [];
                        state.edits = serverData.edits || {};
                        state.deleted = serverData.deleted || [];
                    }
                } else {
                    state.order = serverData.order || [];
                    state.customs = serverData.customs || [];
                    state.edits = serverData.edits || {};
                    state.deleted = serverData.deleted || [];
                }
            } else {
                // fallback local
                const backupRes = await fetch('cards_backup.json');
                if (backupRes.ok) {
                    const backupData = await backupRes.json();
                    Object.assign(state, backupData);
                }
            }
        } catch (e) {
            console.warn("Backend indisponível, usando dados locais se existirem.");
        }
        render();
    }

    /* ====================== RENDER ====================== */
    function render() {
        const grid = document.getElementById('dynamic-cards');
        if (!grid) return;

        const filtered = state.customs
            .filter(c => !state.deleted.includes(c.id))
            .map(c => ({ ...c, ...(state.edits[c.id] || {}) }));

        const sorted = filtered.sort((a, b) => {
            const ia = state.order.indexOf(a.id);
            const ib = state.order.indexOf(b.id);
            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        });

        grid.innerHTML = sorted.map(card => {
            const color = card.color || 'light';
            const canCopy = card.type !== 'link' && card.type !== 'info';

            return `
                <div class="col-6 col-md-6 col-lg-3 mb-3">
                    <div class="card h-100 border-${color}" 
                         data-id="${card.id}" 
                         data-color="${color}" 
                         draggable="true"
                         ${canCopy ? `onclick="MainApp.copy(this, '${card.id}')"` : ''}>
                        <div class="card-head" onclick="event.stopPropagation()">
                            <span class="handle">⠿</span>
                            <span class="card-title-header">${card.title || ''}</span>
                            <div class="actions">
                                <i class="fa fa-pen" onclick="MainApp.edit('${card.id}'); event.stopPropagation();"></i>
                                <i class="fa fa-trash" onclick="MainApp.del('${card.id}'); event.stopPropagation();"></i>
                            </div>
                        </div>
                        <div class="content-display">${card.content || ''}</div>
                    </div>
                </div>`;
        }).join('');
    }

    /* ====================== CRUD ====================== */
    function edit(id) {
        const card = { ...state.customs.find(c => c.id === id), ...state.edits[id] };
        document.getElementById('m-id').value = id;
        document.getElementById('m-title').value = card.title || '';
        document.getElementById('m-content').value = card.content || '';
        window.bsModal.show();
    }

    async function del(id) {
        if (await showConfirm('Excluir Card', 'Deseja realmente excluir este card?', 'danger')) {
            state.deleted.push(id);
            render();
            save();
            showToast('Card excluído', 'danger');
        }
    }

    async function copy(el, id) {
        if (_copying) return;
        _copying = true;

        try {
            const card = document.querySelector(`[data-id="${id}"]`);
            const contentEl = card.querySelector('.content-display');
            await navigator.clipboard.writeText(contentEl.innerText.trim());
            showToast('Copiado para a área de transferência!');
        } catch (err) {
            showToast('Erro ao copiar', 'danger');
        }

        _copying = false;
    }

    function closeModal() {
        if (window.bsModal) window.bsModal.hide();
    }

    function logout() {
        if (confirm('Deseja sair do sistema?')) {
            localStorage.removeItem('baixa_rt_auth');
            location.reload();
        }
    }

    /* ====================== INIT ====================== */
    async function init() {
        // Inicializa modais
        window.bsModal = new bootstrap.Modal(document.getElementById('cardModal'));
        window.locModal = new bootstrap.Modal(document.getElementById('locationModal'));

        // Desabilita login completamente
        localStorage.setItem('baixa_rt_auth', 'true');
        localStorage.setItem('baixa_rt_user_email', 'usuario@portal.com');

        const overlay = document.getElementById('login-overlay');
        if (overlay) {
            overlay.classList.add('d-none');
            overlay.classList.remove('d-flex');
        }

        await loadDataFromServer();

        // Inicializa módulos adicionais
        initFiscalSearch();
        initCalculator();
        initWeather();
        initPlanoInspection();
        setupDragAndDrop();
    }

    // ====================== STUBS ======================
    function initFiscalSearch() { }
    function initCalculator() { }
    function initWeather() { }
    function initPlanoInspection() { }
    function setupDragAndDrop() { }
    function toggleLinkField() { }
    function save() { /* implemente seu save aqui */ }

    // ====================== INICIALIZAÇÃO ======================
    document.addEventListener('DOMContentLoaded', init);

    // Exporta para o window
    return {
        init,
        render,
        edit,
        del,
        copy,
        closeModal,
        toggleLinkField,
        logout,
        save
    };
})();

// Torna MainApp acessível globalmente
window.MainApp = MainApp;