import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useUIStore } from '@/store';
import {
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Plus,
  LayoutDashboard,
  Ticket,
} from 'lucide-react';

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const { darkMode, toggleDarkMode, sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <button
              onClick={toggleSidebar}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 lg:hidden"
              aria-label="Alternar navegación"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Logo formal sin emojis */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
                <Ticket size={18} className="rotate-[-10deg]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-slate-950 dark:text-white leading-none">
                  RifaApp
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mt-1">
                  Management
                </span>
              </div>
            </Link>

            {/* Links desktop */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
                  location.pathname === '/'
                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
                }`}
              >
                Panel
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <Link to="/raffles/new" className="btn-accent btn-sm hidden sm:inline-flex shadow-sm">
              <Plus size={15} />
              <span>Nueva Rifa</span>
            </Link>

            <button
              onClick={toggleDarkMode}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
              aria-label="Cambiar tema"
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <div className="hidden items-center gap-3 border-l border-slate-200 pl-3 dark:border-slate-800 sm:flex">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {user?.name}
                </span>
                <span className="text-[11px] text-slate-400 font-medium leading-tight">
                  {user?.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-slate-200 bg-white transition-transform duration-200 ease-out dark:border-slate-800 dark:bg-slate-900 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col justify-between h-full p-4">
          <nav className="flex flex-col gap-1.5">
            <Link
              to="/"
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                location.pathname === '/'
                  ? 'bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <LayoutDashboard size={18} />
              <span>Mis Rifas</span>
            </Link>
            <Link
              to="/raffles/new"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <Plus size={18} />
              <span>Crear Nueva Rifa</span>
            </Link>
          </nav>

          <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className="px-2 mb-3">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 transition-colors"
            >
              <LogOut size={16} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
