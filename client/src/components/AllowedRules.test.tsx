// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { oneMoreTurn } from '../levels/one-more-turn';
import { realityBreakdown } from '../levels/reality-breakdown';
import { editableRuleLabels } from '../levels/presentation';
import { AllowedRules } from './AllowedRules';

afterEach(cleanup);

describe('allowed rules disclosure', () => {
  it('clearly opens and closes the full real list instead of relying on a clipped preview', () => {
    const rules = editableRuleLabels(realityBreakdown);
    render(<AllowedRules rules={rules} />);
    const expand = screen.getByRole('button', { name: 'Expand allowed rules' });
    expect(expand.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByText(/You can change: Acceleration/)).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Allowed rules' })).toBeNull();
    fireEvent.click(expand);
    const panel = screen.getByRole('region', { name: 'Allowed rules' });
    expect(expand.getAttribute('aria-expanded')).toBe('true');
    expect(expand.getAttribute('aria-controls')).toBe(panel.id);
    expect(within(panel).getAllByRole('listitem').map(item => item.textContent)).toEqual(rules);
    fireEvent.click(screen.getByRole('button', { name: 'Collapse allowed rules' }));
    expect(screen.queryByRole('region', { name: 'Allowed rules' })).toBeNull();
  });

  it('updates an expanded list when the actual capabilities change and does not retain protected device controls', () => {
    const view = render(<AllowedRules rules={editableRuleLabels(realityBreakdown)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Expand allowed rules' }));
    expect(screen.getByText('Toaster power', { exact: true })).toBeTruthy();
    view.rerender(<AllowedRules rules={editableRuleLabels(oneMoreTurn)} />);
    const items = within(screen.getByRole('region', { name: 'Allowed rules' })).getAllByRole('listitem').map(item => item.textContent);
    expect(items).toEqual(editableRuleLabels(oneMoreTurn));
    expect(screen.queryByText('Toaster power', { exact: true })).toBeNull();
    expect(screen.queryByText('Spring strength', { exact: true })).toBeNull();
  });

  it('states clearly when there are no editable rules instead of offering a misleading list', () => {
    render(<AllowedRules rules={[]} />);
    expect(screen.getByText('No editable rules in this level.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Expand allowed rules' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole('region', { name: 'Allowed rules' })).toBeNull();
  });
});
