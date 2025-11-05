import React, { useMemo, useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Match } from '../types';
import { ArrowUpIcon, ArrowDownIcon, TrophyIcon } from './icons/Icons';

type SortableKeys = 'startTime' | 'winner' | 'gameMode';
type SortDirection = 'ascending' | 'descending';

const ITEMS_PER_PAGE = 10;

const MatchHistoryTable: React.FC = () => {
    const { matchHistory } = useAppContext();
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: SortDirection } | null>({ key: 'startTime', direction: 'descending' });
    const [filters, setFilters] = useState({ winner: 'all', gameMode: 'all' });
    const [currentPage, setCurrentPage] = useState(1);

    const filteredAndSortedMatches = useMemo(() => {
        let sortedMatches = [...matchHistory];

        // Filtering
        sortedMatches = sortedMatches.filter(match => {
            const winnerFilter = filters.winner === 'all' || match.winner === filters.winner;
            const gameModeFilter = filters.gameMode === 'all' || match.gameMode === filters.gameMode;
            return winnerFilter && gameModeFilter;
        });

        // Sorting
        if (sortConfig !== null) {
            sortedMatches.sort((a, b) => {
                let aValue: string | number = a[sortConfig.key];
                let bValue: string | number = b[sortConfig.key];

                if (sortConfig.key === 'startTime') {
                    aValue = new Date(a.startTime).getTime();
                    bValue = new Date(b.startTime).getTime();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortedMatches;
    }, [matchHistory, filters, sortConfig]);

    const totalPages = Math.ceil(filteredAndSortedMatches.length / ITEMS_PER_PAGE);
    const paginatedMatches = filteredAndSortedMatches.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const requestSort = (key: SortableKeys) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1);
    };
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const SortableHeader: React.FC<{ sortKey: SortableKeys, label: string, className?: string }> = ({ sortKey, label, className = '' }) => {
        const isSorted = sortConfig?.key === sortKey;
        const icon = isSorted ? (sortConfig?.direction === 'ascending' ? <ArrowUpIcon /> : <ArrowDownIcon />) : null;
        return (
            <th scope="col" className={`px-4 py-3 cursor-pointer hover:bg-slate-700/50 dark:hover:bg-slate-800 ${className}`} onClick={() => requestSort(sortKey)}>
                <div className="flex items-center gap-2">
                    {label}
                    {icon}
                </div>
            </th>
        );
    };

    if (matchHistory.length === 0) {
        return (
            <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-bold mb-2 text-text-light dark:text-text-dark">Histórico de Partidas</h3>
                <p className="text-text-secondary-light dark:text-text-secondary-dark text-center py-4">Nenhuma partida registrada ainda.</p>
            </div>
        );
    }

    return (
        <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-bold mb-4 text-text-light dark:text-text-dark">Histórico de Partidas</h3>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                    <label htmlFor="winner-filter" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">Filtrar por Vencedor</label>
                    <select id="winner-filter" name="winner" value={filters.winner} onChange={handleFilterChange} className="w-full bg-transparent border border-slate-300 dark:border-slate-600 rounded-md shadow-sm p-2 focus:ring-sport-accent focus:border-sport-accent">
                        <option value="all">Todos</option>
                        <option value="A">Time A</option>
                        <option value="B">Time B</option>
                    </select>
                </div>
                 <div className="flex-1">
                    <label htmlFor="gamemode-filter" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">Filtrar por Modo</label>
                    <select id="gamemode-filter" name="gameMode" value={filters.gameMode} onChange={handleFilterChange} className="w-full bg-transparent border border-slate-300 dark:border-slate-600 rounded-md shadow-sm p-2 focus:ring-sport-accent focus:border-sport-accent">
                        <option value="all">Todos</option>
                        <option value="4v4">4 vs 4</option>
                        <option value="6v6">6 vs 6</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-300 uppercase bg-slate-800 dark:bg-slate-900">
                        <tr>
                            <SortableHeader sortKey="startTime" label="Data" />
                            <SortableHeader sortKey="gameMode" label="Modo de Jogo" />
                            <th scope="col" className="px-4 py-3">Time A</th>
                            <th scope="col" className="px-4 py-3">Time B</th>
                            <SortableHeader sortKey="winner" label="Vencedor" />
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedMatches.map(match => {
                            const winnerName = match.winner ? (match.winner === 'A' ? match.teamA.name : match.teamB.name) : 'N/A';
                            return (
                                <tr key={match.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-4 py-3 whitespace-nowrap">{new Date(match.startTime).toLocaleString('pt-BR')}</td>
                                    <td className="px-4 py-3"><span className="font-semibold px-2 py-1 bg-sport-accent text-white rounded-full text-xs">{match.gameMode}</span></td>
                                    <td className="px-4 py-3 text-text-secondary-light dark:text-text-secondary-dark">{match.teamA.players.map(p => p.name).join(', ')}</td>
                                    <td className="px-4 py-3 text-text-secondary-light dark:text-text-secondary-dark">{match.teamB.players.map(p => p.name).join(', ')}</td>
                                    <td className="px-4 py-3 font-semibold">
                                        <div className="flex items-center gap-2">
                                            {winnerName}
                                            {match.winner && <TrophyIcon className="w-4 h-4 text-amber-500" />}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
             {paginatedMatches.length === 0 && (
                <p className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark">Nenhuma partida encontrada com os filtros atuais.</p>
            )}

            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 text-sm">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 font-semibold rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Anterior
                    </button>
                    <span className="font-semibold text-text-light dark:text-text-dark">
                        Página {currentPage} de {totalPages}
                    </span>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 font-semibold rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Próximo
                    </button>
                </div>
            )}
        </div>
    );
};

export default MatchHistoryTable;