/**
 * main.js — O Cérebro do Sistema (Versão com CONTEÚDO COMPLETO)
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

            async function loadDataFromServer() {
        // Carrega dados do Servidor (Ponte Local)
        try {
            console.log("Buscando dados no servidor...");
            const response = await fetch(API_URL);
            if (response.ok) {
                const serverData = await response.json();
                state.order = serverData.order || [];
                state.customs = serverData.customs || [];
                state.edits = serverData.edits || {};
                state.deleted = serverData.deleted || [];
                console.log("Dados carregados do servidor com sucesso.");
                const backupSource = response.headers.get('X-Backup-Source');
                const githubError = response.headers.get('X-GitHub-Error');
                if (backupSource === 'local-fallback') {
                    showCloudStatus('Backend Baixa online, mas não conseguiu ler o backup no GitHub: ' + (githubError || 'erro desconhecido'));
                } else {
                    await checkBackendHealth();
                }
            } else {
                console.warn("Servidor offline ou vazio, carregando backup local...");
                showCloudStatus('Backend Baixa respondeu com erro. Usando backup local.');
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
            showCloudStatus('Backend Baixa indisponível. Usando backup local.');
            console.error("Erro ao conectar ao servidor:", e);
            try {
                const backupRes = await fetch('cards_backup.json');
                if (backupRes.ok) {
                    const backupData = await backupRes.json();
                    state.order = backupData.order || [];
                    state.customs = backupData.customs || [];
                    state.edits = backupData.edits || {};
                    state.deleted = backupData.deleted || [];
                }
            } catch (err) {}
        }
        render();
    }

    function showCloudStatus(message) {
        const status = document.getElementById('gh-status');
        if (status) status.textContent = message;

        const type = /corretamente|Sincronizado|configurado\. Dados/.test(message)
            ? 'success'
            : /online|backend/.test(message)
                ? 'info'
                : 'warning';
        showToast(message, type, 6000);
    }

    async function checkBackendHealth() {
        try {
            const response = await fetch(API_HEALTH_URL);
            const health = await response.json().catch(() => ({}));

            if (!response.ok) {
                showCloudStatus('Backend Baixa respondeu com erro ao validar a configuração.');
                return;
            }

            const github = health.github || {};

            if (github.status === 'valid' && github.canPush) {
                if (health.backup?.readable) {
                    showCloudStatus('GitHub configurado. Dados carregados direto do backup no GitHub.');
                } else {
                    showCloudStatus('GitHub configurado, mas o backup não foi lido: ' + (health.backup?.message || 'erro desconhecido'));
                }
            } else if (github.status === 'valid') {
                showCloudStatus('Chave do GitHub válida, mas sem permissão de escrita no repositório.');
            } else if (github.status === 'missing') {
                showCloudStatus('Chave do GitHub não configurada no backend (GITHUB_TOKEN ausente).');
            } else if (github.status === 'invalid') {
                showCloudStatus('Chave do GitHub inválida ou expirada no backend.');
            } else if (github.status === 'forbidden') {
                showCloudStatus('Chave do GitHub sem permissão para gravar neste repositório.');
            } else if (github.status === 'repo_not_found') {
                showCloudStatus('Repositório não encontrado ou chave sem acesso ao repositório.');
            } else if (github.message) {
                showCloudStatus('GitHub: ' + github.message);
            } else {
                showCloudStatus('Backend Baixa online. Validação do GitHub indisponível.');
            }
        } catch (error) {
            showCloudStatus('Não foi possível validar a chave no backend Baixa.');
        }
    }

    async function init() {
        // Opcional: Disparar a ponte de automação local (Desativado temporariamente)
        // dispararAutomacaoPonte(dadosParaPonte);

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

             const overlay = document.getElementById('login-overlay');
             overlay.classList.remove('d-flex');
             overlay.classList.add('d-none');
             showToast(`Bem-vindo, ${emailInput.value.split('@')[0]}!`, 'success');
            loadDataFromServer();
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
                        <button class="btn btn-link btn-sm p-0 ms-1 text-muted weather-refresh-btn" onclick="MainApp.refreshWeather(event)" title="Atualizar clima">
                            <i class="fas fa-sync-alt" style="font-size: 0.65rem;"></i>
                        </button>
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

    async function refreshWeather(e) {
        if (e) {
            e.stopPropagation();
            const btn = e.currentTarget;
            if (btn) {
                const icon = btn.querySelector('i');
                if (icon) icon.classList.add('fa-spin');
            }
        }
        await initWeather();
        showToast('Clima atualizado!', 'info', 2000);
    }

    document.addEventListener('DOMContentLoaded', init);

    return {
        edit,
        del,
        copy,
        closeModal,
        toggleLinkField,
        checkLogin,
        forgotPassword,
        updatePassword,
        logout,
        changeLocation,
        saveLocationManual,
        refreshWeather,
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
        },
        init,
        initFiscalSearch,
        initCalculator,
        render,
        showToast,
        get __state() { return state; },
        __resetState: () => {
            state.order = [];
            state.customs = [];
            state.edits = {};
            state.deleted = [];
            save();
        }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainApp;
}





