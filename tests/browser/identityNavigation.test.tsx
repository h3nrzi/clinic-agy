import { describe,it,expect,afterEach } from 'vitest';
import { render,screen,fireEvent,cleanup } from '@testing-library/react';
import { DemoIdentity } from '@/app/layout/DemoIdentity';
import App from '@/App';
import { useAuthStore } from '@/shared/stores/useAuthStore';
afterEach(cleanup);
describe('Identity demo and workspace navigation',()=>{
 it('requires valid identity, consent and the simulated OTP',()=>{
  render(<DemoIdentity onClose={()=>{}}/>);
  fireEvent.change(screen.getByLabelText('شماره موبایل'),{target:{value:'09123456789'}});
  fireEvent.change(screen.getByLabelText('کد ملی'),{target:{value:'1234567891'}});
  fireEvent.click(screen.getByRole('button',{name:'دریافت کد نمایشی'}));
  expect(screen.getByRole('alert').textContent).toContain('رضایت‌نامه');
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button',{name:'دریافت کد نمایشی'}));
  fireEvent.change(screen.getByLabelText('کد تأیید'),{target:{value:'000000'}});
  fireEvent.click(screen.getByRole('button',{name:'تأیید و ادامه'}));
  expect(screen.getByRole('alert').textContent).toContain('صحیح نیست');
  fireEvent.change(screen.getByLabelText('کد تأیید'),{target:{value:'۱۲۳۴۵۶'}});
  fireEvent.click(screen.getByRole('button',{name:'تأیید و ادامه'}));
  expect(screen.getByRole('status').textContent).toContain('تأیید هویت نمایشی انجام شد');
 });
 it('opens financial settings from the role-aware sidebar',()=>{
  useAuthStore.getState().switchRole('ADMIN_FINANCE');render(<App/>);
  fireEvent.click(screen.getByRole('button',{name:'تنظیمات مالی'}));
  expect(screen.getByText(/پارامترهای سیستمی مالیات و جریمه لغو نوبت/)).toBeDefined();
 });
});
