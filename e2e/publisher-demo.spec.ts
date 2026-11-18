import { test, expect } from '@playwright/test';

// Exercises the shared HTTP fixture without page.route mocks, including offer handoff through sign-in.
test('offers, products and billing stay connected through the publisher journey', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tooltrim-analytics-consent', JSON.stringify({ version: 1, choice: 'refused', decidedAt: Date.now(), expiresAt: Date.now() + 3600000 })));
  await page.goto('/fr/submit');
  await page.getByRole('button', { name: 'Commencer · 29 $', exact: true }).click();
  await expect(page).toHaveURL(/publisher\?offer=priority_paid#publisher-new$/);
  await page.getByRole('link', { name: 'Se connecter', exact: true }).first().click();
  await page.getByRole('button', { name: 'Continuer avec l’e-mail', exact: true }).click();
  await page.getByLabel('Adresse e-mail', { exact: true }).fill('editeur@example.invalid');
  await page.getByLabel('Mot de passe', { exact: true }).fill('fixture-password');
  await page.locator('.ac-form').getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page).toHaveURL(/publisher\?offer=priority_paid#publisher-new$/);
  await page.getByLabel('Nom de l’outil', { exact: true }).fill('Parcours Produit');
  await page.getByLabel('Site officiel', { exact: true }).fill('https://parcours.example.invalid');
  await page.getByRole('button', { name: 'Chercher dans ToolTrim', exact: true }).click();
  await expect(page.getByLabel('Offre', { exact: true })).toHaveValue('priority_paid');
  await page.getByRole('button', { name: 'Créer le dossier', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Parcours Produit', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Retour à mes fiches', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Ajouter un produit', exact: true })).toBeVisible();
  await page.goto('/fr/publisher?listingId=51910000-0000-4000-8000-000000000002');
  await expect(page.getByRole('heading', { name: 'Carnet Démo', exact: true })).toBeVisible();
  await expect(page.getByText('demo-payment-carnet', { exact: true })).toBeVisible();
  await page.goto('/fr/publisher?listingId=51910000-0000-4000-8000-000000000001');
  await page.getByRole('button', { name: 'Passer à l’offre prioritaire', exact: true }).click();
  await page.getByRole('button', { name: 'Garder l’offre gratuite', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Continuer vers le paiement', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Passer à l’offre prioritaire', exact: true }).click();
  await page.getByRole('button', { name: 'Continuer vers le paiement', exact: true }).click();
  await expect(page.getByText('Votre offre gratuite reste active jusqu’à la confirmation du paiement.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Vérifier le paiement', exact: true }).click();
  await expect(page.getByText('demo-payment-51910000-0000-4000-8000-000000000001', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('demo-payment-51910000-0000-4000-8000-000000000001', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Passer à l’offre prioritaire', exact: true })).toHaveCount(0);
  for (const width of [390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    await page.screenshot({ path: `test-results/publisher-billing-${width}.png`, fullPage: true });
  }
});
