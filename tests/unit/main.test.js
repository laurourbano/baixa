import { describe, it, expect, beforeEach, vi } from 'vitest';

// Helper to load MainApp (the module exports an object)
const loadMainApp = () => {
  // Clear require cache to get fresh module instance
  vi.resetModules();
  const MainApp = require('../../js/main.js');
  return MainApp;
};

describe('MainApp unit tests', () => {
  let MainApp;
  let mockLocalStorage;
  let mockBootstrap;
  let mockXLSX;
  let mockFetch;

  beforeEach(() => {
    // Reset DOM
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

    // Mock bootstrap Modal
    mockBootstrap = {
      Modal: vi.fn(function() { return { show: vi.fn(), hide: vi.fn() }; })
    };
    global.bootstrap = mockBootstrap;

    // Mock XLSX (used only in fiscal search, not exercised here)
    mockXLSX = { read: vi.fn(), utils: { sheet_to_json: vi.fn() } };
    global.XLSX = mockXLSX;

    // Mock fetch (used in init for backup loading)
    mockFetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ customs: [] }) }));
    global.fetch = mockFetch;

    // Load fresh instance of MainApp
    MainApp = loadMainApp();
    // Initialise the app – this will populate internal state
    MainApp.init();
  });

  it('initialises with empty state', () => {
    expect(MainApp.__state.order).toEqual([]);
    expect(MainApp.__state.customs).toEqual([]);
    expect(MainApp.__state.edits).toEqual({});
    expect(MainApp.__state.deleted).toEqual([]);
  });

  it('can reset internal state via __resetState', () => {
    // Simulate a change in state
    MainApp.__state.order.push('temp-id');
    MainApp.__state.customs.push({ id: 'c1', title: 'test' });
    // Reset
    MainApp.__resetState();
    expect(MainApp.__state.order).toEqual([]);
    expect(MainApp.__state.customs).toEqual([]);
    expect(MainApp.__state.edits).toEqual({});
    expect(MainApp.__state.deleted).toEqual([]);
  });

  it('showToast creates a toast element with proper content', () => {
    MainApp.showToast('Teste mensagem', 'info', 5000);
    const container = document.getElementById('toast-container');
    const toast = container.querySelector('.custom-toast');
    expect(toast).not.toBeNull();
    expect(toast.textContent).toContain('Teste mensagem');
    // Verify class matches type
    expect(toast.className).toContain('toast-info');
  });

  it('copy writes text to clipboard and updates UI', async () => {
    // Mock clipboard API
    const writeTextMock = vi.fn(() => Promise.resolve());
    global.navigator.clipboard = { writeText: writeTextMock };

    // Build a minimal card structure expected by copy()
    const card = document.createElement('div');
    card.dataset.id = 'card-1';
    card.setAttribute('data-color', 'light');
    card.innerHTML = `
      <div class="content-display">Texto a copiar</div>
      <button class="btn-copy-mini btn-outline-success">Copy</button>
      <div class="card-copy-success" style="display:none;">OK</div>
      <div class="card-copy-hint">Clique no card para copiar</div>
    `;
    document.getElementById('dynamic-cards').appendChild(card);

    // Ensure no previous copy in progress
    MainApp.__resetState();

    await MainApp.copy(card.querySelector('.content-display'), 'card-1');
    expect(writeTextMock).toHaveBeenCalledWith('Texto a copiar');
    // After copy, button should have active class and check icon
    const btn = card.querySelector('.btn-copy-mini');
    expect(btn.classList).toContain('btn-active');
    expect(btn.innerHTML).toContain('fa-check');
    // Content should be bold
    const contentEl = card.querySelector('.content-display');
    expect(contentEl.classList).toContain('fw-bold');
    // Card should have highlighted classes
    expect(card.classList).toContain('shadow-lg');
    expect(card.classList).toContain('copied-active');
  });
});
