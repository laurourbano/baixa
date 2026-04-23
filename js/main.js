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
    const INITIAL_CARDS = [
        { 
            id: 'c1', title: 'Pendência Transferência', color: 'danger', 
            local: '46', sit: '25', julgamento: '18',
            content: 'Pendência de Transferência\nO que é?\n    Seu protocolo está PENDENTE por falta do registro de transferência na carteira de trabalho. (declarações simples não são mais aceitas).\nComo resolver?\n    Envie a Carteira de Trabalho com a transferência OU o Extrato do e-Social completo (com data da alteração e dados da troca de CNPJ).\nSe ainda não tiver: Envie o formulário de pendência assinado por você e pela empresa, marcando a opção que se compromete a entregar em até 30 dias.\nPrazo para resposta: 1 dia útil.\nOnde enviar: No protocolo em "protocolos aguardando resposta", clicando no ícone "caneta".' 
        },
        { 
            id: 'c2', title: 'Pendência Quebra de vínculo', color: 'warning', 
            local: '46', sit: '25', julgamento: '18',
            content: 'Pendência de Quebra de Vínculo\nO que é?\n    Seu protocolo está PENDENTE por falta do comprovante de quebra de vínculo.\nComo resolver?\n    Envie a Carteira de Trabalho com a baixa OU o Termo de Rescisão completo e assinado. (assinaturas digitais precisam ser verificáveis).\nSe ainda não tiver: Envie o formulário de pendência assinado por você e pela empresa, marcando a opção que se compromete a entregar em até 30 dias.\nPrazo para resposta: 1 dia útil.\nOnde enviar: No protocolo em "protocolos aguardando resposta", clicando no ícone "caneta".' 
        },
        { 
            id: 'c3', title: 'Indeferimento Transferência', color: 'danger', 
            local: '46', sit: '3', julgamento: '3',
            content: 'Indeferimento por falta de Transferência\nO que é?\n    Seu protocolo foi INDEFERIDO por [falta documento de transferência]. (declarações simples não são mais aceitas). O requerimento de baixa de responsabilidade técnica foi negado.\nComo resolver?\n    Inicie um novo requerimento.\nO que enviar?\n    A Carteira de Trabalho com a transferência OU o Extrato do e-Social completo.\nSe ainda não tiver: Envie o formulário de pendência assinado por você e pela empresa, marcando a opção que se compromete a entregar em até 30 dias.' 
        },
        { 
            id: 'c4', title: 'Indeferimento Quebra de vínculo', color: 'warning', 
            local: '46', sit: '3', julgamento: '3',
            content: 'Indeferimento por falta de Quebra de Vínculo\nO que é?\n    Seu protocolo foi INDEFERIDO por [falta quebra de vinculo]. O requerimento de baixa de responsabilidade técnica foi negado.\nComo resolver?\n    Inicie um novo requerimento com todos os documentos.\nO que enviar?\n    Envie a Carteira de Trabalho com a baixa OU o Termo de Rescisão completo e assinado. (assinaturas digitais precisam ser verificáveis).\nSe ainda não tiver: Envie o formulário de pendência assinado por você e pela empresa, marcando a opção que se compromete a entregar em até 30 dias.' 
        },
        { 
            id: 'c5', title: 'Aguarda Complementação', color: 'info', 
            local: '46', sit: '25', julgamento: '2',
            content: `Documento Complementar\nO que é?\n    Sua baixa foi feita, mas há um documento pendente desde [ 00/00/0000 ].\nO que enviar?\n    A Carteira de Trabalho com a transferência OU o Extrato do e-Social completo. OU a Carteira de Trabalho com a baixa OU o Termo de Rescisão completo e assinado. (assinaturas digitais precisam ser verificáveis).\nPrazo para responder: 30 dias para enviar o comprovante de quebra de vínculo ou transferência.\nOnde enviar: Acesse o CRF em Casa, vá em "Protocolos Aguardando Resposta" e anexe o documento.`
        },
        { id: 'c6', title: 'Desistência', color: 'light', local: '46', sit: '2', julgamento: '2', content: 'Procedimento trata-se de desistência do ingresso uma vez que ainda seria apreciado pelo plenário.\nDesistência efetivada.' },
        { id: 'c7', title: 'Tardia', color: 'warning', local: '11', sit: '6', julgamento: '11', content: 'Profissional protocolou baixa em prazo superior a 30 dias.' },
        { id: 'c8', title: '30 dias', color: 'danger', local: '11', sit: '6', julgamento: '11', content: 'Não apresentou quebra de vínculo para finalizar a baixa no prazo de 30 dias.' },
        { id: 'c9', title: 'Duplicado', color: 'light', local: '46', sit: '4', julgamento: '8', content: 'Pedimos a gentileza de não realizar mais de um protocolo para o mesmo procedimento e agradecemos a compreensão.\nCaso o procedimento seja aberto para correção deverá responder o mesmo protocolo, através do acesso em \'protocolos aguardando resposta\'.' },
        { id: 'c10', title: 'Sem andamento', color: 'light', local: '46', sit: '13', julgamento: '8', content: 'Protocolo arquivado por estar sem andamento.' },
        { id: 'c11', title: 'Indeferimento de DAP', color: 'light', local: '46', sit: '3', julgamento: '3', content: 'Indeferido protocolo de DAP por estar em desacordo com o art. 3º da Deliberação 1004/21.' },
        { id: 'c12', title: 'Nissei (Endereço)', color: 'light', content: 'RUA ACRE 205 – ÁGUA VERDE\n80.620-040 - CURITIBA - PARANÁ' },
        { id: 'c13', title: 'Morifarma (Endereço)', color: 'light', content: 'RUA AMAURY LANGE SILVÉRIO 33 – PILARZINHO\n82.120-000 - CURITIBA - PARANÁ' },
        { id: 'c14', title: 'São João (Endereço)', color: 'light', content: 'AVENIDA PERIMETRAL CORONEL JARBAS QUADROS DA SILVA 3701 – SÃO CRISTÓVÃO\n99.064-440 - PASSO FUNDO - RIO GRANDE DO SUL' },
        { id: 'c15', title: 'Lançamento Status I', color: 'light', content: '9436 - Comunicado / Constatação de desligamento da RT\n9464 - Sem Diretor técnico - com assistência técnica\n9457 - Sem RT - Autuações suspensas temporariamente' },
        { id: 'c16', title: 'Lançamento Status II', color: 'light', content: '14 - Sem prof com prazo até\n9467 - Sem assistência farmacêutica com prazo até\n19 - Sem prof autuar\n9468 - Sem assistência farmacêutica autuar' },
        { id: 'c17', title: 'Plano anual de fiscalização', color: 'light', content: 'plano anual de fiscalização', type: 'pdf', link: 'https://crf-pr.org.br/uploads/documento/24780/CCfzSSTrVo4kemWMhnXB9RH027YttX6d.pdf', local: '0', sit: '0', julgamento: '0' },
        { id: 'c18', title: 'correios', color: 'light', content: 'Correios', type: 'link', link: 'https://meuscorreios.app/sectweblogin.aspx' },
        { id: 'c19', title: 'intranet crf-pr', color: 'light', content: 'Intranet', type: 'link', link: 'https://intranet.crf-pr.org.br/index.php' },
        { id: 'c20', title: 'Sei', color: 'light', content: 'SEI', type: 'link', link: 'https://documentos.cff.org.br/sei/controlador.php?acao=painel_controle_visualizar&acao_origem=principal&acao_retorno=principal&inicializando=1&infra_sistema=100000100&infra_unidade_atual=110002144&infra_hash=c581e50330157567f7c18c85c78175fceab8c29963172a8cb0974cb7341e6b3f' },
        { id: 'c21', title: 'e-Forms', color: 'light', content: 'Formulários digitais', type: 'link', link: 'https://servicos.crf-pr.org.br' },
        { id: 'c22', title: 'Agendamento', color: 'light', content: 'Agendamento presencial', type: 'link', link: 'https://agendamento.crf-pr.org.br:543/' },
        { id: 'c23', title: 'crf-pr em casa', color: 'light', content: 'crf-pr em casa', type: 'link', link: 'https://crfemcasa.crf-pr.org.br/crf-em-casa/login.jsf' },
        { id: 'c24', title: 'smartcore', color: 'light', content: 'crf-pr.9905@SMARTCORE\ns1gm4f0n7', type: 'copy' }
    ];

    function init() {
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
            .map(card => {
                const isLink = card.type === 'link' || card.type === 'pdf';
                const icon = card.type === 'pdf' ? 'fa-file-pdf' : 'fa-external-link-alt';
                const btnLabel = card.type === 'pdf' ? 'Abrir PDF' : 'Abrir Link';
                
                return `
                <fieldset class="card border-${card.color || 'light'}" data-id="${card.id}" draggable="true" ${!isLink ? `onclick="MainApp.copy(this.querySelector('textarea'), '${card.id}')"` : ''}>
                    <div class="card-head" onclick="event.stopPropagation()">
                        <span class="handle">⠿</span>
                        <div class="actions">
                            <i class="fa fa-pen" onclick="MainApp.edit('${card.id}')"></i>
                            <i class="fa fa-trash" onclick="MainApp.del('${card.id}')"></i>
                        </div>
                    </div>
                    <legend>${card.title}</legend>
                    ${card.local || card.sit || card.julgamento ? `<p class="info-line">Local: <b>${card.local || ''}</b> Situação: <b>${card.sit || ''}</b> Julgamento: <b>${card.julgamento || ''}</b></p>` : ''}
                    
                    ${isLink ? `
                        <div class="link-card-body">
                            <p class="small text-muted mb-2">${card.content || 'Sem descrição'}</p>
                            <a href="${card.link}" target="_blank" class="btn btn-block btn-outline-${card.color === 'light' ? 'primary' : card.color} btn-sm mt-auto" onclick="event.stopPropagation()">
                                <i class="fas ${icon} mr-2"></i>${btnLabel}
                            </a>
                        </div>
                    ` : `
                        <textarea readonly>${formattedDate} - ${card.content}</textarea>
                        <button class="btn-copy" onclick="event.stopPropagation(); MainApp.copy(this, '${card.id}')">Copiar Texto</button>
                    `}
                </fieldset>
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
            link: document.getElementById('m-link').value
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
        
        toggleLinkField();
        document.getElementById('modal').style.display = 'flex';
    }

    function del(id) {
        if (confirm('Excluir este card permanentemente?')) {
            state.deleted.push(id);
            render();
        }
    }

    let _copying = false;
    async function copy(el, id) {
        if (_copying) return;          // bloqueia duplo-clique
        _copying = true;

        const card = document.querySelector(`[data-id="${id}"]`);
        const textarea = card && card.querySelector('textarea');
        if (!textarea) { _copying = false; return; }

        const text = textarea.value;
        try {
            await navigator.clipboard.writeText(text);
            const btn = card.querySelector('.btn-copy');
            if (btn) {
                const original = btn.textContent;
                btn.textContent = 'Copiado!';
                btn.style.background = '#22c55e';
                btn.style.color = '#fff';
            }
            textarea.style.color = '#22c55e';
            setTimeout(() => {
                if (btn) {
                    btn.textContent = 'Copiar Texto';
                    btn.style.background = '';
                    btn.style.color = '';
                }
                textarea.style.color = '';
                _copying = false;        // libera após o feedback visual
            }, 1200);
        } catch(e) {
            _copying = false;
            alert('Erro ao copiar');
        }
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
                ? `<b>Código:</b> ${d.code}<br><b>Região:</b> ${d.region}` 
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

    function toggleLinkField() {
        const type = document.getElementById('m-type').value;
        const group = document.getElementById('link-field-group');
        group.style.display = (type === 'link' || type === 'pdf') ? 'block' : 'none';
        
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
        toggleLinkField();
        document.getElementById('modal').style.display = 'flex';
    }};
})();
