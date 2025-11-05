import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Player } from '../types';

const PresenceManagement: React.FC = () => {
    const { players, presentPlayerIds, setPresentPlayerIds, addToQueue, removeFromQueue, resetDailyData } = useAppContext();

    const activePlayers = players.filter(p => p.active);
    const presentPlayers = activePlayers.filter(p => presentPlayerIds.includes(p.id)).sort((a,b) => presentPlayerIds.indexOf(a.id) - presentPlayerIds.indexOf(b.id));
    const absentPlayers = activePlayers.filter(p => !presentPlayerIds.includes(p.id)).sort((a, b) => a.name.localeCompare(b.name));
    
    const togglePresence = (playerId: number) => {
        const isCurrentlyPresent = presentPlayerIds.includes(playerId);

        if (isCurrentlyPresent) {
            // Player will become absent, so remove from queue
            removeFromQueue(playerId);
        } else {
            // Player will become present, so add to queue
            addToQueue(playerId);
        }
        
        setPresentPlayerIds(prev =>
            isCurrentlyPresent
                ? prev.filter(id => id !== playerId)
                : [...prev, playerId]
        );
    };
    
    const PlayerPresenceCard: React.FC<{player: Player, isPresent: boolean}> = ({ player, isPresent }) => {
        return (
            <div className={`flex items-center justify-between p-3 rounded-lg transition-colors ${isPresent ? 'bg-slate-50 dark:bg-dark-card hover:bg-slate-100 dark:hover:bg-slate-700' : 'bg-slate-50 dark:bg-dark-card hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                <span className="font-medium text-text-light dark:text-text-dark">{player.name}</span>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            togglePresence(player.id);
                        }}
                        className={`px-3 py-1 text-sm font-semibold rounded-md transition-all duration-200 transform hover:scale-105 active:scale-95 ${isPresent ? 'bg-sport-loss/10 text-sport-loss hover:bg-sport-loss/20' : 'bg-sport-accent/10 text-sport-accent hover:bg-sport-accent/20'}`}
                    >
                        {isPresent ? 'Ausentar' : 'Presente'}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">Controle de Presença</h2>
                 <button onClick={resetDailyData} className="text-sm font-semibold text-sport-loss hover:underline">Resetar Dia</button>
            </div>
           
            <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-bold mb-3 text-text-light dark:text-text-dark">Presentes na Fila ({presentPlayers.length})</h3>
                {presentPlayers.length > 0 ? (
                    <div className="space-y-2">
                        {presentPlayers.map(p => <PlayerPresenceCard key={p.id} player={p} isPresent={true} />)}
                    </div>
                ) : (
                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-center py-4">Nenhum jogador presente.</p>
                )}
            </div>

            <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-bold mb-3 text-text-light dark:text-text-dark">Ausentes ({absentPlayers.length})</h3>
                 {absentPlayers.length > 0 ? (
                    <div className="space-y-2">
                        {absentPlayers.map(p => <PlayerPresenceCard key={p.id} player={p} isPresent={false} />)}
                    </div>
                 ) : (
                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-center py-4">Todos os jogadores ativos estão presentes.</p>
                 )}
            </div>
        </div>
    );
};

export default PresenceManagement;