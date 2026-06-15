import { describe, it, expect, beforeEach, vi } from 'vitest';

// Helper to load a fresh instance of MainApp
const loadMainApp = () => {
  vi.resetModules();
  return require('../../js/main.js');
};

describe('MainApp extended unit tests', () => {
  let MainApp;
  let mockLocalStorage;
  let mockBootstrap;
  let mockFetch;
  let mockXLSX;

  beforeEach(async () => {
    // Setup DOM elements needed for many functions
    document.body.innerHTML = `
      <div id="dynamic-cards"></div>
      <div id="toast-container"></div>
      <div id="confirmModal"></div>
      <div id="confirm-title"></div>
      <div id="confirm-message"></div>
      <div id="confirm-icon"></div>
      <button id="confirm-btn-yes"></button>
      <input id="login-email" />
      <input id="login-password" />
      <div id="login-error"></div>
      <div id="link-field-group"></div>
      <input id="old-password" />
      <input id="new-password" />
      <input id="confirm-new-password" />
      <input id="weather-city-filter" />
      <select id="weather-city-select"></select>
      <div id="cardModal"></div>
      <div id="locationModal"></div>
      <div id="settingsModal"></div>
      <input id="m-id" />
      <input id="m-title" />
      <input id="m-content" />
      <input id="m-color" />
      <input id="m-local" />
      <input id="m-sit" />
      <input id="m-julgamento" />
      <input id="m-type" />
      <input id="m-link" />
      <div class="form-check"><input id="m-showDate" type="checkbox" /></div>
      <input id="gh-token" />
      <input id="gh-repo" />
      <div id="gh-status"></div>
      <div id="ferr-categorias-radios">
        <label class="ferr-radio-label active"><input type="radio" name="ferr-cat" value="varejista" checked> Varejista <b class="text-success">R$ <span>4.729,62</span></b></label>
        <label class="ferr-radio-label"><input type="radio" name="ferr-cat" value="hospitalar"> Hospitalar <b class="text-success">R$ <span>4.567,00</span></b></label>
      </div>
      <div id="ferr-piso-base-display"></div>
      <div id="ferr-valor-hora"></div>
      <div id="ferr-total-horas-display"></div>
      <div id="ferr-horas-semana-display"></div>
      <div id="ferr-piso-prop"></div>
      <div id="ferr-intervalo-alerta" class="d-none"><span id="ferr-intervalo-msg"></span></div>
      <button id="ferr-copy"></button>
      <div id="ferr-horas-lote">
        <input type="checkbox" class="ferr-dia-check" value="SEG" checked>
        <input id="ferr-lote-entrada" type="time">
        <input id="ferr-lote-saida" type="time">
        <button id="ferr-lote-aplicar"></button>
        <button id="ferr-lote-limpar"></button>
      </div>
      <table><tbody id="ferr-calc-horas-body"></tbody><tfoot><td id="ferr-calc-horas-total"></td></tfoot></table>
      <div id="ferr-cidade-select" class="d-none"></div>
      <input id="ferr-cidade">
      <select id="fiscal-select"></select>
      <input id="fiscal-filter" />
      <div id="fiscal-res"></div>
    `;

    // Mock localStorage
    mockLocalStorage = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn()
    };
    global.localStorage = mockLocalStorage;

    // Mock bootstrap.Modal
    mockBootstrap = { Modal: vi.fn(function() { return { show: vi.fn(), hide: vi.fn() }; }) };
    global.bootstrap = mockBootstrap;

    // Mock XLSX (used only in fiscal search)
    mockXLSX = { read: vi.fn(), utils: { sheet_to_json: vi.fn() } };
    global.XLSX = mockXLSX;

    // Mock fetch – default returns a generic ok response; specific tests will override.
    mockFetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ customs: [] }) }));
    global.fetch = mockFetch;

    // Mock navigator.geolocation (used by initWeather, called during init)
    global.navigator.geolocation = {
      getCurrentPosition: vi.fn()
    };

    // Load fresh MainApp instance and initialise it to set up internal state.
    MainApp = loadMainApp();
    await MainApp.init();
  });

  /*** 1. Fiscal search integration ***/
  it('initialises fiscal search and populates city options', async () => {
    // Prepare mock XLSX conversion
    const fakeData = [
      ['Cidade', 'Fiscal', 'Região', 'Código'],
      ['Curitiba', 'Fiscal A', 'Sul', '123'],
      ['São Paulo', 'Fiscal B', 'Sudeste', '456']
    ];
    mockXLSX.utils.sheet_to_json.mockReturnValue(fakeData);
    // Mock the fetch that retrieves the .ods file – return an ArrayBuffer placeholder
    const arrayBuffer = new Uint8Array([1, 2, 3]).buffer;
    mockFetch.mockImplementationOnce(() => Promise.resolve({ arrayBuffer: () => Promise.resolve(arrayBuffer) }));
    // Mock XLSX.read to return a valid workbook object
    mockXLSX.read.mockReturnValue({ Sheets: { 'Sheet1': [] }, SheetNames: ['Sheet1'] });

    // Call the actual function (exposed via MainApp)
    await MainApp.initFiscalSearch();

    const select = document.getElementById('fiscal-select');
    expect(select).not.toBeNull();
    // The first option is the placeholder, then two city options
    expect(select.options.length).toBe(3);
    expect(select.options[1].value).toBe('Curitiba');
    expect(select.options[2].value).toBe('São Paulo');
  });

  /*** 2. Calculator logic ***/
  it('calculator updates totals when inputs change', () => {
    // Inicializa a calculadora (cria tabela de horas e listeners)
    MainApp.initCalculator();

    var pisoBaseDisplay = document.getElementById('ferr-piso-base-display');
    var valorHoraEl = document.getElementById('ferr-valor-hora');
    var totalHorasDisplay = document.getElementById('ferr-total-horas-display');
    var jornadaDisplay = document.getElementById('ferr-horas-semana-display');
    var pisoPropEl = document.getElementById('ferr-piso-prop');

    // Após init, valores padrão (varejista: R$ 4.729,62, 0h trabalhadas)
    expect(pisoBaseDisplay.textContent).toBe('R$ 4.729,62');
    expect(valorHoraEl.textContent).toBe('R$ 21,50');
    expect(jornadaDisplay.textContent).toBe('44h');
    expect(pisoPropEl.textContent).toBe('R$ 0,00');

    // Preenche horas: SEG 08:00-12:00 e 14:00-18:00 = 8h
    var loteEntrada = document.getElementById('ferr-lote-entrada');
    var loteSaida = document.getElementById('ferr-lote-saida');
    loteEntrada.value = '08:00';
    loteSaida.value = '12:00';
    document.getElementById('ferr-lote-aplicar').click();

    loteEntrada.value = '14:00';
    loteSaida.value = '18:00';
    document.getElementById('ferr-lote-aplicar').click();

    // Total de horas: 8h → piso proporcional = 4729.62 * 8 / 44 ≈ 859,93
    expect(totalHorasDisplay.textContent).toBe('8h');
    expect(pisoPropEl.textContent).toBe('R$ 859,93');
  });

  /*** 3. Cloud backup – GitHub interaction ***/
  it('performs cloud backup and updates status', async () => {
    // Fill token & repo fields
    document.getElementById('gh-token').value = 'FAKE_TOKEN';
    document.getElementById('gh-repo').value = 'my-repo';

    // Clear call history from init() so mock.calls only reflects cloudBackup fetches
    mockFetch.mockClear();

    // Mock user endpoint to return a username
    mockFetch
      .mockImplementationOnce(() => Promise.resolve({ status: 200, json: () => Promise.resolve({ login: 'myuser' }) })) // user request
      .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ sha: 'oldsha' }) })) // file exists (optional)
      .mockImplementationOnce(() => Promise.resolve({ ok: true })); // PUT request

    await MainApp.cloudBackup();

    const statusEl = document.getElementById('gh-status');
    expect(statusEl.textContent).toContain('Backup ok!');
    // Verify fetch calls use proper URL pattern
    const putCall = mockFetch.mock.calls[2];
    expect(putCall[0]).toMatch(/https:\/\/api\.github\.com\/repos\/myuser\/my-repo\/contents\/cards_backup\.json/);
    // LocalStorage should now hold token/repo
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('gh_token', 'FAKE_TOKEN');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('gh_repo', 'my-repo');
  });

  /*** 4. Cloud restore – resolves confirm and updates state ***/
  it('restores backup from GitHub when user confirms', async () => {
    document.getElementById('gh-token').value = 'FAKE_TOKEN';
    document.getElementById('gh-repo').value = 'my-repo';

    // Mock confirmation dialog to resolve true
    const confirmPromise = Promise.resolve(true);
    MainApp.showConfirm = vi.fn(() => confirmPromise);

    // Mock user request and file fetch
    mockFetch
      .mockImplementationOnce(() => Promise.resolve({ status: 200, json: () => Promise.resolve({ login: 'myuser' }) })) // user request
      .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ content: btoa(JSON.stringify({ order: ['x'], customs: [], edits: {}, deleted: [] })) }) })); // GET file

    await MainApp.cloudRestore();

    // After restore, internal state should reflect the fetched JSON
    expect(MainApp.getActiveDash().order).toEqual(['x']);
    const statusEl = document.getElementById('gh-status');
    expect(statusEl.textContent).toContain('Sincronizado!');
  });

  /*** 5. Delete card flow ***/
  it('deletes a card after user confirmation', async () => {
    // Add a dummy card to state
    MainApp.getActiveDash().customs.push({ id: 'card-1', title: 'Teste', content: 'abc' });
    MainApp.render();
    // Mock confirmation to true
    MainApp.showConfirm = vi.fn(() => Promise.resolve(true));

    await MainApp.del('card-1');
    expect(MainApp.getActiveDash().deleted).toContain('card-1');
  });

  /*** 6. Edit flow populates modal fields ***/
  it('loads a card into the edit modal', () => {
    // Create a card and ensure it's in the custom list
    const card = { id: 'c1', title: 'Title', content: 'Conteúdo', color: 'light', local: '', sit: '', julgamento: '', type: 'copy', link: '' };
    MainApp.getActiveDash().customs.push(card);
    // Simulate edit call
    MainApp.edit('c1');
    // Verify modal fields contain the card data
    expect(document.getElementById('m-id').value).toBe('c1');
    expect(document.getElementById('m-title').value).toBe('Title');
    expect(document.getElementById('m-content').value).toBe('Conteúdo');
    expect(document.getElementById('m-color').value).toBe('light');
  });
});
