/**
 * main.js — O Cérebro do Sistema
 * Gerencia cards, calculadora, busca de fiscais e persistência.
 */
const MainApp = (function() {
    'use strict';

    // Configurações e Estado
    const STORAGE_KEY = 'baixa_rt_data';
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        order: [],
        customs: [],
        edits: {},
        deleted: []
    };

    const INITIAL_CARDS = [
        { id: 'c1', title: 'Pendência Transferência', color: 'danger', content: 'Pendência de Transferência\nProtocolo PENDENTE por falta de registro de transferência na CTPS.' },
        { id: 'c2', title: 'Pendência Quebra de Vínculo', color: 'warning', content: 'Pendência de Quebra de Vínculo\nFalta comprovante de baixa na CTPS ou Rescisão.' },
        { id: 'c3', title: 'Indeferimento Transferência', color: 'danger', content: 'Indeferimento por falta de Transferência\nDocumento não enviado conforme solicitado.' },
        { id: 'c4', title: 'Aguarda Complementação', color: 'info', content: 'Documento Complementar\nSua baixa foi feita, mas há pendência documental (Prazo: 30 dias).' },
        { id: 'c5', title: 'Desistência', color: 'light', content: 'Procedimento trata-se de desistência do ingresso. Desistência efetivada.' },
        { id: 'c6', title: 'Duplicado', color: 'light', content: 'Gentileza não realizar mais de um protocolo para o mesmo procedimento.' }
    ];

    // Inicialização
    function init() {
        render();
        setupDragAndDrop();
        initFiscalSearch();
        initCalculator();
        window.saveCard = saveCard; // Expoe para o HTML
    }

    /* ── Renderização ────────────────────────────────────── */
    function render() {
        const grid = document.getElementById('main-grid');
        if (!grid) return;

        // Limpa grid e reconstrói
        grid.innerHTML = INITIAL_CARDS
            .concat(state.customs)
            .filter(c => !state.deleted.includes(c.id))
            .map(c => ({ ...c, ...state.edits[c.id] }))
            .sort((a, b) => (state.order.indexOf(a.id) - state.order.indexOf(b.id)))
            .map(card => `
                <fieldset class="card border-${card.color}" data-id="${card.id}" draggable="true">
                    <div class="card-head">
                        <span class="handle">⠿</span>
                        <div class="actions">
                            <i class="fa fa-pen" onclick="MainApp.edit('${card.id}')"></i>
                            <i class="fa fa-trash" onclick="MainApp.del('${card.id}')"></i>
                        </div>
                    </div>
                    <legend>${card.title}</legend>
                    <textarea readonly onclick="MainApp.copy(this, '${card.id}')">${card.content}</textarea>
                    <button class="btn-copy" onclick="MainApp.copy(this, '${card.id}')">Copiar</button>
                </fieldset>
            `).join('');
        
        save();
    }

    /* ── Ações de Card ───────────────────────────────────── */
    function saveCard() {
        const id = document.getElementById('m-id').value;
        const data = {
            title: document.getElementById('m-title').value,
            content: document.getElementById('m-content').value,
            color: document.getElementById('m-color').value
        };

        if (id) state.edits[id] = data;
        else state.customs.push({ id: 'custom-' + Date.now(), ...data });

        closeModal();
        render();
    }

    function edit(id) {
        const all = INITIAL_CARDS.concat(state.customs);
        const card = { ...all.find(c => c.id === id), ...state.edits[id] };
        
        document.getElementById('m-id').value = id;
        document.getElementById('m-title').value = card.title;
        document.getElementById('m-content').value = card.content;
        document.getElementById('m-color').value = card.color;
        document.getElementById('modal').style.display = 'flex';
    }

    function del(id) {
        if (confirm('Excluir card?')) {
            state.deleted.push(id);
            render();
        }
    }

    async function copy(el, id) {
        const text = el.tagName === 'TEXTAREA' ? el.value : el.previousElementSibling.value;
        await navigator.clipboard.writeText(text);
        const btn = document.querySelector(`[data-id="${id}"] .btn-copy`);
        btn.textContent = 'Copiado!';
        btn.style.background = '#22c55e';
        setTimeout(() => { btn.textContent = 'Copiar'; btn.style.background = ''; }, 1000);
    }

    /* ── Busca de Fiscais ─────────────────────────────────── */
    let fiscalData = [];
    function initFiscalSearch() {
        const select = document.getElementById('fiscal-select');
        fetch('assets/dados.ods').then(r => r.arrayBuffer()).then(buf => {
            const wb = XLSX.read(buf, {type:'array'});
            const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1});
            fiscalData = json.slice(1).map(l => ({ cidade: l[0], fiscal: l[1], regiao: l[2] }));
            
            select.innerHTML = '<option value="">Selecione a cidade</option>' + 
                fiscalData.map(d => `<option value="${d.cidade}">${d.cidade}</option>`).join('');
            select.disabled = false;
        }).catch(() => console.log('Planilha offline'));

        select.onchange = (e) => {
            const d = fiscalData.find(x => x.cidade === e.target.value);
            document.getElementById('fiscal-res').textContent = d ? `Fiscal: ${d.fiscal} | ${d.regiao}` : '';
        };
    }

    /* ── Calculadora ─────────────────────────────────────── */
    function initCalculator() {
        const calc = () => {
            const p = parseFloat(document.getElementById('piso').value) || 0;
            const h = parseFloat(document.getElementById('horas').value) || 0;
            document.getElementById('res-total').textContent = ((p * h) / 44).toFixed(2);
            document.getElementById('res-hora').textContent = (p / 220).toFixed(2);
        };
        document.getElementById('piso').oninput = calc;
        document.getElementById('horas').oninput = calc;
    }

    /* ── Drag & Drop ─────────────────────────────────────── */
    function setupDragAndDrop() {
        const grid = document.getElementById('main-grid');
        grid.ondragover = e => e.preventDefault();
        grid.ondrop = e => {
            const draggedId = e.dataTransfer.getData('id');
            const target = e.target.closest('fieldset');
            if (target && target.dataset.id !== draggedId) {
                const ids = Array.from(grid.querySelectorAll('fieldset')).map(f => f.dataset.id);
                const fromIdx = ids.indexOf(draggedId);
                const toIdx = ids.indexOf(target.dataset.id);
                ids.splice(toIdx, 0, ids.splice(fromIdx, 1)[0]);
                state.order = ids;
                render();
            }
        };
        grid.ondragstart = e => e.dataTransfer.setData('id', e.target.dataset.id);
    }

    // Helpers
    const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const closeModal = () => document.getElementById('modal').style.display = 'none';

    document.addEventListener('DOMContentLoaded', init);

    return { edit, del, copy, closeModal, openCreate: () => {
        document.getElementById('m-id').value = '';
        document.getElementById('modal').style.display = 'flex';
    }};
})();
