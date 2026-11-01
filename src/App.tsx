import {
  createBrowserRouter,
  createMemoryRouter,
  type RouteObject,
} from "react-router";
import { RouterProvider } from "react-router/dom";
import { PublicLayout } from "@/app/public/PublicLayout";
import { PublicHome } from "@/app/public/PublicHome";
import { DemoLogin } from "@/app/public/DemoLogin";
import { WorkspaceRoute } from "@/app/routing/WorkspaceRoute";
import { DEMO_ACCOUNTS } from "@/app/routing/roleRoutes";
import { AppLayout } from '@/app/layout/AppLayout';
import { PatientPortal } from '@/features/patient-portal/components/PatientPortal';
import { BookingPage } from '@/features/booking/components/BookingPage';
import { SecretaryDashboard } from '@/features/secretary';
import { DoctorWorkspace } from '@/app/routing/DoctorWorkspace';
import { FinanceOverview } from '@/features/financial-dashboard/components/FinanceOverview';
import { FinancialDashboard } from '@/features/financial-dashboard';
import { NotFound } from '@/app/routing/NotFound';
import { restoreDemoSession } from "@/shared/stores/useAuthStore";

export const appRoutes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <PublicHome /> },
      { path: "/login", element: <DemoLogin /> },
    ],
  },
];
appRoutes.push(
  ...DEMO_ACCOUNTS.map(account => ({
    path: account.path,
    element: <WorkspaceRoute role={account.role} />,
    children: [{
      element: <AppLayout />,
      children: account.role === 'PATIENT' ? [
        { index: true, element: <PatientPortal /> },
        { path: 'booking', element: <BookingPage /> },
        { path: '*', element: <NotFound /> },
      ] : account.role === 'DOCTOR' ? [
        { index: true, element: <DoctorWorkspace key="appointments" section="APPOINTMENTS" /> },
        { path: 'shifts', element: <DoctorWorkspace key="shifts" section="SHIFTS_AND_LEAVES" /> },
        { path: '*', element: <NotFound /> },
      ] : account.role === 'ADMIN_FINANCE' ? [
        { index: true, element: <FinanceOverview /> },
        { path: 'tariffs', element: <FinancialDashboard section="TARIFF_EXCEL" /> },
        { path: 'shifts', element: <FinancialDashboard section="SHIFTS" /> },
        { path: 'settings', element: <FinancialDashboard section="SETTINGS" /> },
        { path: '*', element: <NotFound /> },
      ] : [
        { index: true, element: <SecretaryDashboard key="appointments" section="APPOINTMENTS" /> },
        { path: 'leaves', element: <SecretaryDashboard key="leaves" section="DOCTOR_LEAVES" /> },
        { path: '*', element: <NotFound /> },
      ],
    }],
  })),
  { path: '*', element: <NotFound /> },
);
export function createAppRouter(initialEntries?: string[]) {
  restoreDemoSession();
  return initialEntries
    ? createMemoryRouter(appRoutes, { initialEntries })
    : createBrowserRouter(appRoutes);
}
export function App({
  router,
}: {
  router: ReturnType<typeof createAppRouter>;
}) {
  return <RouterProvider router={router} />;
}
export default App;
