import { test, expect } from '@playwright/test';

test.describe('VND Money Tracker End-to-End Workflows with Tags', () => {
  const testUserId = `e2e-user-${Date.now()}`;

  test('completes full bookkeeping workflow with existing & custom tags selection and editing', async ({
    page,
    request,
  }) => {
    // Set custom header for isolated test user
    await page.setExtraHTTPHeaders({
      'x-simulated-user': testUserId,
    });

    // 1. Open the application with an empty database
    await page.goto('/');
    await expect(page).toHaveTitle(/VND Money Tracker/i);

    // Initial state: Balance should be 0 ₫
    await expect(page.getByText('Current Available Balance')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2 })).toContainText('0 ₫');
    await expect(page.getByText('No transactions recorded')).toBeVisible();

    // 2. Add 1,000,000 ₫ with existing tag "Salary"
    await page
      .getByRole('button', { name: /Add Money/i })
      .first()
      .click();
    await expect(
      page.getByRole('heading', { name: 'Add Money' }),
    ).toBeVisible();

    await page.locator('#add-amount').fill('1000000');
    await page.locator('#add-note').fill('Monthly base salary');

    // Select existing tag "Salary"
    await page.getByRole('button', { name: 'Salary', exact: true }).click();
    await page.getByRole('button', { name: /Confirm Add/i }).click();

    // 3. Confirm balance becomes 1,000,000 ₫ and tag "Salary" appears in history
    await expect(page.getByRole('heading', { level: 2 })).toContainText(
      '1,000,000 ₫',
    );
    const historyRegion = page.getByRole('region', {
      name: 'Transaction History',
    });
    await expect(historyRegion.getByText('+1,000,000 ₫')).toBeVisible();
    await expect(historyRegion.getByText('Monthly base salary')).toBeVisible();
    await expect(
      historyRegion.locator('span', { hasText: 'Salary' }).first(),
    ).toBeVisible();

    // 4. Subtract 200,000 ₫ with a newly created custom tag "Dining Out"
    await page
      .getByRole('button', { name: /Subtract Money/i })
      .first()
      .click();
    await expect(
      page.getByRole('heading', { name: 'Subtract Money' }),
    ).toBeVisible();

    await page.locator('#subtract-amount').fill('200000');
    await page.locator('#subtract-note').fill('Weekend restaurant bill');

    // Click "New Tag" and type custom tag "Dining Out"
    await page.getByRole('button', { name: /New Tag/i }).click();
    await page.getByPlaceholder('Tag name...').fill('Dining Out');
    await page.getByTitle('Add tag').click();

    await page.getByRole('button', { name: /Confirm Subtract/i }).click();

    // 5. Confirm balance becomes 800,000 ₫ and custom tag appears
    await expect(page.getByRole('heading', { level: 2 })).toContainText(
      '800,000 ₫',
    );
    await expect(historyRegion.getByText('-200,000 ₫')).toBeVisible();
    await expect(
      historyRegion.locator('span', { hasText: 'Dining Out' }).first(),
    ).toBeVisible();

    // 6. Refresh and verify balance and tags persist
    await page.reload();
    await expect(page.getByRole('heading', { level: 2 })).toContainText(
      '800,000 ₫',
    );
    await expect(
      historyRegion.locator('span', { hasText: 'Salary' }).first(),
    ).toBeVisible();
    await expect(
      historyRegion.locator('span', { hasText: 'Dining Out' }).first(),
    ).toBeVisible();

    // 7. Edit transaction: Change tag from "Dining Out" to existing tag "Groceries"
    const editButtons = page.getByRole('button', { name: /Edit transaction/i });
    await editButtons.first().click();
    await expect(
      page.getByRole('heading', { name: 'Edit Transaction' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Groceries', exact: true }).click();
    await page.locator('#edit-note').fill('Supermarket groceries');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Verify tag was updated in history to "Groceries"
    await expect(
      historyRegion.locator('span', { hasText: 'Groceries' }).first(),
    ).toBeVisible();
    await expect(
      historyRegion.getByText('Supermarket groceries'),
    ).toBeVisible();

    // 8. Delete a transaction
    const deleteButtons = page.getByRole('button', {
      name: /Delete transaction/i,
    });
    await deleteButtons.first().click();
    await expect(
      page.getByRole('heading', { name: 'Delete Transaction' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    // Recalculated balance back to 1,000,000 ₫
    await expect(page.getByRole('heading', { level: 2 })).toContainText(
      '1,000,000 ₫',
    );

    // 9. Responsive layout check
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'VND Money Tracker',
    );

    // 10. User isolation verification
    const otherUserRes = await request.get('/api/summary', {
      headers: { 'x-simulated-user': `isolated-${Date.now()}` },
    });
    const otherData = await otherUserRes.json();
    expect(otherData.data.currentBalance).toBe(0);
  });

  test('manages tags via Tag CRUD modal: create, edit, delete, and filter', async ({
    page,
  }) => {
    const crudUserId = `e2e-tag-crud-${Date.now()}`;
    await page.setExtraHTTPHeaders({
      'x-simulated-user': crudUserId,
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { level: 2 })).toContainText('0 ₫');

    // 1. Open Manage Tags modal from Header
    await page.getByRole('button', { name: 'Manage tags' }).first().click();
    await expect(
      page.getByRole('heading', { name: 'Manage Tags' }),
    ).toBeVisible();

    // 2. Add a new tag "Cryptocurrency" as Income
    await page
      .getByPlaceholder('New tag name (e.g. Freelance, Coffee)...')
      .fill('Cryptocurrency');
    await page.getByRole('button', { name: '+ Income (Add)' }).click();
    await page.getByRole('button', { name: 'Add Tag' }).click();

    // Verify "Cryptocurrency" appears in the tag list
    await expect(
      page
        .locator('div')
        .filter({ hasText: /^Cryptocurrency/ })
        .first(),
    ).toBeVisible();

    // 3. Edit the tag: rename "Cryptocurrency" to "Crypto Staking"
    const editBtn = page.getByRole('button', {
      name: 'Edit Cryptocurrency',
    });
    await editBtn.click();

    const editInput = page.locator('input[value="Cryptocurrency"]');
    await editInput.fill('Crypto Staking');
    await page.getByTitle('Save tag name').click();

    // Verify renamed tag is shown
    await expect(
      page
        .locator('div')
        .filter({ hasText: /^Crypto Staking/ })
        .first(),
    ).toBeVisible();

    // 4. Delete the tag
    const deleteBtn = page.getByRole('button', {
      name: 'Delete Crypto Staking',
    });
    await deleteBtn.click();
    await expect(page.getByText('Delete "Crypto Staking"?')).toBeVisible();
    await page.getByRole('button', { name: 'Yes, Delete' }).click();

    // Verify tag is no longer visible in list
    await expect(
      page.locator('span', { hasText: 'Crypto Staking' }),
    ).toHaveCount(0);

    // 5. Close modal
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Manage Tags' }),
    ).not.toBeVisible();
  });

  test('can delete all existing tags and ensure they remain deleted without auto-reseeding', async ({
    page,
  }) => {
    const deleteUserId = `e2e-del-all-${Date.now()}`;
    await page.setExtraHTTPHeaders({
      'x-simulated-user': deleteUserId,
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { level: 2 })).toContainText('0 ₫');

    // 1. Open Manage Tags modal
    await page.getByRole('button', { name: 'Manage tags' }).first().click();
    await expect(
      page.getByRole('heading', { name: 'Manage Tags' }),
    ).toBeVisible();

    // 2. Click "Delete All"
    await page.getByRole('button', { name: 'Delete All' }).click();
    await expect(
      page.getByText(/Delete all \d+ existing tags\?/),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Yes, Delete All' }).click();

    // Verify empty state: all existing tags are deleted
    await expect(
      page.getByText('No tags existing. All existing tags have been deleted.'),
    ).toBeVisible();

    // 3. Close modal and open "Add Money"
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page
      .getByRole('button', { name: /Add Money/i })
      .first()
      .click();

    // Verify no default tags appear in TagSelector
    await expect(page.getByText('No tags yet.')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Salary', exact: true }),
    ).toHaveCount(0);

    // 4. Reload the page to ensure deleted tags do NOT resurrect
    await page.reload();
    await expect(page.getByRole('heading', { level: 2 })).toContainText('0 ₫');
    await page.getByRole('button', { name: 'Manage tags' }).first().click();
    await expect(
      page.getByText('No tags existing. All existing tags have been deleted.'),
    ).toBeVisible();

    // 5. Test "Restore default tags"
    await page.getByRole('button', { name: 'Restore default tags' }).click();
    await expect(
      page.getByText('Restore standard default income and expense tags?'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Yes, Restore' }).click();

    // Verify tags are restored
    await expect(
      page.locator('span', { hasText: 'Salary' }).first(),
    ).toBeVisible();
  });
});
