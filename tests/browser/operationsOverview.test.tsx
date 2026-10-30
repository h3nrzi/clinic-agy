import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { OperationsOverview } from '@/features/financial-dashboard/components/OperationsOverview';
import { memoryDb } from '@/mocks/db/memoryDb';

afterEach(cleanup);
describe('Financial report scope', () => {
  it('filters branch revenue and excludes cancelled appointments', () => {
    const sample = memoryDb.getAll('appointments')[0];
    render(<OperationsOverview appointments={[
      {...sample, id:'report-a', branchId:'TEHRAN', status:'CONFIRMED', freePrice:100000},
      {...sample, id:'report-b', branchId:'ISFAHAN', status:'COMPLETED', freePrice:200000},
      {...sample, id:'report-c', branchId:'TEHRAN', status:'CANCELLED_BY_PATIENT', freePrice:900000},
    ]}/>);
    expect(screen.getByRole('meter', {name:'درآمد تهران'}).getAttribute('value')).toBe('100000');
    fireEvent.change(screen.getByLabelText('محدوده گزارش'), {target:{value:'ISFAHAN'}});
    expect(screen.getByRole('meter', {name:'درآمد تهران'}).getAttribute('value')).toBe('0');
    expect(screen.getByRole('meter', {name:'درآمد اصفهان'}).getAttribute('value')).toBe('200000');
  });
  it('shows an explicit empty state without invalid chart values', () => {
    render(<OperationsOverview appointments={[]}/>);
    expect(screen.getByText('در این محدوده درآمدی ثبت نشده است.')).toBeDefined();
    expect(screen.getByRole('meter', {name:'درآمد تهران'}).getAttribute('max')).toBe('1');
  });
});
