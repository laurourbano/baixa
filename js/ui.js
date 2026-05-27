/* ── Controle de Interface (Extraído do HTML) ── */
function toggleSidebar(e) {
    var sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('expanded');
    var isExpanded = sidebar.classList.contains('expanded');
    localStorage.setItem('sidebar_expanded', isExpanded ? '1' : '0');
}

function toggleTheme() {
    var currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    document.documentElement.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('portal_theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    var icon = document.getElementById('theme-icon');
    if (icon) {
        if (theme === 'light') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }
}

function switchView(viewName) {
    // Update nav active state — apenas para nav-item estáticos
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(function (el) {
        el.classList.remove('active');
    });

    var navEl = document.getElementById('nav-' + viewName);
    if (navEl) {
        navEl.classList.add('active');
    }

    // Se for dashboard, destaca o item ativo na lista dinâmica de dashboards
    if (viewName === 'dashboard') {
        var activeId = window.MainApp && window.MainApp.__state && window.MainApp.__state.activeDashboard;
        if (activeId) {
            var rows = document.querySelectorAll('#sidebar-dashboards .dash-nav-row');
            rows.forEach(function (r) { r.classList.remove('active'); });
            var items = document.querySelectorAll('#sidebar-dashboards .dash-nav-item');
            items.forEach(function (item) {
                item.classList.remove('active');
                if (item.getAttribute('data-dash-id') === activeId) {
                    item.classList.add('active');
                    item.parentElement.classList.add('active');
                }
            });
        }
    }

    // Hide all views
    document.querySelectorAll('.app-view').forEach(function (el) {
        el.classList.add('d-none');
    });

    // Show selected view
    var viewEl = document.getElementById('view-' + viewName);
    if (viewEl) {
        viewEl.classList.remove('d-none');
    }

    // Update title & toggle "+" button
    var titleEl = document.getElementById('page-title');
    var btnAdd = document.querySelector('.btn-add');

    var titles = {
        'ferramentas': 'Ferramentas Secundárias',
        'instrucoes': 'Instruções de Engenharia'
    };

    // Para dashboard, usa o nome do dashboard ativo
    if (viewName === 'dashboard' && window.MainApp && window.MainApp.getActiveDash) {
        var d = window.MainApp.getActiveDash();
        titleEl.textContent = d ? d.name : 'Dashboard';
    } else {
        titleEl.textContent = titles[viewName] || 'Portal de Pareceres';
    }

    // Botão "+" só aparece no dashboard
    if (viewName === 'dashboard') {
        btnAdd.classList.remove('d-none');
        // Renderiza toolbar de ações do dashboard
        if (window.MainApp && window.MainApp.renderDashboardToolbar) {
            window.MainApp.renderDashboardToolbar();
        }
    } else {
        btnAdd.classList.add('d-none');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    var savedTheme = localStorage.getItem('portal_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    updateThemeIcon(savedTheme);

    // Restaura estado expandido da sidebar (default: expandido)
    if (localStorage.getItem('sidebar_expanded') !== '0') {
        document.querySelector('.sidebar').classList.add('expanded');
    }
});
