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

  beforeEach(() => {
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
      <input id="m-showDate" type="checkbox" />
      <input id="gh-token" />
      <input id="gh-repo" />
      <div id="gh-status"></div>
      <input id="piso" value="0" />
      <input id="horas" value="0" />
      <div id="res-total"></div>
      <div id="res-hora"></div>
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

    // Load fresh MainApp instance and initialise it to set up internal state.
    MainApp = loadMainApp();
    MainApp.init();
  });

  /*** 1. Fiscal search integration ***/
  it('initialises fiscal search and populates city options', async () => {
    // Prepare mock XLSX conversion
    const fakeData = [
      ['Cidade', 'Fiscal', 'Região', 'Código'],
      ['Curitiba', 'Fiscal A', 'Sul', '123'],
      ['São Paulo', 'Fiscal B', 'Sudeste', '456']
    ];
    const fakeJson = fakeData.map(row => ({ cidade: row[0], fiscal: row[1], region: row[2], code: row[3] }));
    mockXLSX.utils.sheet_to_json.mockReturnValue(fakeJson);
    // Mock the fetch that retrieves the .ods file – return an ArrayBuffer placeholder
    const arrayBuffer = new Uint8Array([1, 2, 3]).buffer;
    mockFetch.mockImplementationOnce(() => Promise.resolve({ arrayBuffer: () => Promise.resolve(arrayBuffer) }));

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
    const pisoEl = document.getElementById('piso');
    const horasEl = document.getElementById('horas');
    const totalEl = document.getElementById('res-total');
    const horaEl = document.getElementById('res-hora');

    // Simulate user input
    pisoEl.value = '2200';
    horasEl.value = '44';
    // Trigger oninput handlers set by initCalculator (already called in init)
    const inputEvent = new Event('input');
    pisoEl.dispatchEvent(inputEvent);
    horasEl.dispatchEvent(inputEvent);

    expect(totalEl.textContent).toBe('2200,00'); // 2200*44/44 = 2200
    expect(horaEl.textContent).toBe('10,00'); // 2200/220 = 10
  });

  /*** 3. Cloud backup – GitHub interaction ***/
  it('performs cloud backup and updates status', async () => {
    // Fill token & repo fields
    document.getElementById('gh-token').value = 'FAKE_TOKEN';
    document.getElementById('gh-repo').value = 'my-repo';

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
    global.showConfirm = vi.fn(() => confirmPromise);

    // Mock user request and file fetch
    mockFetch
      .mockImplementationOnce(() => Promise.resolve({ status: 200, json: () => Promise.resolve({ login: 'myuser' }) })) // user request
      .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ content: btoa(JSON.stringify({ order: ['x'], customs: [], edits: {}, deleted: [] })) }) })); // GET file

    await MainApp.cloudRestore();

    // After restore, internal state should reflect the fetched JSON
    expect(MainApp.__state.order).toEqual(['x']);
    const statusEl = document.getElementById('gh-status');
    expect(statusEl.textContent).toContain('Sincronizado!');
  });

  /*** 5. Delete card flow ***/
  it('deletes a card after user confirmation', async () => {
    // Add a dummy card to state
    MainApp.__state.customs.push({ id: 'card-1', title: 'Teste', content: 'abc' });
    MainApp.render();
    // Mock confirmation to true
    global.showConfirm = vi.fn(() => Promise.resolve(true));

    await MainApp.del('card-1');
    expect(MainApp.__state.deleted).toContain('card-1');
  });

  /*** 6. Edit flow populates modal fields ***/
  it('loads a card into the edit modal', () => {
    // Create a card and ensure it's in the custom list
    const card = { id: 'c1', title: 'Title', content: 'Conteúdo', color: 'light', local: '', sit: '', julgamento: '', type: 'copy', link: '' };
    MainApp.__state.customs.push(card);
    // Simulate edit call
    MainApp.edit('c1');
    // Verify modal fields contain the card data
    expect(document.getElementById('m-id').value).toBe('c1');
    expect(document.getElementById('m-title').value).toBe('Title');
    expect(document.getElementById('m-content').value).toBe('Conteúdo');
    expect(document.getElementById('m-color').value).toBe('light');
  });
});
