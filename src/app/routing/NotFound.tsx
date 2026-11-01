import { Link } from 'react-router';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { dashboardPath } from './roleRoutes';

export function NotFound() {
  const { isLoggedIn, currentRole } = useAuthStore();
  return <section className="access-message" dir="rtl"><h1>صفحه پیدا نشد</h1><p>این آدرس در سامانه وجود ندارد.</p><Link className="public-primary" to={isLoggedIn ? dashboardPath(currentRole) : '/'}>{isLoggedIn ? 'بازگشت به فضای کار من' : 'بازگشت به خانه'}</Link></section>;
}
