import { test, expect } from '@playwright/test';

test.describe('Portal de Pareceres', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('deve exibir a tela de login inicialmente', async ({ page }) => {
    await expect(page.locator('#login-overlay')).toBeVisible();
    await expect(page.locator('h4:has-text("Acesso ao Portal")')).toBeVisible();
  });

  test('deve realizar login com sucesso', async ({ page }) => {
    await page.fill('#login-email', 'teste@portal.com');
    await page.fill('#login-password', '1234');
    await page.click('button:has-text("Entrar")');

    // O overlay de login deve ser ocultado (classe hidden é adicionada)
    await expect(page.locator('#login-overlay')).toHaveClass(/hidden/);
    await expect(page.locator('#page-title')).toContainText('Dashboard de Pareceres');
  });

  test('deve exibir erro com credenciais inválidas', async ({ page }) => {
    await page.fill('#login-email', 'errado@portal.com');
    await page.fill('#login-password', '0000');
    await page.click('button:has-text("Entrar")');

    await expect(page.locator('#login-error')).toBeVisible();
    await expect(page.locator('#login-error')).toContainText('Credenciais incorretas');
  });

  test('deve permitir abrir o modal de criação de card', async ({ page }) => {
    // Login primeiro
    await page.fill('#login-email', 'teste@portal.com');
    await page.fill('#login-password', '1234');
    await page.click('button:has-text("Entrar")');

    // Clicar no botão +
    await page.click('.btn-add');

    // Verificar se o modal apareceu
    await expect(page.locator('#cardModal')).toBeVisible();
    await expect(page.locator('#cardModal .modal-title')).toContainText('Editar Card');
  });
});
