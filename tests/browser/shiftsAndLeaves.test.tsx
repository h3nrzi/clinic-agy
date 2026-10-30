import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '@/App';
import { memoryDb } from '@/mocks/db/memoryDb';
import { scheduleRepository } from '@/mocks/repositories/scheduleRepository';
import { useAuthStore } from '@/shared/stores/useAuthStore';

describe('WP-05: Doctor Shifts, Leave Requests & Secretary Approval (FLOW-05, S17)', () => {
  beforeEach(() => {
    memoryDb.resetToFactoryDefaults();
  });

  it('allows doctor to view weekly shifts and submit leave request with conflict awareness (FLOW-05)', () => {
    useAuthStore.getState().switchRole('DOCTOR');
    render(<App />);

    expect(screen.getByTestId('doctor-dashboard')).toBeDefined();

    // Click "برنامهٔ شیفت‌های هفتگی و مرخصی‌ها" tab
    const shiftsTabBtn = screen.getByRole('button', { name: /برنامهٔ شیفت‌های هفتگی و مرخصی‌ها/ });
    fireEvent.click(shiftsTabBtn);

    // Verify shifts section rendered
    expect(screen.getByText(/برنامهٔ شیفت‌های ثابت هفتگی/)).toBeDefined();

    // Submit leave request via repository
    const leave = scheduleRepository.requestLeave({
      doctorId: 'doc-1',
      doctorName: 'دکتر مریم احمدی',
      startDate: '2026-11-10',
      endDate: '2026-11-12',
      reason: 'سفر علمی جهت ارائه مقاله',
    });

    expect(leave.status).toBe('PENDING_APPROVAL');
    expect(leave.id).toBeDefined();

    const storedLeave = scheduleRepository.getLeaveById(leave.id);
    expect(storedLeave?.reason).toBe('سفر علمی جهت ارائه مقاله');
  });

  it('prevents overlapping active shifts on the same day for a doctor (PRD 9.3 conflict prevention)', () => {
    // doc-1 already has a shift on Saturday (day 0) in Tehran
    expect(() => {
      scheduleRepository.addShift({
        doctorId: 'doc-1',
        doctorName: 'دکتر مریم احمدی',
        branchId: 'ONLINE',
        dayOfWeek: 0, // Saturday conflict!
        dayName: 'شنبه',
        startTime: '۱۵:۰۰',
        endTime: '۱۹:۰۰',
        isActive: true,
      });
    }).toThrow(/تداخل شیفت/);
  });

  it('allows secretary to review and approve doctor leave request (FLOW-05)', () => {
    // 1. Submit leave
    const leave = scheduleRepository.requestLeave({
      doctorId: 'doc-2',
      doctorName: 'دکتر رضا حسینی',
      startDate: '2026-11-20',
      endDate: '2026-11-22',
      reason: 'مرخصی استعلاجی',
    });

    // 2. Switch to Secretary Tehran
    useAuthStore.getState().switchRole('SECRETARY_TEHRAN');
    render(<App />);

    // Switch to Doctor Leaves tab in Secretary Desk
    const leavesSectionBtn = screen.getByRole('button', { name: /بررسی مرخصی پزشکان/ });
    fireEvent.click(leavesSectionBtn);

    // Verify leave item appears
    expect(screen.getAllByText('دکتر رضا حسینی').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/مرخصی استعلاجی/).length).toBeGreaterThanOrEqual(1);

    // Approve leave via repository
    const updated = scheduleRepository.reviewLeave(
      leave.id,
      'APPROVED',
      'منشی شعبه تهران',
      'SECRETARY_TEHRAN',
      'موافقت شد'
    );

    expect(updated.status).toBe('APPROVED');
    expect(updated.reviewedBy).toBe('منشی شعبه تهران');
  });
});
