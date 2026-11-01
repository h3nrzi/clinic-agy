import { Outlet } from 'react-router';

export function AppLayout() {
  return <main className="workspace-main max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"><Outlet /></main>;
}
