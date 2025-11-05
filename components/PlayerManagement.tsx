import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Player, Position, Priority, Gender, Match, Team } from '../types';
import { PlusIcon, TrophyIcon, XMarkIcon, ArrowDownIcon, ArrowUpIcon, CircleIcon, CheckCircleIcon } from './icons/Icons';

// Player Ranking Section Components
type PlayerStat = {
    player: Player;
    wins: number;
    losses: number;
    games: number;
    winRate: number;
};
type SortableKeys = 'name' | 'wins' | 'losses' | 'winRate';
type SortDirection = 'ascending' | 'descending';

const SortableHeader: React.FC<{ 
    sortKey: SortableKeys, 
    label: string, 
    sortConfig: { key: SortableKeys; direction: SortDirection; },
    requestSort: (key: SortableKeys) => void,
    className?: string
}> = ({ sortKey, label, sortConfig, requestSort, className = '' }) => {
    const isSorted = sortConfig?.key === sortKey;
    const icon = isSorted ? (sortConfig?.direction === 'ascending' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />) : null;
    return (
        <th scope="col" className={`px-4 py-3 cursor-pointer hover:bg-slate-700/50 dark:hover:bg-slate-800 ${className}`} onClick={() => requestSort(sortKey)}>
            <div className="flex items-center gap-2">
                {label}
                {icon}
            </div>
        </th>
    );
};

