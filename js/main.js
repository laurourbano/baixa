/**
 * main.js — O Cérebro do Sistema (Versão com CONTEÚDO COMPLETO)
 */
const MainApp = (function() {
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

    // Migração de dados legados (julg/judgment -> julgamento)
    const migrate = (obj) => {
        if (!obj) return;
        if (obj['julg'] || obj['judgment']) {
            obj['julgamento'] = obj['julgamento'] || obj['judgment'] || obj['julg'];
            delete obj['julg'];
            delete obj['judgment'];
        }
    };
    state.customs.forEach(migrate);
    Object.values(state.edits).forEach(migrate);


    // CONTEÚDO COMPLETO RECUPERADO
    const INITIAL_CARDS = [];

    async function init() {
        // Inicializa o modal do Bootstrap
        window.bsModal = new bootstrap.Modal(document.getElementById('cardModal'));
        
        // Carrega dados do backup local e mescla de forma segura
        try {
            const response = await fetch('cards_backup.json');
            if (response.ok) {
                const backupData = await response.json();
                const backupCustoms = backupData.customs || [];
                
                backupCustoms.forEach(bCard => {
                    // Busca por ID exato
                    let existing = state.customs.find(c => c.id === bCard.id);
                    
                    // Se não achou por ID, busca por Título + Conteúdo (mesmo card, ID diferente)
                    if (!existing) {
                        existing = state.customs.find(c => 
                            c.title.toLowerCase().trim() === bCard.title.toLowerCase().trim() &&
                            c.content.trim() === bCard.content.trim()
                        );
                    }

                    if (existing) {
                        // Preenche campos faltantes sem sobrescrever o que o usuário já tem
                        if (existing.local === undefined || existing.local === '') existing.local = bCard.local || '';
                        if (existing.sit === undefined || existing.sit === '') existing.sit = bCard.sit || '';
                        if (existing.julgamento === undefined || existing.julgamento === '') existing.julgamento = bCard.julgamento || '';
                        if (!existing.color || existing.color === 'light') existing.color = bCard.color || 'light';
                        
                        // IMPORTANTE: NÃO alteramos o ID para não quebrar state.edits (cores personalizadas)
                    } else if (!state.deleted.includes(bCard.id)) {
                        // Se não existe de forma alguma, adiciona como novo
                        state.customs.push(bCard);
                    }
                });

                // Tenta recuperar cores de state.edits que podem ter ficado "órfãs" (opcional, mas seguro)
                state.customs.forEach(card => {
                    if (state.edits[card.id]) {
                        const edit = state.edits[card.id];
                        if (edit.color) card.color = edit.color;
                        if (edit.local) card.local = edit.local;
                        if (edit.sit) card.sit = edit.sit;
                        if (edit.julgamento) card.julgamento = edit.julgamento;
                    }
                });

                // Se a ordem estiver vazia ou muito curta, tenta restaurar
                if (state.order.length < state.customs.length && backupData.order) {
                    const newOrder = [...state.order];
                    backupData.order.forEach(id => {
                        if (!newOrder.includes(id)) newOrder.push(id);
                    });
                    state.order = newOrder;
                }
                
                save();
            }
        } catch (e) {
            console.error("Erro ao carregar/mesclar backup:", e);
        }

        render();
        setupDragAndDrop();
        initFiscalSearch();
        initCalculator();
        initPlanoInspection();
        window.saveCard = saveCard;
        
        const savedToken = localStorage.getItem('gh_token');
        if (savedToken) document.getElementById('gh-token').value = savedToken;
        
        const savedRepo = localStorage.getItem('gh_repo');
        if (savedRepo) document.getElementById('gh-repo').value = savedRepo;

        save();
    }

    /* ── Renderização ────────────────────────────────────── */
    function render() {
        const grid = document.getElementById('main-grid');
        if (!grid) return;

        grid.innerHTML = INITIAL_CARDS
            .concat(state.customs)
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
                const icon = card.type === 'pdf' ? 'fa-file-pdf' : 'fa-external-link-alt';
                const btnLabel = card.type === 'pdf' ? 'Abrir PDF' : 'Abrir Link';
                const color = card.color || 'light';
                const bootstrapColor = color === 'light' ? 'secondary' : color;
                
                return `
                <div class="card border-${color}" data-id="${card.id}" data-color="${color}" draggable="true" ${!isLink ? `onclick="MainApp.copy(this.querySelector('.content-display'), '${card.id}')"` : ''}>
                    <div class="card-head" onclick="event.stopPropagation()">
                        <span class="handle">⠿</span>
                        <div class="actions">
                            <i class="fa fa-pen" onclick="MainApp.edit('${card.id}')"></i>
                            <i class="fa fa-trash text-danger opacity-50" onclick="MainApp.del('${card.id}')"></i>
                        </div>
                    </div>
                    <legend>${card.title}</legend>
                    ${card.local || card.sit || card.julgamento ? `
                        <div class="info-line">
                            <span>Local: <b>${card.local || ''}</b></span>
                            <span>Situação: <b>${card.sit || ''}</b></span>
                            <span>Julgamento: <b>${card.julgamento || ''}</b></span>
                        </div>` : ''}
                    
                    ${isLink ? `
                        <div class="link-card-body text-center mt-2">
                            <p>${card.content || 'Acesso rápido'}</p>
                            <a href="${card.link}" target="_blank" class="btn btn-outline-${bootstrapColor} btn-sm-compact" onclick="event.stopPropagation()">
                                <i class="fas ${icon} me-1"></i>${btnLabel}
                            </a>
                        </div>
                    ` : `
                        <div class="content-display">${card.showDate !== false ? formattedDate + ' - ' : ''}${card.content.replace(/\[\s*00\/00\/0000\s*\]/g, `<span class="date-highlight">${formattedDate}</span>`)}</div>
                        <button class="btn btn-outline-success btn-sm-compact" onclick="event.stopPropagation(); MainApp.copy(this, '${card.id}')">
                            <i class="fas fa-copy me-1"></i>Copiar Texto
                        </button>
                    `}
                </div>
            `}).join('');
        
        save();
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
    }

    function edit(id) {
        const all = INITIAL_CARDS.concat(state.customs);
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

    function del(id) {
        if (confirm('Excluir este card permanentemente?')) {
            state.deleted.push(id);
            render();
        }
    }

    let _copying = false;
    async function copy(el, id) {
        if (_copying) return;
        _copying = true;

        const card = document.querySelector(`[data-id="${id}"]`);
        const contentEl = card && (card.querySelector('.content-display') || card.querySelector('textarea'));
        if (!contentEl) { _copying = false; return; }

        const text = contentEl.innerText || contentEl.value;
        try {
            await navigator.clipboard.writeText(text);
            const btn = card.querySelector('.btn-sm-compact');
            if (btn) {
                const originalHTML = btn.innerHTML;
                
                // Aplicar classes de destaque do Bootstrap
                btn.classList.replace('btn-outline-success', 'btn-success');
                btn.innerHTML = '<i class="fas fa-check me-1"></i>Copiado!';
                
                contentEl.classList.add('text-success', 'fw-bold');
                card.classList.add('border-success', 'shadow-lg');
                
                setTimeout(() => {
                    btn.classList.replace('btn-success', 'btn-outline-success');
                    btn.innerHTML = originalHTML;
                    
                    contentEl.classList.remove('text-success', 'fw-bold');
                    card.classList.remove('shadow-lg');
                    
                    const originalColor = card.getAttribute('data-color') || 'light';
                    if (originalColor !== 'success') {
                        card.classList.remove('border-success');
                        card.classList.add(`border-${originalColor}`);
                    }

                    _copying = false;
                }, 1200);
            }
        } catch(e) {
            _copying = false;
            console.error('Erro ao copiar:', e);
        }
    }

    /* ── Busca de Fiscais ─────────────────────────────────── */
    let fiscalData = [];
    function initFiscalSearch() {
        const select = document.getElementById('fiscal-select');
        fetch('assets/dados.ods').then(r => r.arrayBuffer()).then(buf => {
            const _warn = console.warn;
            const _error = console.error;
            console.warn = console.error = () => {};
            try {
                const wb = XLSX.read(buf, {type:'array', cellNF: false});
                console.warn = _warn;
                console.error = _error;
                const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1, raw: true});
                fiscalData = json.slice(1).filter(l => l[0]).map(l => ({ 
                    cidade: l[0], 
                    fiscal: l[1], 
                    region: l[2], 
                    code: l[3] 
                }));
                
                select.innerHTML = '<option value="">Selecione a cidade</option>' + 
                    fiscalData.map(d => `<option value="${d.cidade}">${d.cidade}</option>`).join('');
                select.disabled = false;
            } catch (err) {
                console.warn = _warn;
                console.error = _error;
                throw err;
            }
        }).catch(() => {
            const res = document.getElementById('fiscal-res');
            if(res) res.textContent = 'Planilha não encontrada.';
        });

        select.onchange = (e) => {
            const d = fiscalData.find(x => x.cidade === e.target.value);
            document.getElementById('fiscal-res').innerHTML = d 
                ? `<div class="d-flex justify-content-between"><span>Código: <b>${d.code}</b></span><span>Região: <b>${d.region}</b></span></div>` 
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
        if(!btnPlano) return;
        try {
            const proxyUrl = "https://api.allorigins.win/get?url=";
            const target = encodeURIComponent("https://crf-pr.org.br/documento/index?DocumentoSearch%5Bid_documento_categoria%5D=19");
            const response = await fetch(proxyUrl + target);
            const data = await response.json();
            const match = data.contents.match(/href="(\/documento\/view\/\d+\/[pP]lano-[^"]*)"/);
            if(match && match[1]) btnPlano.href = "https://crf-pr.org.br" + match[1];
        } catch (e) {}
    }

    /* ── Drag & Drop ─────────────────────────────────────── */
    function setupDragAndDrop() {
        const grid = document.getElementById('main-grid');
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
                
                if (confirm('Substituir cards locais pelos da nuvem?')) {
                    Object.assign(state, json);
                    render();
                    status.textContent = 'Sincronizado! ' + new Date().toLocaleTimeString();
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

    document.addEventListener('DOMContentLoaded', init);

    return { edit, del, copy, closeModal, toggleLinkField, cloudBackup, cloudRestore, openCreate: () => {
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
    }};
})();
