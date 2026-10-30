import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ConsultationRoom } from '@/features/teleconsultation/components/ConsultationRoom';
import { memoryDb } from '@/mocks/db/memoryDb';

afterEach(cleanup);
describe('Consultation workspace continuity', () => {
  it('retains an unsaved clinical note while the doctor reviews documents', () => {
    const appointment = memoryDb.getAll('appointments')[0];
    render(<ConsultationRoom appointment={appointment} doctorName={appointment.doctorName} onBack={()=>{}}/>);
    const field = screen.getByLabelText(/شکایت اصلی بیمار/);
    fireEvent.change(field, {target:{value:'یادداشت ذخیره نشده'}});
    fireEvent.click(screen.getByRole('button',{name:/مدارک و آزمایش‌های بیمار/}));
    fireEvent.click(screen.getByRole('button',{name:'شرح‌حال و نسخه'}));
    expect((screen.getByLabelText(/شکایت اصلی بیمار/) as HTMLTextAreaElement).value).toBe('یادداشت ذخیره نشده');
    expect(screen.queryByText(/پیش‌نویس ذخیره شد/)).toBeNull();
  });
});
