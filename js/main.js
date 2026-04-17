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

    // CONTEÚDO COMPLETO RECUPERADO
    const INITIAL_CARDS = [
        { 
            id: 'c1', title: 'Pendência Transferência', color: 'danger', 
            local: '46', sit: '25', julg: '18',
            content: 'Pendência de Transferência\nO que é?\n    Seu protocolo está PENDENTE por falta do registro de transferência na carteira de trabalho. (declarações simples não são mais aceitas).\nComo resolver?\n    Envie a Carteira de Trabalho com a transferência OU o Extrato do e-Social completo (com data da alteração e dados da troca de CNPJ).\nSe ainda não tiver: Envie o formulário de pendência assinado por você e pela empresa, marcando a opção que se compromete a entregar em até 30 dias.\nPrazo para resposta: 1 dia útil.\nOnde enviar: No protocolo em "protocolos aguardando resposta", clicando no ícone "caneta".' 
        },
        { 
            id: 'c2', title: 'Pendência Quebra de vínculo', color: 'warning', 
            local: '46', sit: '25', julg: '18',
            content: 'Pendência de Quebra de Vínculo\nO que é?\n    Seu protocolo está PENDENTE por falta do comprovante de quebra de vínculo.\nComo resolver?\n    Envie a Carteira de Trabalho com a baixa OU o Termo de Rescisão completo e assinado. (assinaturas digitais precisam ser verificáveis).\nSe ainda não tiver: Envie o formulário de pendência assinado por você e pela empresa, marcando a opção que se compromete a entregar em até 30 dias.\nPrazo para resposta: 1 dia útil.\nOnde enviar: No protocolo em "protocolos aguardando resposta", clicando no ícone "caneta".' 
        },
        { 
            id: 'c3', title: 'Indeferimento Transferência', color: 'danger', 
            local: '46', sit: '3', julg: '3',
            content: 'Indeferimento por falta de Transferência\nO que é?\n    Seu protocolo foi INDEFERIDO por [falta documento de transferência]. (declarações simples não são mais aceitas). O requerimento de baixa de responsabilidade técnica foi negado.\nComo resolver?\n    Inicie um novo requerimento.\nO que enviar?\n    A Carteira de Trabalho com a transferência OU o Extrato do e-Social completo.\nSe ainda não tiver: Envie o formulário de pendência assinado por você e pela empresa, marcando a opção que se compromete a entregar em até 30 dias.' 
        },
        { 
            id: 'c4', title: 'Indeferimento Quebra de vínculo', color: 'warning', 
            local: '46', sit: '3', julg: '3',
            content: 'Indeferimento por falta de Quebra de Vínculo\nO que é?\n    Seu protocolo foi INDEFERIDO por [falta quebra de vinculo]. O requerimento de baixa de responsabilidade técnica foi negado.\nComo resolver?\n    Inicie um novo requerimento com todos os documentos.\nO que enviar?\n    Envie a Carteira de Trabalho com a baixa OU o Termo de Rescisão completo e assinado. (assinaturas digitais precisam ser verificáveis).\nSe ainda não tiver: Envie o formulário de pendência assinado por você e pela empresa, marcando a opção que se compromete a entregar em até 30 dias.' 
        },
        { 
            id: 'c5', title: 'Aguarda Complementação', color: 'warning', 
            local: '46', sit: '25', julg: '2',
            content: 'Documento Complementar\nO que é?\n    Sua baixa foi feita, mas há um documento pendente desde [ 00/00/0000 ].\nO que enviar?\n    A Carteira de Trabalho com a transferência OU o Extrato do e-Social completo. OU a Carteira de Trabalho com a baixa OU o Termo de Rescisão completo e assinado. (assinaturas digitais precisam ser verificáveis).\nPrazo para responder: 30 dias para enviar o comprovante de quebra de vínculo ou transferência.\nOnde enviar: Acesse o CRF em Casa, vá em "Protocolos Aguardando Resposta" e anexe o documento.' 
        },
        { id: 'c6', title: 'Desistência', color: 'light', local: '46', sit: '2', julg: '2', content: 'Procedimento trata-se de desistência do ingresso uma vez que ainda seria apreciado pelo plenário.\nDesistência efetivada.' },
        { id: 'c7', title: 'Tardia', color: 'light', local: '11', sit: '6', julg: '11', content: 'Profissional protocolou baixa em prazo superior a 30 dias.' },
        { id: 'c8', title: '30 dias', color: 'light', local: '11', sit: '6', julg: '11', content: 'Não apresentou quebra de vínculo para finalizar a baixa no prazo de 30 dias.' },
        { id: 'c9', title: 'Duplicado', color: 'light', local: '46', sit: '4', julg: '8', content: 'Pedimos a gentileza de não realizar mais de um protocolo para o mesmo procedimento e agradecemos a compreensão.\nCaso o procedimento seja aberto para correção deverá responder o mesmo protocolo, através do acesso em \'protocolos aguardando resposta\'.' },
        { id: 'c10', title: 'Sem andamento', color: 'light', local: '46', sit: '13', julg: '8', content: 'Protocolo arquivado por estar sem andamento.' },
        { id: 'c11', title: 'Indeferimento de DAP', color: 'light', local: '46', sit: '3', julg: '3', content: 'Indeferido protocolo de DAP por estar em desacordo com o art. 3º da Deliberação 1004/21.' },
        { id: 'c12', title: 'Nissei (Endereço)', color: 'light', content: 'RUA ACRE 205 – ÁGUA VERDE\n80.620-040 - CURITIBA - PARANÁ' },
        { id: 'c13', title: 'Morifarma (Endereço)', color: 'light', content: 'RUA AMAURY LANGE SILVÉRIO 33 – PILARZINHO\n82.120-000 - CURITIBA - PARANÁ' },
        { id: 'c14', title: 'São João (Endereço)', color: 'light', content: 'AVENIDA PERIMETRAL CORONEL JARBAS QUADROS DA SILVA 3701 – SÃO CRISTÓVÃO\n99.064-440 - PASSO FUNDO - RIO GRANDE DO SUL' },
        { id: 'c15', title: 'Lançamento Status I', color: 'light', content: '9436 - Comunicado / Constatação de desligamento da RT\n9464 - Sem Diretor técnico - com assistência técnica\n9457 - Sem RT - Autuações suspensas temporariamente' },
        { id: 'c16', title: 'Lançamento Status II', color: 'light', content: '14 - Sem prof com prazo até\n9467 - Sem assistência farmacêutica com prazo até\n19 - Sem prof autuar\n9468 - Sem assistência farmacêutica autuar' }
    ];

    function init() {
        render();
        setupDragAndDrop();
        initFiscalSearch();
        initCalculator();
        initPlanoFiscalizacao();
        window.saveCard = saveCard;
    }

    /* ── Renderização ────────────────────────────────────── */
    function render() {
        const grid = document.getElementById('main-grid');
        if (!grid) return;

        grid.innerHTML = INITIAL_CARDS
            .concat(state.customs)
            .filter(c => !state.deleted.includes(c.id))
            .map(c => ({ ...c, ...state.edits[c.id] }))
            .sort((a, b) => (state.order.indexOf(a.id) - state.order.indexOf(b.id)))
            .map(card => `
                <fieldset class="card border-${card.color || 'light'}" data-id="${card.id}" draggable="true">
                    <div class="card-head">
                        <span class="handle">⠿</span>
                        <div class="actions">
                            <i class="fa fa-pen" onclick="MainApp.edit('${card.id}')"></i>
                            <i class="fa fa-trash" onclick="MainApp.del('${card.id}')"></i>
                        </div>
                    </div>
                    <legend>${card.title}</legend>
                    ${card.local || card.sit || card.julg ? `<p class="info-line">Local: <b>${card.local || ''}</b> Situação: <b>${card.sit || ''}</b> Julgamento: <b>${card.julg || ''}</b></p>` : ''}
                    <textarea readonly onclick="MainApp.copy(this, '${card.id}')">${card.content}</textarea>
                    <button class="btn-copy" onclick="MainApp.copy(this, '${card.id}')">Copiar Texto</button>
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
            color: document.getElementById('m-color').value,
            local: document.getElementById('m-local').value,
            sit: document.getElementById('m-sit').value,
            julg: document.getElementById('m-julg').value
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
        document.getElementById('m-julg').value = card.julg || '';
        document.getElementById('modal').style.display = 'flex';
    }

    function del(id) {
        if (confirm('Excluir este card permanentemente?')) {
            state.deleted.push(id);
            render();
        }
    }

    async function copy(el, id) {
        const text = el.tagName === 'TEXTAREA' ? el.value : el.previousElementSibling.value;
        try {
            await navigator.clipboard.writeText(text);
            const btn = document.querySelector(`[data-id="${id}"] .btn-copy`);
            const textarea = document.querySelector(`[data-id="${id}"] textarea`);
            const original = btn.textContent;
            btn.textContent = 'Copiado!';
            textarea.style.background = '#22c55e';
            btn.style.background = '#22c55e';
            btn.style.color = '#fff';
            setTimeout(() => { 
                btn.textContent = original; 
                btn.style.background = ''; 
                btn.style.color = '';
            }, 1200);
        } catch(e) { alert('Erro ao copiar'); }
    }

    /* ── Busca de Fiscais ─────────────────────────────────── */
    let fiscalData = [];
    function initFiscalSearch() {
        const select = document.getElementById('fiscal-select');
        fetch('assets/dados.ods').then(r => r.arrayBuffer()).then(buf => {
            // Silenciar todos os logs do XLSX (ODS number format warnings usam console.error)
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
                    regiao: l[2], 
                    codigo: l[3] 
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
                ? `<b>Código:</b> ${d.codigo}<br><b>Região:</b> ${d.regiao}` 
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

    /* ── Plano Fiscalização ──────────────────────────────── */
    async function initPlanoFiscalizacao() {
        const btnPlano = document.getElementById('btnPlanoFiscalizacao');
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
            const target = e.target.closest('fieldset');
            if (target && target.dataset.id !== draggedId) {
                const currentIds = Array.from(grid.querySelectorAll('fieldset')).map(f => f.dataset.id);
                const fromIdx = currentIds.indexOf(draggedId);
                const toIdx = currentIds.indexOf(target.dataset.id);
                currentIds.splice(toIdx, 0, currentIds.splice(fromIdx, 1)[0]);
                state.order = currentIds;
                render();
            }
        };
        grid.ondragstart = e => {
            if (!e.target.classList.contains('card')) return e.preventDefault();
            e.dataTransfer.setData('id', e.target.dataset.id);
        };
    }

    const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const closeModal = () => document.getElementById('modal').style.display = 'none';

    document.addEventListener('DOMContentLoaded', init);

    return { edit, del, copy, closeModal, openCreate: () => {
        document.getElementById('m-id').value = '';
        document.getElementById('m-title').value = '';
        document.getElementById('m-content').value = '';
        document.getElementById('m-color').value = 'light';
        document.getElementById('m-local').value = '';
        document.getElementById('m-sit').value = '';
        document.getElementById('m-julg').value = '';
        document.getElementById('modal').style.display = 'flex';
    }};
})();
