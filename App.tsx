import React, { useState, useMemo, useEffect } from 'react';
import PlayerManagement from './components/PlayerManagement';
import PresenceManagement from './components/PresenceManagement';
import QueueAndMatch from './components/QueueAndMatch';
import HistoryAndStats from './components/HistoryAndStats';
import GameSettings from './components/GameSettings';
import { UserGroupIcon, ClipboardCheckIcon, QueueListIcon, ChartBarIcon, Cog6ToothIcon } from './components/icons/Icons';
import { useAppContext } from './contexts/AppContext';
import { AccentColor } from './types';

type Tab = 'players' | 'presence' | 'queue' | 'stats' | 'settings';

interface ThemeColors {
  accent: string;
  accentDark: string;
  darkBg: string;
  darkCard: string;
  lightBg: string;
  lightCard: string;
  darkText: string;
  lightText: string;
  darkTextSecondary: string;
  lightTextSecondary: string;
}

const THEMES: Record<AccentColor, ThemeColors> = {
    mikasa: {
        accent: '#FFC107', 
        accentDark: '#FFA000',
        darkBg: '#0D47A1', 
        darkCard: '#155DB1',
        lightBg: '#E3F2FD', 
        lightCard: '#FFFFFF',
        darkText: '#E3F2FD',
        lightText: '#0D47A1', 
        darkTextSecondary: '#BBDEFB',
        lightTextSecondary: '#1976D2',
    },
    penalty: {
        accent: '#8BC34A', 
        accentDark: '#689F38',
        darkBg: '#1A237E', 
        darkCard: '#283593',
        lightBg: '#E8EAF6', 
        lightCard: '#FFFFFF',
        darkText: '#E8EAF6',
        lightText: '#1A237E',
        darkTextSecondary: '#C5CAE9',
        lightTextSecondary: '#3F51B5',
    },
    molten: {
        accent: '#F44336', 
        accentDark: '#D32F2F',
        darkBg: '#1B5E20', 
        darkCard: '#2E7D32',
        lightBg: '#F1F8E9',
        lightCard: '#FFFFFF',
        darkText: '#E8F5E9',
        lightText: '#1B5E20',
        darkTextSecondary: '#A5D6A7',
        lightTextSecondary: '#388E3C',
    },
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('presence');
  const { theme, accentColor } = useAppContext();

  useEffect(() => {
    const root = window.document.documentElement;
    const themeColors = THEMES[accentColor] || THEMES.mikasa;

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : null;
    };
    
    const setCssVar = (name: string, hex: string) => {
        const rgb = hexToRgb(hex);
        if (rgb) root.style.setProperty(name, rgb);
    }

    setCssVar('--color-accent', themeColors.accent);
    setCssVar('--color-accent-dark', themeColors.accentDark);
    setCssVar('--color-dark-bg', themeColors.darkBg);
    setCssVar('--color-dark-card', themeColors.darkCard);
    setCssVar('--color-light-bg', themeColors.lightBg);
    setCssVar('--color-light-card', themeColors.lightCard);
    setCssVar('--color-text-dark', themeColors.darkText);
    setCssVar('--color-text-light', themeColors.lightText);
    setCssVar('--color-text-secondary-dark', themeColors.darkTextSecondary);
    setCssVar('--color-text-secondary-light', themeColors.lightTextSecondary);
  }, [accentColor]);


  useEffect(() => {
      const root = window.document.documentElement;
      const isDark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      if (isDark) {
          root.classList.add('dark');
      } else {
          root.classList.remove('dark');
      }

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
          if (theme === 'system') {
              if (e.matches) {
                  root.classList.add('dark');
              } else {
                  root.classList.remove('dark');
              }
          }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const tabs = useMemo(() => [
    { id: 'players', label: 'Jogadores', icon: <UserGroupIcon /> },
    { id: 'presence', label: 'Presença', icon: <ClipboardCheckIcon /> },
    { id: 'queue', label: 'Fila & Jogo', icon: <QueueListIcon /> },
    { id: 'stats', label: 'Histórico', icon: <ChartBarIcon /> },
    { id: 'settings', label: 'Ajustes', icon: <Cog6ToothIcon /> },
  ], []);

  const renderContent = () => {
    switch (activeTab) {
      case 'players':
        return <PlayerManagement />;
      case 'presence':
        return <PresenceManagement />;
      case 'queue':
        return <QueueAndMatch />;
      case 'stats':
        return <HistoryAndStats />;
      case 'settings':
        return <GameSettings />;
      default:
        return <PresenceManagement />;
    }
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-text-light dark:text-text-dark flex flex-col">
      <header className="bg-gradient-to-r from-sport-accent to-sport-accent-dark text-white shadow-lg sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-center tracking-wider">Vôlei Rotação Pro</h1>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 pb-24">
        {renderContent()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-light-card dark:bg-dark-card border-t border-slate-200 dark:border-slate-700 shadow-lg z-20">
        <div className="flex justify-around max-w-lg mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 text-sm transition-colors duration-200 group rounded-t-lg ${
                activeTab === tab.id
                  ? 'text-sport-accent font-bold'
                  : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-sport-accent'
              }`}
            >
              <div className="w-6 h-6 mb-1">{tab.icon}</div>
              <span className="tracking-tight">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default App;