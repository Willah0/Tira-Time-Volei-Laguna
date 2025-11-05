import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Player, Position, Team } from '../types';
import { XMarkIcon, UserIcon, ArrowPathIcon, BoltIcon, ShieldCheckIcon, HandRaisedIcon } from './icons/Icons';
import PlayerAvatar from './PlayerAvatar';

const ChallengerTeamDisplay: React.FC<{ gameMode: '4v4' | '6v6' }> = ({ gameMode }) => {
    const { queue, players } = useAppContext();

    const playersNeeded = gameMode === '6v6' ? 6 : 4;
    const challengerIds = queue.slice(0, playersNeeded);
    const challengerPlayers = challengerIds.map(id => players.find(p => p.id === id)).filter((p): p is Player => p !== undefined);
    const playersStillNeeded = playersNeeded - challengerPlayers.length;

    return (
        <div className="bg-light-card dark:bg-dark-card p-4 sm:p-6 rounded-lg shadow-md mt-6">
            <h3 className="text-xl font-bold text-center mb-4 text-text-light dark:text-text-dark tracking-tight">
                Próximo Time Desafiante (Juízes)
            </h3>
            {playersStillNeeded > 0 ? (
                <div className="text-center py-4">
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">
                        Aguardando mais <span className="font-bold text-sport-accent">{playersStillNeeded}</span> jogador(es) na fila para formar o time.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                    {challengerPlayers.map(player => (
                        <div key={player.id} className="flex flex-col items-center gap-2 text-center">
                            <PlayerAvatar name={player.name} size="md" />
                            <span className="text-sm font-semibold text-text-light dark:text-text-dark">{player.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CurrentMatch: React.FC = () => {
    const { currentMatch, endMatch, queue, players, performSubstitution } = useAppContext();
    const [substitutionCandidate, setSubstitutionCandidate] = useState<{ playerOut: Player; playerIn: Player } | null>(null);

    const queuePlayers = queue.map(id => players.find(p => p.id === id)).filter((p): p is Player => p !== undefined);

    const findBestSubstitute = (playerOut: Player): Player | null => {
        if (queuePlayers.length === 0) return null;

        const isSetter = playerOut.positions.includes(Position.SETTER);

        if (isSetter) {
            const setterInQueue = queuePlayers.find(p => p.positions.includes(Position.SETTER));
            if (setterInQueue) return setterInQueue;
        }

        const playerWithMatchingPosition = queuePlayers.find(p => p.positions.some(pos => playerOut.positions.includes(pos)));
        if (playerWithMatchingPosition) return playerWithMatchingPosition;

        return queuePlayers[0];
    };
    
    const handleSubstituteClick = (playerOut: Player) => {
        const playerIn = findBestSubstitute(playerOut);
        if (playerIn) {
            setSubstitutionCandidate({ playerOut, playerIn });
        } else {
            alert("Não há jogadores na fila para fazer a substituição.");
        }
    };

    if (!currentMatch) return null;
    
    const getPositionIcon = (positions: Position[]) => {
        if (positions.includes(Position.SETTER)) return <HandRaisedIcon className="w-4 h-4 text-blue-400" title="Levantador" />;
        if (positions.includes(Position.ATTACKER)) return <BoltIcon className="w-4 h-4 text-red-400" title="Ataque"/>;
        if (positions.includes(Position.DEFENDER)) return <ShieldCheckIcon className="w-4 h-4 text-green-400" title="Defesa"/>;
        return <UserIcon className="w-4 h-4 text-slate-400" />;
    };

    const TeamDisplay: React.FC<{ team: Team, teamLetter: 'A' | 'B', onSubstitute: (player: Player) => void }> = ({ team, teamLetter, onSubstitute }) => {
        const teamColorClasses = teamLetter === 'A' 
            ? 'from-sky-500 to-blue-600' 
            : 'from-rose-500 to-red-600';
        
        return (
            <div className="bg-light-card dark:bg-dark-card rounded-lg flex-1 shadow-lg w-full">
                <div className={`bg-gradient-to-br ${teamColorClasses} p-3 rounded-t-lg`}>
                    <h4 className="font-extrabold text-xl text-center text-white tracking-wider">{team.name}</h4>
                </div>
                <ul className="p-3 space-y-2">
                    {team.players.map(p => (
                        <li key={p.id} className="flex items-center justify-between gap-2 text-text-light dark:text-text-dark bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md">
                            <div className="flex items-center gap-3">
                                <PlayerAvatar name={p.name} size="md" />
                                <div className="flex flex-col">
                                    <span className="font-bold">{p.name}</span>
                                    <div className="flex items-center gap-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                        {getPositionIcon(p.positions)}
                                        <span>{p.positions[0]}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => onSubstitute(p)} 
                                className="p-1.5 rounded-full text-slate-400 hover:text-sport-accent hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                title={`Substituir ${p.name}`}
                                disabled={queuePlayers.length === 0}
                            >
                                <ArrowPathIcon className="w-5 h-5" />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    return (
        <div className="bg-light-bg dark:bg-dark-bg p-4 sm:p-6 rounded-lg shadow-xl border-t-4 border-sport-accent">
            <h3 className="text-2xl font-extrabold text-center mb-4 text-text-light dark:text-text-dark tracking-tight">Partida em Andamento</h3>
             <p className="text-center text-sm font-semibold px-3 py-1 bg-sport-accent text-white rounded-full inline-block mb-6">{currentMatch.gameMode}</p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-start">
                <TeamDisplay team={currentMatch.teamA} teamLetter="A" onSubstitute={handleSubstituteClick} />
                <div className="font-black text-3xl text-slate-400 dark:text-slate-500 my-4 sm:my-auto">VS</div>
                <TeamDisplay team={currentMatch.teamB} teamLetter="B" onSubstitute={handleSubstituteClick} />
            </div>
            <div className="mt-8 text-center">
                <p className="font-semibold mb-3 text-text-light dark:text-text-dark">🏆 Registrar Vencedor:</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                     <button onClick={() => endMatch('A')} className="w-full sm:w-auto px-6 py-3 bg-gradient-to-br from-sky-500 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:opacity-90 transition-all transform hover:scale-105">
                        {currentMatch.teamA.name}
                    </button>
                    <button onClick={() => endMatch('B')} className="w-full sm:w-auto px-6 py-3 bg-gradient-to-br from-rose-500 to-red-600 text-white font-bold rounded-lg shadow-lg hover:opacity-90 transition-all transform hover:scale-105">
                        {currentMatch.teamB.name}
                    </button>
                </div>
            </div>
            {substitutionCandidate && (
                <SubstitutionConfirmationModal
                    playerOut={substitutionCandidate.playerOut}
                    playerIn={substitutionCandidate.playerIn}
                    onConfirm={() => {
                        performSubstitution(substitutionCandidate.playerOut.id, substitutionCandidate.playerIn.id);
                        setSubstitutionCandidate(null);
                    }}
                    onCancel={() => setSubstitutionCandidate(null)}
                />
            )}
        </div>
    );
};

const Queue: React.FC = () => {
    const { queue, players, removeFromQueue } = useAppContext();
    const queuePlayers = queue.map(id => players.find(p => p.id === id)).filter((p): p is Player => p !== undefined);

    return (
        <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-bold mb-3 text-text-light dark:text-text-dark">Fila de Espera ({queue.length})</h3>
            {queuePlayers.length > 0 ? (
                <ol className="space-y-2">
                    {queuePlayers.map((p, index) => (
                        <li key={p.id} className="flex items-center justify-between bg-slate-50 dark:bg-dark-card hover:bg-slate-100 dark:hover:bg-slate-700 p-3 rounded-md transition-colors">
                            <div className="flex items-center">
                                <span className="font-bold text-sport-accent mr-3 text-lg">{index + 1}.</span>
                                <span className="font-medium text-text-light dark:text-text-dark">{p.name}</span>
                            </div>
                            <button onClick={() => removeFromQueue(p.id)} className="text-slate-400 hover:text-sport-loss transition-colors">
                               <XMarkIcon />
                            </button>
                        </li>
                    ))}
                </ol>
            ) : (
                <p className="text-text-secondary-light dark:text-text-secondary-dark text-center py-4">A fila está vazia.</p>
            )}
        </div>
    );
};

const SubstitutionConfirmationModal: React.FC<{
    playerOut: Player;
    playerIn: Player;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ playerOut, playerIn, onConfirm, onCancel }) => {
    const hasSimilarFunction = playerOut.positions.some(pos => playerIn.positions.includes(pos));
    const isIdealSub = hasSimilarFunction || (playerOut.positions.includes(Position.SETTER) && playerIn.positions.includes(Position.SETTER));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onCancel}>
            <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-2 text-text-light dark:text-text-dark">Confirmar Substituição</h2>
                <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
                    Você tem certeza que quer substituir <span className="font-bold text-text-light dark:text-text-dark">{playerOut.name}</span> por <span className="font-bold text-text-light dark:text-text-dark">{playerIn.name}</span>?
                </p>
                
                {!isIdealSub && (
                     <div className="mb-4 p-3 text-sm text-yellow-800 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900/50 rounded-lg">
                        <span className="font-bold">Atenção:</span> O jogador substituto não possui uma função compatível.
                    </div>
                )}
               
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6">
                    {playerOut.name} será movido para o final da fila de espera.
                </p>

                <div className="flex justify-center gap-4">
                    <button 
                        onClick={onCancel} 
                        className="px-6 py-2 bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-100 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="px-6 py-2 bg-sport-accent text-white font-semibold rounded-md hover:bg-sport-accent-dark transition-colors"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

const QueueAndMatch: React.FC = () => {
    const { currentMatch, startMatch, gameSettings } = useAppContext();
    const [error, setError] = useState<string | null>(null);

    const handleStartMatch = (gameMode: '4v4' | '6v6') => {
        const errorMessage = startMatch(gameMode);
        setError(errorMessage);
        if(errorMessage) {
            setTimeout(() => setError(null), 4000);
        }
    };

    return (
        <div className="space-y-6">
             <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">Fila e Partida</h2>
            
            {currentMatch ? (
                <>
                    <CurrentMatch />
                    <ChallengerTeamDisplay gameMode={currentMatch.gameMode} />
                </>
            ) : (
                <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow-md text-center">
                    <h3 className="font-bold text-xl mb-4 text-text-light dark:text-text-dark">Formar Novos Times</h3>
                    <div className="flex justify-center gap-4">
                        <button 
                          onClick={() => handleStartMatch('4v4')} 
                          className={`px-5 py-3 bg-orange-500 text-white font-bold rounded-lg shadow-md hover:bg-orange-600 transition-transform hover:scale-105 ${
                            gameSettings.defaultGameMode === '4v4' ? 'ring-4 ring-sport-accent/50' : ''
                          }`}
                        >
                            4 vs 4
                        </button>
                        <button 
                          onClick={() => handleStartMatch('6v6')} 
                          className={`px-5 py-3 bg-sport-accent text-white font-bold rounded-lg shadow-md hover:bg-sport-accent-dark transition-transform hover:scale-105 ${
                            gameSettings.defaultGameMode === '6v6' ? 'ring-4 ring-sport-accent/50' : ''
                          }`}
                        >
                            6 vs 6
                        </button>
                    </div>
                     {error && <p className="text-red-500 text-sm font-semibold mt-4">{error}</p>}
                </div>
            )}
            
            <Queue />
        </div>
    );
};

export default QueueAndMatch;