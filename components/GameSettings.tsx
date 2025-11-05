import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { TeamFormationPriority, Theme, AccentColor } from '../types';

const priorityLabels: Record<TeamFormationPriority, { title: string, description: string }> = {
  priority: { title: 'Status', description: 'Mensalista > Visitante' },
  setter: { title: 'Posição', description: 'Levantador > Outros' },
  gender: { title: 'Gênero', description: 'Feminino > Masculino' },
};

const ACCENT_COLOR_MAP: Record<AccentColor, { class: string; name: string }> = {
    mikasa: { class: 'bg-gradient-to-br from-blue-500 to-yellow-400', name: 'Mikasa' },
    penalty: { class: 'bg-gradient-to-br from-lime-400 to-blue-800', name: 'Penalty' },
    molten: { class: 'bg-gradient-to-br from-green-500 via-white to-red-500', name: 'Molten' },
};


const GameSettings: React.FC = () => {
    const { gameSettings, setGameSettings, theme, setTheme, accentColor, setAccentColor } = useAppContext();
    const [draggedItem, setDraggedItem] = useState<TeamFormationPriority | null>(null);
    
    const priorities = gameSettings.teamFormationPriority;

    const handleGameModeChange = (mode: '4v4' | '6v6') => {
        setGameSettings(prev => ({ ...prev, defaultGameMode: mode }));
    };

    const handleDragStart = (e: React.DragEvent<HTMLLIElement>, item: TeamFormationPriority) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent<HTMLLIElement>) => {
        e.currentTarget.style.opacity = '1';
        setDraggedItem(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
        e.preventDefault();
    };
    
    const handleDrop = (e: React.DragEvent<HTMLLIElement>, targetItem: TeamFormationPriority) => {
        e.preventDefault();
        if (!draggedItem || draggedItem === targetItem) {
            return;
        }

        const currentIndex = priorities.indexOf(draggedItem);
        const targetIndex = priorities.indexOf(targetItem);
        
        const newPriorities = [...priorities];
        const [removed] = newPriorities.splice(currentIndex, 1);
        newPriorities.splice(targetIndex, 0, removed);
        
        setGameSettings(prev => ({...prev, teamFormationPriority: newPriorities}));
        setDraggedItem(null);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">Ajustes</h2>
            
            <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-bold mb-3 text-text-light dark:text-text-dark">Aparência</h3>
                
                <div className="mb-6">
                    <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">Tema</label>
                    <div className="flex gap-2 rounded-lg p-1 bg-slate-200 dark:bg-slate-700">
                        {(['system', 'light', 'dark'] as Theme[]).map((t) => (
                             <button 
                                key={t}
                                onClick={() => setTheme(t)}
                                className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors text-sm capitalize ${theme === t ? 'bg-sport-accent text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-600/50'}`}
                            >
                                {t === 'system' ? 'Sistema' : t === 'light' ? 'Claro' : 'Escuro'}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                     <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-3">Paleta de Cores</label>
                     <div className="flex justify-around sm:justify-start gap-4 sm:gap-6 pt-2">
                        {(Object.keys(ACCENT_COLOR_MAP) as AccentColor[]).map(colorTheme => (
                            <div key={colorTheme} className="flex flex-col items-center gap-2">
                                <button 
                                    onClick={() => setAccentColor(colorTheme)}
                                    className={`w-12 h-12 rounded-full ${ACCENT_COLOR_MAP[colorTheme].class} transition-transform hover:scale-110 border-2 border-transparent ${accentColor === colorTheme ? 'ring-2 ring-offset-2 ring-offset-light-card dark:ring-offset-dark-card ring-sport-accent' : ''}`}
                                    aria-label={`Selecionar tema ${ACCENT_COLOR_MAP[colorTheme].name}`}
                                />
                                <span className={`text-sm font-semibold transition-colors ${accentColor === colorTheme ? 'text-sport-accent' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>
                                    {ACCENT_COLOR_MAP[colorTheme].name}
                                </span>
                            </div>
                        ))}
                     </div>
                </div>
            </div>

            <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-bold mb-3 text-text-light dark:text-text-dark">Modo de Jogo Padrão</h3>
                <div className="flex gap-2 rounded-lg p-1 bg-slate-200 dark:bg-slate-700">
                    <button 
                        onClick={() => handleGameModeChange('4v4')}
                        className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors text-sm ${gameSettings.defaultGameMode === '4v4' ? 'bg-sport-accent text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-600/50'}`}
                    >
                        4 vs 4
                    </button>
                     <button 
                        onClick={() => handleGameModeChange('6v6')}
                        className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors text-sm ${gameSettings.defaultGameMode === '6v6' ? 'bg-sport-accent text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-600/50'}`}
                    >
                        6 vs 6
                    </button>
                </div>
            </div>

            <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-bold text-text-light dark:text-text-dark">Prioridade de Balanceamento</h3>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1 mb-4">Arraste para reordenar. O critério no topo tem maior prioridade ao formar times.</p>
                <ul>
                    {priorities.map((item, index) => (
                         <li
                            key={item}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item)}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, item)}
                            className={`flex items-center gap-4 p-3 mb-2 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-grab active:cursor-grabbing transition-all border-l-4 border-sport-accent ${draggedItem === item ? 'opacity-50' : 'opacity-100'}`}
                            aria-roledescription={`Item arrastável: ${priorityLabels[item].title}. Posição atual ${index + 1} de ${priorities.length}.`}
                         >
                            <div className="text-xl font-bold text-slate-400 dark:text-slate-500 w-4">{index + 1}</div>
                            <div>
                                <p className="font-bold text-text-light dark:text-text-dark">{priorityLabels[item].title}</p>
                                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{priorityLabels[item].description}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default GameSettings;