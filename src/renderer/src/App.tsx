import React, { useState } from 'react';
import {
  LayoutDashboard,
  Globe2,
  SlidersHorizontal,
  Clock,
  Compass,
  Languages,
  BookmarkCheck,
  History,
  ShieldCheck,
  ShieldAlert,
  Moon,
  Sun,
  RotateCcw,
} from 'lucide-react';
import { useAppStore } from './stores/app.store';
import { useSystemInfo } from './hooks/useSystemInfo';
import DashboardPage from './components/dashboard/DashboardPage';
import CountriesPage from './components/countries/CountriesPage';
import RegionPage from './components/region/RegionPage';
import DateTimePage from './components/datetime/DateTimePage';
import TimeZonePage from './components/timezone/TimeZonePage';
import LanguagePage from './components/language/LanguagePage';
import ProfilesPage from './components/profiles/ProfilesPage';
import HistoryPage from './components/history/HistoryPage';
import BackupPage from './components/backup/BackupPage';

type NavTab =
  | 'dashboard'
  | 'countries'
  | 'region'
  | 'datetime'
  | 'timezone'
  | 'language'
  | 'profiles'
  | 'history'
  | 'backup';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const { theme, toggleTheme, isAdmin } = useAppStore();

  // Run live system monitoring polling
  useSystemInfo();

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur flex flex-col justify-between">
        <div>
          {/* Logo / Branding */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm tracking-wider">
                G
              </div>
              <div>
                <h1 className="font-semibold text-sm leading-none">GRTC</h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Region & Time Controller</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            <NavItem
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
            />
            <NavItem
              icon={<Globe2 size={18} />}
              label="Countries & Locales"
              active={activeTab === 'countries'}
              onClick={() => setActiveTab('countries')}
            />
            <NavItem
              icon={<SlidersHorizontal size={18} />}
              label="Regional Format"
              active={activeTab === 'region'}
              onClick={() => setActiveTab('region')}
            />
            <NavItem
              icon={<Clock size={18} />}
              label="Date & Time"
              active={activeTab === 'datetime'}
              onClick={() => setActiveTab('datetime')}
            />
            <NavItem
              icon={<Compass size={18} />}
              label="Time Zones"
              active={activeTab === 'timezone'}
              onClick={() => setActiveTab('timezone')}
            />
            <NavItem
              icon={<Languages size={18} />}
              label="Language & Keyboard"
              active={activeTab === 'language'}
              onClick={() => setActiveTab('language')}
            />
            <NavItem
              icon={<BookmarkCheck size={18} />}
              label="Profiles"
              active={activeTab === 'profiles'}
              onClick={() => setActiveTab('profiles')}
            />
            <NavItem
              icon={<RotateCcw size={18} />}
              label="Backup & Restore"
              active={activeTab === 'backup'}
              onClick={() => setActiveTab('backup')}
            />
            <NavItem
              icon={<History size={18} />}
              label="Audit History"
              active={activeTab === 'history'}
              onClick={() => setActiveTab('history')}
            />
          </nav>
        </div>

        {/* Footer controls & Privileges */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800/60">
            <div className="flex items-center space-x-1.5">
              {isAdmin ? (
                <ShieldCheck size={15} className="text-emerald-500" />
              ) : (
                <ShieldAlert size={15} className="text-amber-500" />
              )}
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {isAdmin ? 'Administrator' : 'Standard User'}
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-400">100% Offline Local Architecture</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto p-8">
        {activeTab === 'dashboard' && <DashboardPage onNavigate={(tab) => setActiveTab(tab as NavTab)} />}
        {activeTab === 'countries' && <CountriesPage />}
        {activeTab === 'region' && <RegionPage />}
        {activeTab === 'datetime' && <DateTimePage />}
        {activeTab === 'timezone' && <TimeZonePage />}
        {activeTab === 'language' && <LanguagePage />}
        {activeTab === 'profiles' && <ProfilesPage />}
        {activeTab === 'backup' && <BackupPage />}
        {activeTab === 'history' && <HistoryPage />}
      </main>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
