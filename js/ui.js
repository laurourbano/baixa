/* ── Controle de Interface (Extraído do HTML) ── */
function toggleSidebar(e) {
    // Ignorar toggle se clicar em um link ou botão que possui ação própria
    if (e && (e.target.closest('.nav-item') || e.target.closest('.logout-btn'))) {
        return;
    }
    document.querySelector('.sidebar').classList.toggle('expanded');
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    document.documentElement.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('portal_theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-icon');
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
    // Update nav active state
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById('nav-' + viewName).classList.add('active');

    // Hide all views
    document.querySelectorAll('.app-view').forEach(el => el.classList.add('d-none'));

    // Show selected view
    document.getElementById('view-' + viewName).classList.remove('d-none');

    // Update title
    const titleEl = document.getElementById('page-title');
    if (viewName === 'dashboard') {
        titleEl.textContent = 'Dashboard de Pareceres';
        document.querySelector('.btn-add').classList.remove('d-none');
    } else if (viewName === 'ferramentas') {
        titleEl.textContent = 'Ferramentas Secundárias';
        document.querySelector('.btn-add').classList.add('d-none');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('portal_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    updateThemeIcon(savedTheme);
});
