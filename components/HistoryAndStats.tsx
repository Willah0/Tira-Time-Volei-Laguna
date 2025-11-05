import React, { useMemo, useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Player, Match, Team } from '../types';
import { TrophyIcon, ArrowUpIcon, ArrowDownIcon } from './icons/Icons';
import MatchHistoryTable from './MatchHistoryTable';

const PlayerStats: React.FC = () => {
    const { players, matchHistory } = useAppContext();

    const stats = useMemo(() => {
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
        
        return Object.entries(playerStats)
            .map(([id, data]) => ({ player: players.find(p => p.id === Number(id)), ...data }))
            .filter(s => s.player && s.games > 0)
            .sort((a,b) => {
                const winRateA = a.wins / (a.games || 1);
                const winRateB = b.wins / (b.games || 1);
                if (winRateB !== winRateA) return winRateB - winRateA;
                return b.wins - a.wins;
            });

    }, [players, matchHistory]);

     if (stats.length === 0) {
        return (
            <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-bold mb-2 text-text-light dark:text-text-dark">Estatísticas dos Jogadores</h3>
                <p className="text-text-secondary-light dark:text-text-secondary-dark text-center py-4">Nenhum dado de jogo para exibir estatísticas.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-bold mb-3 text-text-light dark:text-text-dark">Estatísticas dos Jogadores</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-300 uppercase bg-slate-800 dark:bg-slate-900">
                        <tr>
                            <th scope="col" className="px-4 py-3 sticky left-0 bg-slate-800 dark:bg-slate-900 z-10 whitespace-nowrap tracking-wider">Jogador</th>
                            <th scope="col" className="px-2 sm:px-4 py-3 text-center whitespace-nowrap tracking-wider">V</th>
                            <th scope="col" className="px-2 sm:px-4 py-3 text-center whitespace-nowrap tracking-wider">D</th>
                            <th scope="col" className="px-4 py-3 text-right whitespace-nowrap tracking-wider">Vitórias %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.map(({ player, wins, losses, games }, index) => {
                            const rank = index + 1;
                            
                            let rankIcon = null;
                            let rowClass = "border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 group";
                            let stickyTdClass = "px-4 py-3 font-medium text-text-light dark:text-text-dark whitespace-nowrap sticky left-0 bg-light-card dark:bg-dark-card group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50";
                            
                            if (rank <= 3) {
                                let iconColor = "";
                                let baseBgClass = "";
                                if (rank === 1) { 
                                    iconColor = "text-amber-400";
                                    baseBgClass = "bg-amber-400/10";
                                } else if (rank === 2) { 
                                    iconColor = "text-slate-400";
                                    baseBgClass = "bg-slate-400/10";
                                } else { // rank === 3
                                    iconColor = "text-orange-500";
                                    baseBgClass = "bg-orange-500/10";
                                }
                                rankIcon = <TrophyIcon className={`w-4 h-4 ${iconColor}`} />;
                                rowClass = `border-b border-slate-200 dark:border-slate-700 group ${baseBgClass}`;
                                stickyTdClass = `px-4 py-3 font-medium text-text-light dark:text-text-dark whitespace-nowrap sticky left-0 ${baseBgClass}`;
                            }

                            return (
                                <tr key={player!.id} className={rowClass}>
                                    <td className={stickyTdClass}>
                                      <div className="flex items-center gap-2">
                                        {player!.name}
                                        {rankIcon}
                                      </div>
                                    </td>
                                    <td className="px-2 sm:px-4 py-3 text-center text-sport-win font-semibold">{wins}</td>
                                    <td className="px-2 sm:px-4 py-3 text-center text-sport-loss font-semibold">{losses}</td>
                                    <td className="px-4 py-3 text-right font-bold text-text-light dark:text-text-dark">{((wins / games) * 100).toFixed(0)}%</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

type AttendanceSortableKeys = 'name' | 'presences' | 'attendanceRate';
type SortDirection = 'ascending' | 'descending';

type PlayerAttendanceStat = {
    player: Player;
    presences: number;
    attendanceRate: number;
};

const SortableHeader: React.FC<{ 
    sortKey: AttendanceSortableKeys, 
    label: string, 
    sortConfig: { key: AttendanceSortableKeys; direction: SortDirection; },
    requestSort: (key: AttendanceSortableKeys) => void,
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

const AttendanceStats: React.FC = () => {
    const { players, attendanceHistory } = useAppContext();
    const [sortConfig, setSortConfig] = useState<{ key: AttendanceSortableKeys; direction: SortDirection }>({ key: 'attendanceRate', direction: 'descending' });

    const sortedStats = useMemo(() => {
        if (!attendanceHistory || attendanceHistory.length === 0) {
            return [];
        }

        const uniqueGameDays = new Set(attendanceHistory.map(r => r.date)).size;
        const playerPresenceMap: { [id: number]: number } = {};
        
        players.forEach(p => {
            playerPresenceMap[p.id] = 0;
        });

        attendanceHistory.forEach(record => {
            record.playerIds.forEach(playerId => {
                if (playerPresenceMap[playerId] !== undefined) {
                    playerPresenceMap[playerId]++;
                }
            });
        });

        let stats: PlayerAttendanceStat[] = players.map(player => ({
            player,
            presences: playerPresenceMap[player.id],
            attendanceRate: uniqueGameDays > 0 ? (playerPresenceMap[player.id] / uniqueGameDays) * 100 : 0,
        })).filter(s => s.presences > 0);

        stats.sort((a, b) => {
            let aValue: string | number;
            let bValue: string | number;

            switch(sortConfig.key) {
                case 'name':
                    aValue = a.player.name;
                    bValue = b.player.name;
                    break;
                case 'presences':
                    aValue = a.presences;
                    bValue = b.presences;
                    break;
                case 'attendanceRate':
                    aValue = a.attendanceRate;
                    bValue = b.attendanceRate;
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

    }, [players, attendanceHistory, sortConfig]);

    const requestSort = (key: AttendanceSortableKeys) => {
        const isNumeric = key !== 'name';
        let direction: SortDirection = isNumeric ? 'descending' : 'ascending';
        
        if (sortConfig.key === key) {
            direction = sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
        }

        setSortConfig({ key, direction });
    };

    if (sortedStats.length === 0) {
        return (
            <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-bold mb-2 text-text-light dark:text-text-dark">Ranking de Assiduidade</h3>
                <p className="text-text-secondary-light dark:text-text-secondary-dark text-center py-4">Nenhum histórico de presença para exibir.</p>
            </div>
        );
    }

    return (
        <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-bold mb-3 text-text-light dark:text-text-dark">Ranking de Assiduidade</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-300 uppercase bg-slate-800 dark:bg-slate-900">
                        <tr>
                            <th scope="col" className="px-2 py-3 text-center">#</th>
                            <SortableHeader sortKey="name" label="Jogador" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader sortKey="presences" label="Presenças" sortConfig={sortConfig} requestSort={requestSort} className="text-center" />
                            <SortableHeader sortKey="attendanceRate" label="Participação %" sortConfig={sortConfig} requestSort={requestSort} className="text-right" />
                        </tr>
                    </thead>
                    <tbody>
                        {sortedStats.map((stat, index) => (
                             <tr key={stat.player.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="px-2 py-3 text-center font-semibold text-text-secondary-light dark:text-text-secondary-dark">{index + 1}</td>
                                <td className="px-4 py-3 font-medium text-text-light dark:text-text-dark whitespace-nowrap">{stat.player.name}</td>
                                <td className="px-4 py-3 text-center font-semibold">{stat.presences}</td>
                                <td className="px-4 py-3 text-right font-bold text-text-light dark:text-text-dark">{stat.attendanceRate.toFixed(0)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const HistoryAndStats: React.FC = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">Histórico e Estatísticas</h2>
            <PlayerStats />
            <AttendanceStats />
            <MatchHistoryTable />
        </div>
    );
};

export default HistoryAndStats;