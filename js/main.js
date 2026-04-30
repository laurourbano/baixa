/**
 * main.js — O Cérebro do Sistema (Versão com CONTEÚDO COMPLETO)
 */
const MainApp = (function () {
    'use strict';

    const STORAGE_KEY = 'baixa_rt_data';
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
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

        // Evitar duplicidade de mensagens idênticas
        const existingMessages = Array.from(container.querySelectorAll('.toast-message'));
        if (existingMessages.some(m => m.textContent === message)) return;

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

            // Limpa event listeners antigos
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

    // Os dados agora vêm exclusivamente do arquivo cards_backup.json

    async function init() {
        // Inicializa os modais do Bootstrap
        window.bsModal = new bootstrap.Modal(document.getElementById('cardModal'));
        window.locModal = new bootstrap.Modal(document.getElementById('locationModal'));

        // Verifica Autenticação
        const isAuth = localStorage.getItem('baixa_rt_auth') === 'true';
        if (isAuth) {
            const email = localStorage.getItem('baixa_rt_user_email') || 'usuario@portal.com';
            document.getElementById('user-display-email').textContent = email;
            document.getElementById('modal-email').textContent = email;
            
            // Iniciais para o avatar
            const initials = email.split('@')[0].substring(0, 2).toUpperCase();
            document.getElementById('user-avatar').textContent = initials;
            document.getElementById('modal-avatar').textContent = initials;

            document.getElementById('login-overlay').classList.add('hidden');
        } else {
            // Focar no campo de e-mail se não estiver logado
            const emailInput = document.getElementById('login-email');
            const passInput = document.getElementById('login-password');

            [emailInput, passInput].forEach(el => {
                el.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') checkLogin();
                });
            });

            emailInput.focus();
        }

        // Carrega dados do backup local (arquivo cards_backup.json é a fonte da verdade)
        try {
            const response = await fetch('cards_backup.json');
            if (response.ok) {
                const backupData = await response.json();

                // Sobrescreve o estado local com o backup de forma estrita
                state.order = backupData.order || [];
                state.customs = backupData.customs || [];
                state.edits = backupData.edits || {};
                state.deleted = backupData.deleted || [];

                save();
            }
        } catch (e) {
            console.error("Erro ao carregar backup:", e);
            // Se falhar o fetch, mantém o que está no localStorage como fallback
        }

        render();
        setupDragAndDrop();
        initFiscalSearch();
        initCalculator();
        initPlanoInspection();
        initWeather();

        // Listener para Enter no modal de localização
        const weatherFilter = document.getElementById('weather-city-filter');
        if (weatherFilter) {
            weatherFilter.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const select = document.getElementById('weather-city-select');
                    if (select.value) saveLocationManual(select.value);
                }
            });
        }

        // Eventos de Focus Automático nos Modais
        document.getElementById('cardModal').addEventListener('shown.bs.modal', () => {
            document.getElementById('m-title').focus();
        });

        document.getElementById('settingsModal').addEventListener('shown.bs.modal', () => {
            document.getElementById('old-password').focus();
        });

        document.getElementById('locationModal').addEventListener('shown.bs.modal', () => {
            const filter = document.getElementById('weather-city-filter');
            if (filter) filter.focus();
        });

        window.saveCard = saveCard;

        const savedToken = localStorage.getItem('gh_token');
        if (savedToken) document.getElementById('gh-token').value = savedToken;

        const savedRepo = localStorage.getItem('gh_repo');
        if (savedRepo) document.getElementById('gh-repo').value = savedRepo;

        save();
    }

    /* ── Renderização ────────────────────────────────────── */
    function render() {
        const grid = document.getElementById('dynamic-cards');
        if (!grid) return;

        grid.innerHTML = state.customs
            .filter(c => !state.deleted.includes(c.id))
            .map(c => ({ ...c, ...state.edits[c.id] }))
            .sort((a, b) => {
                let ia = state.order.indexOf(a.id);
                let ib = state.order.indexOf(b.id);
                if (ia === -1) ia = 999;
                if (ib === -1) ib = 999;
                return ia - ib;
            })
            .map(card => {
                const isLink = card.type === 'link' || card.type === 'pdf';
                const isInfo = card.type === 'info';
                const icon = card.type === 'pdf' ? 'fa-file-pdf' : 'fa-external-link-alt';
                const btnLabel = card.type === 'pdf' ? 'Abrir PDF' : 'Abrir Link';
                const color = card.color || 'light';
                const bootstrapColor = color === 'light' ? 'secondary' : color;
                const canCopy = !isLink && !isInfo;

                return `
                <div class="col-6 col-md-6 col-lg-3 mb-3">
                    <div class="card h-100 border-${color}" data-id="${card.id}" data-color="${color}" draggable="true" ${canCopy ? `onclick="MainApp.copy(this.querySelector('.content-display'), '${card.id}')"` : ''}>
                        <div class="card-head" onclick="event.stopPropagation()">
                            <span class="handle">⠿</span>
                            <span class="card-title-header">${card.title}</span>
                            <div class="actions">
                                <i class="fa fa-pen" onclick="MainApp.edit('${card.id}')"></i>
                                <i class="fa fa-trash" onclick="MainApp.del('${card.id}')"></i>
                            </div>
                        </div>
                        ${card.local || card.sit || card.julgamento ? `
                            <div class="info-line">
                                <span>Local: <b>${card.local || ''}</b></span>
                                <span>Situação: <b>${card.sit || ''}</b></span>
                                <span>Julgamento: <b>${card.julgamento || ''}</b></span>
                            </div>` : ''}
                        
                        ${isLink ? `
                            <div class="link-card-body text-center mt-2">
                                <p class="x-small mb-2">${card.content || 'Acesso rápido'}</p>
                                <a href="${card.link}" target="_blank" class="btn btn-outline-${bootstrapColor} btn-sm-compact" onclick="event.stopPropagation()">
                                    <i class="fas ${icon} me-1"></i>${btnLabel}
                                </a>
                            </div>
                        ` : (isInfo ? `
                            <div class="content-display">${card.content}</div>
                            <div class="info-card-badge"><i class="fas fa-info-circle me-1"></i> Informativo</div>
                        ` : `
                            <div class="content-display">${card.showDate !== false ? formattedDate + ' - ' : ''}${card.content.replace(/\[\s*00\/00\/0000\s*\]/g, `<span class="date-highlight">${formattedDate}</span>`)}</div>
                            <div class="card-copy-hint"><i class="fas fa-mouse-pointer me-1"></i> Clique no card para copiar</div>
                            <div class="card-copy-success"><i class="fas fa-check-circle me-1"></i> Conteúdo Copiado!</div>
                            <button class="btn-copy-mini btn-outline-success" onclick="event.stopPropagation(); MainApp.copy(this, '${card.id}')" title="Copiar conteúdo">
                                <i class="fas fa-copy"></i>
                            </button>
                        `)}
                    </div>
                </div>
            `}).join('');

        save();

        // Restaurar destaque se houver um ID copiado
        if (lastCopiedId) {
            const card = document.querySelector(`[data-id="${lastCopiedId}"]`);
            if (card) {
                card.classList.add('shadow-lg', 'copied-active');
                const contentEl = card.querySelector('.content-display');
                if (contentEl) contentEl.classList.add('fw-bold');
                
                const btn = card.querySelector('.btn-copy-mini');
                if (btn) {
                    btn.classList.add('btn-active');
                    btn.innerHTML = '<i class="fas fa-check"></i>';
                }
            }
        }
    }


    /* ── Ações de Card ───────────────────────────────────── */
    function saveCard() {
        const id = document.getElementById('m-id').value;
        const data = {
            title: document.getElementById('m-title').value,
            content: document.getElementById('m-content').value,
            color: document.getElementById('m-color').value,
            local: document.getElementById('m-local').value,
            sit: document.getElementById('m-sit').value,
            julgamento: document.getElementById('m-julgamento').value,
            type: document.getElementById('m-type').value,
            link: document.getElementById('m-link').value,
            showDate: document.getElementById('m-showDate').checked
        };

        if (id) {
            state.edits[id] = data;
        } else {
            state.customs.push({ id: 'custom-' + Date.now(), ...data });
        }

        closeModal();
        render();
        notifyChange();
    }

    function notifyChange() {
        const status = document.getElementById('gh-status');
        if (status) {
            status.innerHTML = '<span class="text-warning fw-bold"><i class="fas fa-exclamation-triangle me-1"></i>Alterações pendentes! Faça backup.</span>';
        }
        showToast('Alteração detectada! Não esqueça do backup.', 'warning', 4000);
    }

    function edit(id) {
        const all = state.customs;
        const card = { ...all.find(c => c.id === id), ...state.edits[id] };

        document.getElementById('m-id').value = id;
        document.getElementById('m-title').value = card.title;
        document.getElementById('m-content').value = card.content;
        document.getElementById('m-color').value = card.color || 'light';
        document.getElementById('m-local').value = card.local || '';
        document.getElementById('m-sit').value = card.sit || '';
        document.getElementById('m-julgamento').value = card.julgamento || '';
        document.getElementById('m-type').value = card.type || 'copy';
        document.getElementById('m-link').value = card.link || '';
        document.getElementById('m-showDate').checked = card.showDate !== false;

        toggleLinkField();
        window.bsModal.show();
    }

    async function del(id) {
        const confirmed = await showConfirm('Excluir Card', 'Deseja excluir este card permanentemente?', 'danger');
        if (confirmed) {
            state.deleted.push(id);
            render();
            notifyChange();
            showToast('Card removido com sucesso.', 'info');
        }
    }

    async function copy(el, id) {
        if (_copying) return;
        
        const card = document.querySelector(`[data-id="${id}"]`);
        if (card && card.querySelector('.info-card-badge')) return; // Não copia cards informativos

        _copying = true;
        const contentEl = card && (card.querySelector('.content-display') || card.querySelector('textarea'));
        if (!contentEl) { _copying = false; return; }

        const text = contentEl.innerText || contentEl.value;
        try {
            await navigator.clipboard.writeText(text);
            const btn = card.querySelector('.btn-copy-mini') || card.querySelector('.btn-sm-compact');
            const successEl = card.querySelector('.card-copy-success');
            const hintEl = card.querySelector('.card-copy-hint');

            if (btn) {
                btn.classList.add('btn-active');
                btn.innerHTML = '<i class="fas fa-check"></i>';
                
                // Limpar destaque do card anterior se houver
                if (lastCopiedId && lastCopiedId !== id) {
                    resetCardHighlight(lastCopiedId);
                }
                lastCopiedId = id;

                if (successEl) successEl.classList.add('visible');
                if (hintEl) hintEl.classList.add('hidden');

                contentEl.classList.add('fw-bold');
                card.classList.add('shadow-lg', 'copied-active');

                setTimeout(() => {
                    if (successEl) successEl.classList.remove('visible');
                    if (hintEl) hintEl.classList.remove('hidden');

                    _copying = false;
                }, 1200);
            }
        } catch (e) {
            _copying = false;
            console.error('Erro ao copiar:', e);
        }
    }

    /* ── Busca de Fiscais ─────────────────────────────────── */
    let fiscalData = [];
    function initFiscalSearch() {
        const select = document.getElementById('fiscal-select');
        const filter = document.getElementById('fiscal-filter');
        const res = document.getElementById('fiscal-res');

        const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

        fetch('assets/dados.ods').then(r => r.arrayBuffer()).then(buf => {
            const _warn = console.warn;
            const _error = console.error;
            console.warn = console.error = () => { };
            try {
                const wb = XLSX.read(buf, { type: 'array', cellNF: false });
                console.warn = _warn;
                console.error = _error;
                const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true });
                fiscalData = json.slice(1).filter(l => l[0]).map(l => ({
                    cidade: l[0],
                    fiscal: l[1],
                    region: l[2],
                    code: l[3]
                }));

                const updateOptions = (data) => {
                    select.innerHTML = '<option value="">Selecione a cidade (' + data.length + ')</option>' +
                        data.map(d => `<option value="${d.cidade}">${d.cidade}</option>`).join('');
                };

                updateOptions(fiscalData);
                select.disabled = false;

                filter.oninput = (e) => {
                    const term = normalize(e.target.value);
                    const filtered = fiscalData.filter(d => normalize(d.cidade).includes(term));
                    updateOptions(filtered);
                    
                    if (filtered.length === 1 && term.length > 2) {
                        select.value = filtered[0].cidade;
                        select.dispatchEvent(new Event('change'));
                    }
                };
            } catch (err) {
                console.warn = _warn;
                console.error = _error;
                throw err;
            }
        }).catch(() => {
            if (res) res.textContent = 'Planilha não encontrada.';
        });

        select.onchange = (e) => {
            const d = fiscalData.find(x => x.cidade === e.target.value);
            res.innerHTML = d
                ? `<div class="d-flex flex-column gap-1">
                    <div class="d-flex justify-content-between"><span>Código: <b class="text-info">${d.code}</b></span><span>Região: <b class="text-warning">${d.region}</b></span></div>
                    <div class="text-center mt-1 border-top border-secondary border-opacity-25 pt-1">Fiscal: <b class="text-success">${d.fiscal}</b></div>
                   </div>`
                : 'Aguardando seleção...';
        };
    }

    /* ── Calculadora ─────────────────────────────────────── */
    function initCalculator() {
        const calc = () => {
            const p = parseFloat(document.getElementById('piso').value) || 0;
            const h = parseFloat(document.getElementById('horas').value) || 0;
            const total = (p * h) / 44;
            const hora = p / 220;
            document.getElementById('res-total').textContent = total.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            document.getElementById('res-hora').textContent = hora.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        };
        document.getElementById('piso').oninput = calc;
        document.getElementById('horas').oninput = calc;
    }

    /* ── Plano Inspeção ────────────────────────────────── */
    async function initPlanoInspection() {
        const btnPlano = document.getElementById('btnPlanoInspection');
        if (!btnPlano) return;
        try {
            const proxyUrl = "https://api.allorigins.win/get?url=";
            const target = encodeURIComponent("https://crf-pr.org.br/documento/index?DocumentoSearch%5Bid_documento_categoria%5D=19");
            const response = await fetch(proxyUrl + target);
            const data = await response.json();
            const match = data.contents.match(/href="(\/documento\/view\/\d+\/[pP]lano-[^"]*)"/);
            if (match && match[1]) btnPlano.href = "https://crf-pr.org.br" + match[1];
        } catch (e) { }
    }

    /* ── Drag & Drop ─────────────────────────────────────── */
    function setupDragAndDrop() {
        const grid = document.getElementById('dynamic-cards');
        grid.ondragover = e => e.preventDefault();
        grid.ondrop = e => {
            e.preventDefault();
            const draggedId = e.dataTransfer.getData('id');
            const target = e.target.closest('.card');
            if (target && target.dataset.id !== draggedId) {
                const currentIds = Array.from(grid.querySelectorAll('.card')).map(f => f.dataset.id);
                const fromIdx = currentIds.indexOf(draggedId);
                const toIdx = currentIds.indexOf(target.dataset.id);
                currentIds.splice(toIdx, 0, currentIds.splice(fromIdx, 1)[0]);
                state.order = currentIds;
                render();
                notifyChange();
            }
        };
        grid.ondragstart = e => {
            const card = e.target.closest('.card');
            if (!card) return e.preventDefault();
            e.dataTransfer.setData('id', card.dataset.id);
            setTimeout(() => card.classList.add('dragging'), 0);
        };
        grid.ondragend = e => {
            const card = e.target.closest('.card');
            if (card) card.classList.remove('dragging');
        };
    }

    const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const closeModal = () => window.bsModal.hide();

    function toggleLinkField() {
        const type = document.getElementById('m-type').value;
        const group = document.getElementById('link-field-group');
        const showDateGroup = document.getElementById('m-showDate').closest('.form-check');

        if (type === 'link' || type === 'pdf') {
            group.classList.remove('d-none');
            showDateGroup.classList.add('d-none');
        } else if (type === 'info') {
            group.classList.add('d-none');
            showDateGroup.classList.add('d-none');
        } else {
            group.classList.add('d-none');
            showDateGroup.classList.remove('d-none');
        }

        const contentLabel = document.getElementById('m-content');
        if (type === 'link' || type === 'pdf') {
            contentLabel.placeholder = "Descrição curta (opcional)";
            contentLabel.rows = 2;
        } else {
            contentLabel.placeholder = "Conteúdo";
            contentLabel.rows = 4;
        }
    }


    async function cloudBackup() {
        const token = document.getElementById('gh-token').value;
        const repo = document.getElementById('gh-repo').value;
        const status = document.getElementById('gh-status');
        if (!token || !repo) { status.textContent = 'Erro: Preencha Token e Repo'; return; }

        status.textContent = 'Enviando...';
        try {
            const path = 'cards_backup.json';
            const userRes = await fetch('https://api.github.com/user', { headers: { 'Authorization': `token ${token}` } });
            if (userRes.status === 401) { status.textContent = 'Token Inválido'; return; }
            const userData = await userRes.json();
            const username = userData.login;

            let sha = null;
            const fileRes = await fetch(`https://api.github.com/repos/${username}/${repo}/contents/${path}`, { headers: { 'Authorization': `token ${token}` } });

            if (fileRes.status === 404 && (await fetch(`https://api.github.com/repos/${username}/${repo}`, { headers: { 'Authorization': `token ${token}` } })).status === 404) {
                status.textContent = 'Repositório não encontrado';
                return;
            }

            if (fileRes.ok) {
                const fileData = await fileRes.json();
                sha = fileData.sha;
            }

            const content = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
            const res = await fetch(`https://api.github.com/repos/${username}/${repo}/contents/${path}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Backup ${new Date().toLocaleString()}`,
                    content: content,
                    sha: sha
                })
            });

            if (res.ok) {
                status.textContent = 'Backup ok! ' + new Date().toLocaleTimeString();
                showToast('Backup realizado com sucesso no GitHub!', 'success');
                localStorage.setItem('gh_token', token);
                localStorage.setItem('gh_repo', repo);
            } else {
                const err = await res.json();
                status.textContent = 'Erro: ' + (err.message || 'Falha no envio');
            }
        } catch (e) {
            status.textContent = 'Erro de Rede.';
        }
    }

    async function cloudRestore() {
        const token = document.getElementById('gh-token').value;
        const repo = document.getElementById('gh-repo').value;
        const status = document.getElementById('gh-status');
        if (!token || !repo) { status.textContent = 'Erro: Preencha Token e Repo'; return; }

        status.textContent = 'Sincronizando...';
        try {
            const path = 'cards_backup.json';
            const userRes = await fetch('https://api.github.com/user', { headers: { 'Authorization': `token ${token}` } });
            if (userRes.status === 401) { status.textContent = 'Token Inválido'; return; }
            const userData = await userRes.json();
            const username = userData.login;

            const res = await fetch(`https://api.github.com/repos/${username}/${repo}/contents/${path}`, { headers: { 'Authorization': `token ${token}` } });
            if (res.ok) {
                const data = await res.json();
                const json = JSON.parse(decodeURIComponent(escape(atob(data.content))));

                const confirmed = await showConfirm('Restaurar Backup', 'Isso irá substituir todos os seus cards locais pelos da nuvem. Continuar?', 'info');
                if (confirmed) {
                    Object.assign(state, json);
                    render();
                    status.textContent = 'Sincronizado! ' + new Date().toLocaleTimeString();
                    showToast('Dados sincronizados com sucesso!', 'success');
                    localStorage.setItem('gh_token', token);
                    localStorage.setItem('gh_repo', repo);
                } else {
                    status.textContent = 'Cancelado.';
                }
            } else {
                status.textContent = 'Backup não encontrado.';
            }
        } catch (e) {
            status.textContent = 'Erro de Rede.';
        }
    }

    function checkLogin() {
        const emailInput = document.getElementById('login-email');
        const passInput = document.getElementById('login-password');
        const errorMsg = document.getElementById('login-error');
        const savedPass = localStorage.getItem('baixa_rt_password') || '1234';

        if (emailInput.value.includes('@') && passInput.value === savedPass) {
            localStorage.setItem('baixa_rt_auth', 'true');
            localStorage.setItem('baixa_rt_user_email', emailInput.value);
            
            // Atualiza UI da barra superior e do Modal
            document.getElementById('user-display-email').textContent = emailInput.value;
            document.getElementById('modal-email').textContent = emailInput.value;
            
            const initials = emailInput.value.split('@')[0].substring(0, 2).toUpperCase();
            document.getElementById('user-avatar').textContent = initials;
            document.getElementById('modal-avatar').textContent = initials;

            document.getElementById('login-overlay').classList.add('hidden');
            showToast(`Bem-vindo, ${emailInput.value.split('@')[0]}!`, 'success');
        } else {
            errorMsg.classList.remove('d-none');
            passInput.value = '';
            passInput.focus();

            const card = document.querySelector('.login-card');
            card.style.animation = 'none';
            void card.offsetWidth;
            card.style.animation = 'pop-in 0.3s ease, shake 0.4s ease';
        }
    }

    function forgotPassword(e) {
        if (e) e.preventDefault();
        const email = document.getElementById('login-email').value;
        if (!email || !email.includes('@')) {
            showToast('Por favor, insira um e-mail válido primeiro.', 'warning');
            return;
        }

        showConfirm('Recuperar Senha', `Deseja enviar um link de redefinição para ${email}?`, 'info').then(confirmed => {
            if (confirmed) {
                showToast('Link de redefinição enviado para o seu e-mail!', 'info', 5000);
            }
        });
    }

    function updatePassword() {
        const oldPass = document.getElementById('old-password').value;
        const p1 = document.getElementById('new-password').value;
        const p2 = document.getElementById('confirm-new-password').value;
        const savedPass = localStorage.getItem('baixa_rt_password') || '1234';

        if (oldPass !== savedPass) {
            showToast('A senha anterior está incorreta!', 'danger');
            return;
        }

        if (!p1 || p1.length < 4) {
            showToast('A nova senha deve ter pelo menos 4 dígitos', 'warning');
            return;
        }

        if (p1 === oldPass) {
            showToast('A nova senha não pode ser igual à anterior!', 'warning');
            return;
        }

        if (p1 !== p2) {
            showToast('As novas senhas não coincidem!', 'danger');
            return;
        }

        localStorage.setItem('baixa_rt_password', p1);
        showToast('Senha alterada com sucesso!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('settingsModal')).hide();

        // Limpa os campos
        document.getElementById('old-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-new-password').value = '';
    }

    function logout() {
        localStorage.removeItem('baixa_rt_auth');
        location.reload();
    }

    let allCities = [];
    let filteredCities = [];
    let displayIndex = 0;
    const displayBatchSize = 50;
    let isFetchingCities = false;
    const fallbackCities = [
        "Curitiba, PR", "São Paulo, SP", "Rio de Janeiro, RJ", "Belo Horizonte, MG", 
        "Brasília, DF", "Porto Alegre, RS", "Salvador, BA", "Fortaleza, CE", 
        "Recife, PE", "Manaus, AM", "Goiânia, GO", "Belém, PA", "Guarulhos, SP", 
        "Campinas, SP", "São Luís, MA", "Maceió, AL", "Campo Grande, MS", "Natal, RN"
    ];

    async function initWeather() {
        const widget = document.getElementById('weather-widget');
        if (!widget) return;

        // Mostrar estado de carregamento no select se o modal estiver aberto
        const select = document.getElementById('weather-city-select');
        if (select && allCities.length === 0) {
            select.innerHTML = '<option value="">Carregando cidades do Brasil...</option>';
        }

        if (allCities.length === 0 && !isFetchingCities) {
            isFetchingCities = true;
            
            const tryFetch = async () => {
                const sources = [
                    'https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome',
                    'https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/json/municipios.json'
                ];

                const ufMap = {
                    11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA", 16: "AP", 17: "TO",
                    21: "MA", 22: "PI", 23: "CE", 24: "RN", 25: "PB", 26: "PE", 27: "AL", 28: "SE", 29: "BA",
                    31: "MG", 32: "ES", 33: "RJ", 35: "SP",
                    41: "PR", 42: "SC", 43: "RS",
                    50: "MS", 51: "MT", 52: "GO", 53: "DF"
                };

                for (const url of sources) {
                    try {
                        console.log(`Tentando carregar cidades de: ${url}`);
                        const r = await fetch(url);
                        if (!r.ok) throw new Error(`Erro na rede: ${r.status}`);
                        const data = await r.json();
                        
                        if (Array.isArray(data)) {
                            if (url.includes('ibge')) {
                                allCities = data.map(m => {
                                    const uf = m.microrregiao?.mesorregiao?.UF?.sigla || '??';
                                    return `${m.nome}, ${uf}`;
                                });
                            } else {
                                // Formato da kelvins/municipios-brasileiros: {codigo_ibge, nome, codigo_uf}
                                allCities = data.map(m => {
                                    const uf = ufMap[m.codigo_uf] || 'BR';
                                    return `${m.nome}, ${uf}`;
                                });
                            }
                        }
                        
                        if (allCities.length > 0) {
                            // Ordenar alfabeticamente se vier da fonte secundária
                            if (!url.includes('ibge')) allCities.sort();
                            console.log(`${allCities.length} cidades carregadas com sucesso.`);
                            break; 
                        }
                    } catch (e) {
                        console.error(`Falha ao carregar de ${url}:`, e);
                    }
                }

                if (allCities.length === 0) {
                    console.warn("Todas as fontes falharam, usando fallback de capitais.");
                    allCities = fallbackCities;
                }

                filteredCities = [...allCities];
                isFetchingCities = false;
                setupWeatherFilter();
            };
            
            tryFetch();
        }

        async function fetchWeather(lat, lon, cityName) {
            try {
                const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
                const weatherData = await weatherRes.json();
                const { temperature, weathercode } = weatherData.current_weather;
                const tempMax = weatherData.daily.temperature_2m_max[0];
                const tempMin = weatherData.daily.temperature_2m_min[0];

                const iconMap = {
                    0: 'fa-sun', 1: 'fa-cloud-sun', 2: 'fa-cloud-sun', 3: 'fa-cloud',
                    45: 'fa-smog', 48: 'fa-smog', 51: 'fa-cloud-rain', 53: 'fa-cloud-rain', 55: 'fa-cloud-rain',
                    61: 'fa-cloud-showers-heavy', 63: 'fa-cloud-showers-heavy', 65: 'fa-cloud-showers-heavy',
                    71: 'fa-snowflake', 73: 'fa-snowflake', 75: 'fa-snowflake',
                    80: 'fa-cloud-rain', 81: 'fa-cloud-rain', 82: 'fa-cloud-rain',
                    95: 'fa-bolt', 96: 'fa-bolt', 99: 'fa-bolt'
                };
                const iconClass = iconMap[weathercode] || 'fa-cloud';

                widget.innerHTML = `
                    <div class="d-flex align-items-center gap-1 px-0">
                        <i class="fas ${iconClass} weather-icon" style="font-size: 0.8rem;"></i>
                        <div class="d-flex flex-column" onclick="MainApp.changeLocation()" style="cursor: pointer;" title="Clique para mudar a localização">
                            <span class="fw-bold" style="font-size: 0.75rem; line-height: 1;">${Math.round(temperature)}°C</span>
                            <span class="text-muted" style="font-size: 0.5rem; margin-top: 1px;">
                                <i class="fas fa-map-marker-alt me-1"></i>${cityName}
                            </span>
                        </div>
                        <div class="vr mx-1 opacity-25" style="height: 16px;"></div>
                        <div class="d-flex flex-column justify-content-center" style="font-size: 0.5rem; line-height: 1.1;">
                            <span class="text-danger fw-bold"><i class="fas fa-arrow-up me-1" style="font-size: 0.45rem;"></i>${Math.round(tempMax)}°</span>
                            <span class="text-info fw-bold"><i class="fas fa-arrow-down me-1" style="font-size: 0.45rem;"></i>${Math.round(tempMin)}°</span>
                        </div>
                        <div class="d-none d-lg-block ms-1 ps-2 border-start border-secondary border-opacity-25 text-center">
                            <div class="text-muted" style="font-size: 0.45rem; text-transform: uppercase; letter-spacing: 0.5px;">${formattedDate}</div>
                        </div>
                    </div>
                `;
            } catch (e) {
                widget.innerHTML = '<span class="x-small text-muted" onclick="MainApp.changeLocation()" style="cursor:pointer">Erro ao carregar clima. Clique aqui.</span>';
            }
        }

        const savedLoc = JSON.parse(localStorage.getItem('portal_weather_loc'));
        if (savedLoc) {
            await fetchWeather(savedLoc.lat, savedLoc.lon, savedLoc.city);
            return;
        }

        try {
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
            });
            const { latitude, longitude } = pos.coords;
            let city = 'Local';
            try {
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                if (geoRes.ok) {
                    const geoData = await geoRes.json();
                    city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.suburb || 'Local';
                }
            } catch (e) {}
            await fetchWeather(latitude, longitude, city);
        } catch (err) {
            try {
                const ipRes2 = await fetch('https://ipapi.co/json/');
                const ipData2 = await ipRes2.json();
                await fetchWeather(ipData2.latitude, ipData2.longitude, ipData2.city);
            } catch (e2) {
                await fetchWeather(-25.4296, -49.2719, 'Curitiba');
            }
        }
    }

    function setupWeatherFilter() {
        const filter = document.getElementById('weather-city-filter');
        const select = document.getElementById('weather-city-select');
        if (!filter || !select) return;

        const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

        const renderAll = (data) => {
            if (data.length === 0) {
                select.innerHTML = '<option value="">Nenhuma cidade encontrada</option>';
                return;
            }
            select.innerHTML = '<option value="">Selecione a cidade (' + data.length + ')</option>' +
                data.map(c => `<option value="${c}">${c}</option>`).join('');
        };

        renderAll(allCities);

        filter.oninput = (e) => {
            const term = normalize(e.target.value);
            const filtered = allCities.filter(c => normalize(c).includes(term));
            renderAll(filtered);
            
            if (filtered.length === 1 && term.length > 2) {
                select.value = filtered[0];
                select.dispatchEvent(new Event('change'));
            }
        };

        select.onclick = (e) => {
            if (e.target.tagName === 'OPTION' && e.target.value) {
                saveLocationManual(e.target.value);
            }
        };

        select.onchange = (e) => {
            if (e.target.value) {
                saveLocationManual(e.target.value);
            }
        };
    }

    function changeLocation() {
        window.locModal.show();
        setupWeatherFilter();
        setTimeout(() => document.getElementById('weather-city-filter').focus(), 500);
    }

    async function saveLocationManual(cityName) {
        const city = cityName || document.getElementById('weather-city-select').value;
        if (!city) return;

        try {
            const btn = document.querySelector('#locationModal .btn-primary');
            const originalText = btn.innerHTML;
            if (btn) {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                btn.disabled = true;
            }

            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`);
            const data = await res.json();
            
            if (data && data.length > 0) {
                const loc = {
                    lat: data[0].lat,
                    lon: data[0].lon,
                    city: city.split(',')[0]
                };
                localStorage.setItem('portal_weather_loc', JSON.stringify(loc));
                window.locModal.hide();
                initWeather();
                showToast('Localização atualizada!', 'success');
            } else {
                showToast('Cidade não encontrada.', 'danger');
            }
            
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        } catch (e) {
            showToast('Erro ao buscar coordenadas.', 'danger');
            const btn = document.querySelector('#locationModal .btn-primary');
            if (btn) {
                btn.innerHTML = 'Salvar';
                btn.disabled = false;
            }
        }
    }

    document.addEventListener('DOMContentLoaded', init);

    return {
        edit,
        del,
        copy,
        closeModal,
        toggleLinkField,
        cloudBackup,
        cloudRestore,
        checkLogin,
        forgotPassword,
        updatePassword,
        logout,
        changeLocation,
        saveLocationManual,
        openCreate: () => {
            document.getElementById('m-id').value = '';
            document.getElementById('m-title').value = '';
            document.getElementById('m-content').value = '';
            document.getElementById('m-color').value = 'light';
            document.getElementById('m-local').value = '';
            document.getElementById('m-sit').value = '';
            document.getElementById('m-julgamento').value = '';
            document.getElementById('m-type').value = 'copy';
            document.getElementById('m-link').value = '';
            document.getElementById('m-showDate').checked = true;
            toggleLinkField();
            window.bsModal.show();
        }
    };
})();