const PlayerRanking: React.FC = () => {
    const { players, matchHistory } = useAppContext();
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: SortDirection }>({ key: 'winRate', direction: 'descending' });
    const [columnOrder, setColumnOrder] = useState<SortableKeys[]>(['wins', 'losses', 'winRate']);
    const [draggedColumn, setDraggedColumn] = useState<SortableKeys | null>(null);

    const sortedStats = useMemo(() => {
        const playerStats: { [id: number]: { wins: number; losses: number; games: number } } = {};
        players.forEach(p => {
            playerStats[p.id] = { wins: 0, losses: 0, games: 0 };
        });

        matchHistory.forEach(match => {
            if (!match.winner) return;
            
            const winningTeam = match.winner === 'A' ? match.teamA.players : match.teamB.players;
            const losingTeam = match.winner === 'A' ? match.teamB.players : match.teamA.players;

            winningTeam.forEach(p => {
                if(playerStats[p.id]) {
                   playerStats[p.id].wins++;
                   playerStats[p.id].games++;
                }
            });
            losingTeam.forEach(p => {
                 if(playerStats[p.id]) {
                    playerStats[p.id].losses++;
                    playerStats[p.id].games++;
                 }
            });
        });
        
        let stats: PlayerStat[] = Object.entries(playerStats)
            .map(([id, data]) => ({ 
                player: players.find(p => p.id === Number(id))!, 
                ...data,
                winRate: data.games > 0 ? (data.wins / data.games) * 100 : 0
            }))
            .filter(s => s.player && s.games > 0);

        stats.sort((a, b) => {
            let aValue: string | number;
            let bValue: string | number;

            switch(sortConfig.key) {
                case 'name':
                    aValue = a.player.name;
                    bValue = b.player.name;
                    break;
                case 'wins':
                    aValue = a.wins;
                    bValue = b.wins;
                    break;
                case 'losses':
                    aValue = a.losses;
                    bValue = b.losses;
                    break;
                case 'winRate':
                    aValue = a.winRate;
                    bValue = b.winRate;
                    break;
                default:
                    return 0;
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            }
            
            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
            
            if (sortConfig.key !== 'name') return a.player.name.localeCompare(b.player.name);
            
            return 0;
        });

        return stats;
    }, [players, matchHistory, sortConfig]);

    const requestSort = (key: SortableKeys) => {
        const isNumeric = key !== 'name';
        let direction: SortDirection = isNumeric ? 'descending' : 'ascending';
        
        if (sortConfig.key === key) {
            direction = sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
        }

        setSortConfig({ key, direction });
    };

    const handleDragStart = (e: React.DragEvent<HTMLTableCellElement>, columnKey: SortableKeys) => {
        setDraggedColumn(columnKey);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLTableCellElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLTableCellElement>, targetColumnKey: SortableKeys) => {
        e.preventDefault();
        if (!draggedColumn || draggedColumn === targetColumnKey) {
            setDraggedColumn(null);
            return;
        }

        const newOrder = [...columnOrder];
        const draggedIndex = newOrder.indexOf(draggedColumn);
        const targetIndex = newOrder.indexOf(targetColumnKey);
        
        const [removed] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, removed);
        
        setColumnOrder(newOrder);
        setDraggedColumn(null);
    };
    
    const handleDragEnd = () => {
        setDraggedColumn(null);
    };

    const columnDefs: Record<Exclude<SortableKeys, 'name'>, { label: string, className: string }> = {
        wins: { label: 'V', className: 'text-center' },
        losses: { label: 'D', className: 'text-center' },
        winRate: { label: 'Vitórias %', className: 'min-w-[150px]' },
    };

    const getCellContent = (stat: PlayerStat, key: SortableKeys) => {
        switch(key) {
            case 'wins':
                return stat.wins;
            case 'losses':
                return stat.losses;
            case 'winRate':
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                            <div
                                className="bg-gradient-to-r from-green-400 to-sport-win h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${stat.winRate.toFixed(0)}%` }}
                            ></div>
                        </div>
                        <span className="font-bold text-text-light dark:text-text-dark w-12 text-right">{stat.winRate.toFixed(0)}%</span>
                    </div>
                );
            default:
                return null;
        }
    };


    if (sortedStats.length === 0) {
        return (
            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center py-4">
                    Nenhum dado de jogo para exibir o ranking.
                </p>
            </div>
        );
    }
    
    return (
        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-300 uppercase bg-slate-800 dark:bg-slate-900">
                        <tr>
                            <th scope="col" className="px-2 py-3 text-center">#</th>
                            <SortableHeader sortKey="name" label="Jogador" sortConfig={sortConfig} requestSort={requestSort} />
                            
                            {columnOrder.map((key) => {
                                if (key === 'name') return null;
                                const def = columnDefs[key];
                                const isSorted = sortConfig?.key === key;
                                const icon = isSorted ? (sortConfig?.direction === 'ascending' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />) : null;
                                return (
                                    <th
                                        key={key}
                                        scope="col"
                                        className={`px-4 py-3 cursor-grab active:cursor-grabbing hover:bg-slate-700/50 dark:hover:bg-slate-800 transition-opacity ${def.className} ${draggedColumn === key ? 'opacity-30' : ''}`}
                                        onClick={() => requestSort(key)}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, key)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, key)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {def.label}
                                            {icon}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedStats.map((stat, index) => {
                            const rank = index + 1;
                            let rankIcon = null;
                            if (rank === 1) {
                                rankIcon = <TrophyIcon className="w-5 h-5 text-amber-400" />;
                            } else if (rank === 2) {
                                rankIcon = <TrophyIcon className="w-5 h-5 text-slate-400" />;
                            } else if (rank === 3) {
                                rankIcon = <TrophyIcon className="w-5 h-5 text-orange-500" />;
                            }

                            return (
                                <tr key={stat.player.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-2 py-3 text-center font-semibold text-text-secondary-light dark:text-text-secondary-dark">{rank}</td>
                                    <td className="px-4 py-3 font-medium text-text-light dark:text-text-dark whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {stat.player.name}
                                            {rankIcon}
                                        </div>
                                    </td>
                                    
                                    {columnOrder.map(key => {
                                        if (key === 'name') return null;
                                        const cellClassName = key === 'winRate'
                                            ? "px-4 py-3"
                                            : `px-4 py-3 text-center font-semibold ${key === 'wins' ? 'text-sport-win' : 'text-sport-loss'}`;
                                        
                                        return (
                                            <td key={key} className={cellClassName}>
                                                {getCellContent(stat, key)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const PlayerDetailModal: React.FC<{ player: Player; onClose: () => void; onEdit: (player: Player) => void }> = ({ player, onClose, onEdit }) => {
    const { matchHistory, attendanceHistory } = useAppContext();

    const stats = useMemo(() => {
        const playerStats = { wins: 0, losses: 0, games: 0, presences: 0 };
        const playerMatches: Match[] = [];

        matchHistory.forEach(match => {
            const isOnTeamA = match.teamA.players.some(p => p.id === player.id);
            const isOnTeamB = match.teamB.players.some(p => p.id === player.id);

            if (isOnTeamA || isOnTeamB) {
                playerStats.games++;
                playerMatches.push(match);
                if (match.winner) {
                    if ((match.winner === 'A' && isOnTeamA) || (match.winner === 'B' && isOnTeamB)) {
                        playerStats.wins++;
                    } else {
                        playerStats.losses++;
                    }
                }
            }
        });

        const uniqueGameDays = new Set(attendanceHistory.map(r => r.date)).size;
        attendanceHistory.forEach(record => {
            if (record.playerIds.includes(player.id)) {
                playerStats.presences++;
            }
        });
        
        const winRate = playerStats.games > 0 ? (playerStats.wins / playerStats.games) * 100 : 0;
        const attendanceRate = uniqueGameDays > 0 ? (playerStats.presences / uniqueGameDays) * 100 : 0;

        return { ...playerStats, winRate, attendanceRate, playerMatches };

    }, [player, matchHistory, attendanceHistory]);
    
    const TeamDisplay: React.FC<{ match: Match; team: Team, teamLetter: 'A' | 'B' }> = ({ match, team, teamLetter }) => {
        const isWinner = match.winner === teamLetter;
        const playerIsInTeam = team.players.some(p => p.id === player.id);
        const teamClasses = isWinner ? 'text-sport-win' : 'text-sport-loss';
        const teamBg = playerIsInTeam ? (isWinner ? 'bg-sport-win/10' : 'bg-sport-loss/10') : '';
        
        return (
            <div className={`p-2 rounded ${teamBg}`}>
                <p className={`font-bold ${teamClasses}`}>{team.name} {isWinner && '🏆'}</p>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{team.players.map(p => p.name).join(', ')}</p>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-light-card dark:bg-dark-card">
                    <div>
                        <h2 className="text-xl font-bold text-text-light dark:text-text-dark">{player.name}</h2>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{player.priority} &middot; {player.gender}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><XMarkIcon /></button>
                </header>
                
                <main className="p-4 space-y-6 overflow-y-auto">
                    {/* Stats */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-bold text-base mb-2 text-text-light dark:text-text-dark">Desempenho em Jogo</h3>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                    <p className="text-2xl font-bold">{stats.games}</p>
                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase">Jogos</p>
                                </div>
                                <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                    <p className="text-2xl font-bold">
                                        <span className="text-sport-win">{stats.wins}</span>
                                        <span className="text-slate-400 dark:text-slate-500 mx-1">/</span>
                                        <span className="text-sport-loss">{stats.losses}</span>
                                    </p>
                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase">V / D</p>
                                </div>
                                <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg col-span-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase">Taxa de Vitória</span>
                                        <span className="text-sm font-bold text-text-light dark:text-text-dark">{stats.winRate.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5">
                                        <div className="bg-sport-win h-2.5 rounded-full transition-all duration-500" style={{ width: `${stats.winRate}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-base mb-2 text-text-light dark:text-text-dark">Assiduidade</h3>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                 <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                    <p className="text-2xl font-bold">{stats.presences}</p>
                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase">Presenças</p>
                                </div>
                                <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                     <p className="text-2xl font-bold">{stats.attendanceRate.toFixed(0)}<span className="text-lg">%</span></p>
                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase">Participação</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Match History */}
                    <div>
                        <h3 className="font-bold text-lg mt-6 mb-2">Histórico de Partidas</h3>
                        {stats.playerMatches.length > 0 ? (
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                {stats.playerMatches.map(match => (
                                    <div key={match.id} className="text-sm border-b border-slate-200 dark:border-slate-700 pb-2">
                                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1">{new Date(match.startTime).toLocaleString('pt-BR')}</p>
                                        <TeamDisplay match={match} team={match.teamA} teamLetter='A' />
                                        <TeamDisplay match={match} team={match.teamB} teamLetter='B' />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center py-4">Nenhuma partida registrada.</p>
                        )}
                    </div>
                </main>

                <footer className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 sticky bottom-0 bg-light-card dark:bg-dark-card">
                     <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-100 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Fechar</button>
                    <button onClick={() => onEdit(player)} className="px-4 py-2 bg-sport-accent text-white font-semibold rounded-md hover:bg-sport-accent-dark transition-colors">Editar Jogador</button>
                </footer>
            </div>
        </div>
    );
};


const PlayerCard: React.FC<{ 
    player: Player, 
    onEdit: (player: Player) => void, 
    onViewDetails: (player: Player) => void,
    isBulkMode: boolean,
    isSelected: boolean,
    onSelect: (id: number) => void
}> = ({ player, onEdit, onViewDetails, isBulkMode, isSelected, onSelect }) => {
    const { togglePlayerActive } = useAppContext();
    const priorityColor = player.priority === Priority.MEMBER ? 'border-sport-win' : 'border-orange-500';
    const genderColor = player.gender === Gender.MALE ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
    
    const cardClickHandler = () => {
        if (isBulkMode) {
            onSelect(player.id);
        } else {
            onViewDetails(player);
        }
    };
    
    const positionBadgeColor = (position: Position) => {
        switch (position) {
            case Position.SETTER:
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case Position.ATTACKER:
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case Position.DEFENDER:
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            default:
                return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
        }
    };
    
    return (
        <div 
            onClick={cardClickHandler} 
            className={`relative group bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border-l-4 ${priorityColor} ${!player.active ? 'opacity-60 grayscale' : ''} ${isBulkMode ? 'pl-14 cursor-pointer' : 'cursor-pointer'} ${isSelected ? 'ring-2 ring-sport-accent bg-sport-accent/10 dark:bg-sport-accent/20' : ''}`}
        >
             {isBulkMode && (
                <div className="absolute top-1/2 left-4 -translate-y-1/2 transition-all duration-200">
                    {isSelected ? (
                        <CheckCircleIcon className="w-6 h-6 text-sport-accent" />
                    ) : (
                        <CircleIcon className="w-6 h-6 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500" />
                    )}
                </div>
            )}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-2">
                <div>
                     <h3 className="flex items-center gap-2 text-lg font-bold text-text-light dark:text-text-dark">
                        {player.active && <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>}
                        {player.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs">
                        <span className={`px-2 py-1 rounded-full font-semibold ${player.priority === Priority.MEMBER ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>{player.priority}</span>
                        <span className={`px-2 py-1 rounded-full font-semibold ${genderColor}`}>{player.gender}</span>
                    </div>
                </div>
                {!isBulkMode && (
                    <div className="flex flex-col items-end gap-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => onEdit(player)} className="text-sm font-semibold text-sport-accent hover:underline">Editar</button>
                        <label className="flex items-center cursor-pointer">
                            <span className="text-sm mr-2 text-text-secondary-light dark:text-text-secondary-dark">{player.active ? 'Ativo' : 'Inativo'}</span>
                            <div className="relative">
                                <input type="checkbox" checked={player.active} onChange={() => togglePlayerActive(player.id)} className="sr-only" />
                                <div className={`block w-10 h-6 rounded-full transition-colors duration-300 ${player.active ? 'bg-sport-win' : 'bg-slate-400 dark:bg-slate-600'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${player.active ? 'transform translate-x-4' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                )}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap gap-2 mt-1">
                    {player.positions.map(pos => (
                        <span key={pos} className={`text-xs px-2.5 py-1 rounded-full font-semibold ${positionBadgeColor(pos)}`}>
                            {pos}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

const PlayerForm: React.FC<{ player: Player | null, onSave: (player: Omit<Player, 'id' | 'active'> | Player) => void, onCancel: () => void }> = ({ player, onSave, onCancel }) => {
    const [name, setName] = useState(player?.name || '');
    const [positions, setPositions] = useState<Position[]>(player?.positions || []);
    const [priority, setPriority] = useState<Priority>(player?.priority || Priority.MEMBER);
    const [gender, setGender] = useState<Gender>(player?.gender || Gender.MALE);

    const handlePositionChange = (pos: Position) => {
        setPositions(prev => prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && positions.length > 0) {
            const playerData = { name, positions, priority, gender };
            if (player) {
                onSave({ ...playerData, id: player.id, active: player.active });
            } else {
                onSave(playerData);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-text-light dark:text-text-dark">{player ? 'Editar Jogador' : 'Novo Jogador'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Nome</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full bg-transparent border border-slate-300 dark:border-slate-600 rounded-md shadow-sm p-2 focus:ring-sport-accent focus:border-sport-accent" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Posições</label>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                            {Object.values(Position).map(pos => (
                                <button type="button" key={pos} onClick={() => handlePositionChange(pos)} className={`p-2 rounded-md text-sm border font-semibold transition-colors ${positions.includes(pos) ? 'bg-sport-accent text-white border-sport-accent' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600'}`}>
                                    {pos}
                                </button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Gênero</label>
                        <select value={gender} onChange={e => setGender(e.target.value as Gender)} className="mt-1 block w-full bg-transparent border border-slate-300 dark:border-slate-600 rounded-md shadow-sm p-2 focus:ring-sport-accent focus:border-sport-accent">
                            {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Prioridade</label>
                        <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className="mt-1 block w-full bg-transparent border border-slate-300 dark:border-slate-600 rounded-md shadow-sm p-2 focus:ring-sport-accent focus:border-sport-accent">
                            {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-100 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-sport-accent text-white font-semibold rounded-md hover:bg-sport-accent-dark transition-colors">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const BulkActionBar: React.FC<{
    selectedCount: number;
    onSelectAll: () => void;
    isAllSelected: boolean;
    onCancel: () => void;
    onActivate: () => void;
    onDeactivate: () => void;
    onDelete: () => void;
}> = ({ selectedCount, onSelectAll, isAllSelected, onCancel, onActivate, onDeactivate, onDelete }) => {
    const hasSelection = selectedCount > 0;
    
    return (
        <div className="sticky top-2 z-10 bg-light-card dark:bg-dark-card p-3 shadow-lg rounded-lg mb-4 flex items-center justify-between gap-4 flex-wrap border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4">
                <button onClick={onCancel} className="font-semibold text-sport-accent hover:underline">Cancelar</button>
                <div className="flex items-center">
                    <input 
                        type="checkbox" 
                        checked={isAllSelected}
                        onChange={onSelectAll}
                        id="selectAllCheckbox"
                        className="h-4 w-4 rounded border-gray-300 text-sport-accent focus:ring-sport-accent"
                    />
                    <label htmlFor="selectAllCheckbox" className="ml-2 text-sm font-medium text-text-light dark:text-text-dark">
                        {selectedCount} selecionado(s)
                    </label>
                </div>
            </div>
            <div className="flex items-center gap-2">
                 <button onClick={onActivate} disabled={!hasSelection} className="px-3 py-1 text-sm rounded-md font-semibold transition bg-sport-win/10 text-sport-win hover:bg-sport-win/20 disabled:opacity-50 disabled:cursor-not-allowed">
                    Ativar
                </button>
                <button onClick={onDeactivate} disabled={!hasSelection} className="px-3 py-1 text-sm rounded-md font-semibold transition bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                    Inativar
                </button>
                <button onClick={onDelete} disabled={!hasSelection} className="px-3 py-1 text-sm rounded-md font-semibold transition bg-sport-loss/10 text-sport-loss hover:bg-sport-loss/20 disabled:opacity-50 disabled:cursor-not-allowed">
                    Excluir
                </button>
            </div>
        </div>
    );
};

const PlayerManagement: React.FC = () => {
    const { players, addPlayer, updatePlayer, clearAllData, updatePlayersStatus, deletePlayers } = useAppContext();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [detailPlayer, setDetailPlayer] = useState<Player | null>(null);
    const [showInactive, setShowInactive] = useState(false);
    const [positionFilter, setPositionFilter] = useState<Position | 'ALL'>('ALL');
    const [genderFilter, setGenderFilter] = useState<Gender | 'ALL'>('ALL');
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
    const [showRanking, setShowRanking] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsMounted(true);
        }, 10);
        return () => clearTimeout(timer);
    }, []);

    const filteredPlayers = useMemo(() => players
        .filter(p => showInactive || p.active)
        .filter(p => genderFilter === 'ALL' || p.gender === genderFilter)
        .filter(p => positionFilter === 'ALL' || p.positions.includes(positionFilter))
        .sort((a,b) => a.name.localeCompare(b.name)),
      [players, showInactive, genderFilter, positionFilter]
    );
    
    const isAllFilteredSelected = filteredPlayers.length > 0 && selectedPlayerIds.length === filteredPlayers.length;

    const toggleBulkMode = () => {
        setIsBulkMode(prev => !prev);
        setSelectedPlayerIds([]);
    };

    const handleToggleSelectPlayer = (playerId: number) => {
        setSelectedPlayerIds(prev =>
            prev.includes(playerId)
                ? prev.filter(id => id !== playerId)
                : [...prev, playerId]
        );
    };

    const handleSelectAll = () => {
        if (isAllFilteredSelected) {
            setSelectedPlayerIds([]);
        } else {
            setSelectedPlayerIds(filteredPlayers.map(p => p.id));
        }
    };

    const handleBulkActivate = () => {
        updatePlayersStatus(selectedPlayerIds, true);
        toggleBulkMode();
    };

    const handleBulkDeactivate = () => {
        updatePlayersStatus(selectedPlayerIds, false);
        toggleBulkMode();
    };

    const handleBulkDelete = () => {
        if (window.confirm(`Você tem certeza que quer excluir ${selectedPlayerIds.length} jogador(es)? Esta ação não pode ser desfeita.`)) {
            deletePlayers(selectedPlayerIds);
            toggleBulkMode();
        }
    };

    const handleSave = (playerData: Omit<Player, 'id' | 'active'> | Player) => {
        if ('id' in playerData) {
            updatePlayer(playerData);
        } else {
            addPlayer(playerData);
        }
        setIsFormOpen(false);
        setEditingPlayer(null);
    };
    
    const handleEdit = (player: Player) => {
        setEditingPlayer(player);
        setIsFormOpen(true);
    };

    const handleViewDetails = (player: Player) => {
        setDetailPlayer(player);
    };
    
    return (
        <div className={`space-y-4 transition-opacity duration-700 ease-in-out ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
            {!isBulkMode ? (
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">Gerenciar Jogadores</h2>
                     <div className="flex items-center gap-3">
                        <button onClick={toggleBulkMode} className="text-sm font-semibold text-sport-accent hover:underline">Seleção Múltipla</button>
                        <button onClick={() => { setEditingPlayer(null); setIsFormOpen(true); }} className="bg-sport-accent text-white p-2 rounded-full shadow-lg hover:bg-sport-accent-dark transition-transform hover:scale-110">
                            <PlusIcon />
                        </button>
                    </div>
                </div>
            ) : (
                <BulkActionBar 
                    selectedCount={selectedPlayerIds.length}
                    onSelectAll={handleSelectAll}
                    isAllSelected={isAllFilteredSelected}
                    onCancel={toggleBulkMode}
                    onActivate={handleBulkActivate}
                    onDeactivate={handleBulkDeactivate}
                    onDelete={handleBulkDelete}
                />
            )}

            <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-sm">
                <button
                    onClick={() => setShowRanking(prev => !prev)}
                    className="w-full flex justify-between items-center text-left"
                >
                    <h3 className="text-lg font-bold text-text-light dark:text-text-dark">Ranking de Jogadores</h3>
                    {showRanking ? <ArrowUpIcon className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" /> : <ArrowDownIcon className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />}
                </button>
                {showRanking && <PlayerRanking />}
            </div>

            <div className="p-4 bg-light-card dark:bg-dark-card rounded-lg shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <label className="flex items-center cursor-pointer">
                        <span className="text-sm font-medium mr-3 text-text-light dark:text-text-dark">Mostrar inativos</span>
                         <div className="relative">
                            <input type="checkbox" checked={showInactive} onChange={() => setShowInactive(s => !s)} className="sr-only" />
                            <div className={`block w-10 h-6 rounded-full ${showInactive ? 'bg-orange-500' : 'bg-slate-400 dark:bg-slate-600'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showInactive ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                    </label>
                     <button onClick={clearAllData} className="text-sm font-semibold text-sport-loss hover:underline">Limpar Tudo</button>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">Filtrar por Posição</label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setPositionFilter('ALL')}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${positionFilter === 'ALL' ? 'bg-sport-accent text-white border-sport-accent' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600'}`}
                        >
                            Todos
                        </button>
                        {Object.values(Position).map(pos => (
                            <button
                                key={pos}
                                onClick={() => setPositionFilter(pos)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${positionFilter === pos ? 'bg-sport-accent text-white border-sport-accent' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600'}`}
                            >
                                {pos}
                            </button>
                        ))}
                    </div>
                </div>

                 <div>
                    <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">Filtrar por Gênero</label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setGenderFilter('ALL')}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${genderFilter === 'ALL' ? 'bg-sport-accent text-white border-sport-accent' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600'}`}
                        >
                            Todos
                        </button>
                        {Object.values(Gender).map(gen => (
                            <button
                                key={gen}
                                onClick={() => setGenderFilter(gen)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${genderFilter === gen ? 'bg-sport-accent text-white border-sport-accent' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600'}`}
                            >
                                {gen}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            
            {filteredPlayers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredPlayers.map(player => (
                        <PlayerCard 
                            key={player.id} 
                            player={player} 
                            onEdit={handleEdit} 
                            onViewDetails={handleViewDetails}
                            isBulkMode={isBulkMode}
                            isSelected={selectedPlayerIds.includes(player.id)}
                            onSelect={handleToggleSelectPlayer}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center text-text-secondary-light dark:text-text-secondary-dark py-12 bg-light-card dark:bg-dark-card rounded-lg shadow-sm">
                    <p className="font-semibold">Nenhum jogador encontrado.</p>
                    <p className="text-sm mt-1">Ajuste os filtros ou adicione novos jogadores.</p>
                </div>
            )}

            {isFormOpen && <PlayerForm player={editingPlayer} onSave={handleSave} onCancel={() => { setIsFormOpen(false); setEditingPlayer(null); }} />}
            {detailPlayer && <PlayerDetailModal player={detailPlayer} onClose={() => setDetailPlayer(null)} onEdit={(p) => { setDetailPlayer(null); handleEdit(p); }} />}
        </div>
    );
};

export default PlayerManagement;