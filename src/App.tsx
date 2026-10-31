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
  ...DEMO_ACCOUNTS.map((account) => ({
    path: account.path,
    element: <WorkspaceRoute role={account.role} />,
  })),
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
