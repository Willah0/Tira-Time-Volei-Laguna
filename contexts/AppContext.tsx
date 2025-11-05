import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Player, Position, Match, Priority, Gender, AttendanceRecord, GameSettings, Theme, AccentColor } from '../types';

interface AppContextType {
  players: Player[];
  addPlayer: (player: Omit<Player, 'id' | 'active'>) => void;
  updatePlayer: (player: Player) => void;
  togglePlayerActive: (id: number) => void;
  updatePlayersStatus: (playerIds: number[], active: boolean) => void;
  deletePlayers: (playerIds: number[]) => void;
  presentPlayerIds: number[];
  setPresentPlayerIds: React.Dispatch<React.SetStateAction<number[]>>;
  queue: number[];
  addToQueue: (playerId: number) => void;
  removeFromQueue: (playerId: number) => void;
  currentMatch: Match | null;
  startMatch: (gameMode: '4v4' | '6v6') => string | null;
  endMatch: (winner: 'A' | 'B') => void;
  performSubstitution: (playerOutId: number, playerInId: number) => void;
  matchHistory: Match[];
  attendanceHistory: AttendanceRecord[];
  resetDailyData: () => void;
  clearAllData: () => void;
  gameSettings: GameSettings;
  setGameSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  accentColor: AccentColor;
  setAccentColor: React.Dispatch<React.SetStateAction<AccentColor>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSettings: GameSettings = {
  defaultGameMode: '6v6',
  teamFormationPriority: ['priority', 'setter', 'gender'],
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useLocalStorage<Player[]>('players', []);
  const [presentPlayerIds, setPresentPlayerIds] = useLocalStorage<number[]>('presentPlayerIds', []);
  const [queue, setQueue] = useLocalStorage<number[]>('queue', []);
  const [currentMatch, setCurrentMatch] = useLocalStorage<Match | null>('currentMatch', null);
  const [matchHistory, setMatchHistory] = useLocalStorage<Match[]>('matchHistory', []);
  const [attendanceHistory, setAttendanceHistory] = useLocalStorage<AttendanceRecord[]>('attendanceHistory', []);
  const [gameSettings, setGameSettings] = useLocalStorage<GameSettings>('gameSettings', defaultSettings);
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'system');
  const [accentColor, setAccentColor] = useLocalStorage<AccentColor>('accentColor', 'mikasa');

  useEffect(() => {
    // One-time effect to migrate old accent color values from localStorage
    const rawValue = window.localStorage.getItem('accentColor');
    if (rawValue) {
        try {
            const parsedValue = JSON.parse(rawValue);
            const validThemes: string[] = ['mikasa', 'penalty', 'molten'];
            if (!validThemes.includes(parsedValue)) {
                // It's an old or invalid value, reset it.
                if (parsedValue === 'blue') {
                    setAccentColor('mikasa');
                } else {
                    setAccentColor('mikasa');
                }
            }
        } catch (error) {
            console.error("Failed to parse accentColor from localStorage", error);
            setAccentColor('mikasa');
        }
    }
  }, []); // Run only once on mount

  const addPlayer = (playerData: Omit<Player, 'id' | 'active'>) => {
    const newPlayer: Player = {
      ...playerData,
      id: Date.now(),
      active: true,
    };
    setPlayers(prev => [...prev, newPlayer]);
  };

  const updatePlayer = (updatedPlayer: Player) => {
    setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
  };
  
  const togglePlayerActive = (id: number) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const updatePlayersStatus = (playerIds: number[], active: boolean) => {
    setPlayers(prev => prev.map(p => playerIds.includes(p.id) ? { ...p, active } : p));
  };

  const deletePlayers = (playerIds: number[]) => {
      setPlayers(prev => prev.filter(p => !playerIds.includes(p.id)));
      setPresentPlayerIds(prev => prev.filter(id => !playerIds.includes(id)));
      setQueue(prev => prev.filter(id => !playerIds.includes(id)));
  };

  const addToQueue = (playerId: number) => {
    if (!queue.includes(playerId)) {
      setQueue(prev => [...prev, playerId]);
    }
  };

  const removeFromQueue = (playerId: number) => {
    setQueue(prev => prev.filter(id => id !== playerId));
  };

  const setPresentPlayerIdsAndTrack = (updater: React.SetStateAction<number[]>) => {
      const today = new Date().toISOString().split('T')[0];

      setPresentPlayerIds(prevIds => {
          const newIds = typeof updater === 'function' ? updater(prevIds) : updater;

          setAttendanceHistory(prevHistory => {
              const todayRecordIndex = prevHistory.findIndex(record => record.date === today);
              const newHistory = [...prevHistory];

              if (todayRecordIndex > -1) {
                  newHistory[todayRecordIndex] = { date: today, playerIds: newIds };
              } else {
                  newHistory.push({ date: today, playerIds: newIds });
              }
              return newHistory;
          });
          return newIds;
      });
  };
  
  const startMatch = useCallback((gameMode: '4v4' | '6v6'): string | null => {
    const playersNeeded = gameMode === '6v6' ? 12 : 8;
    if (queue.length < playersNeeded) {
      return `Jogadores insuficientes na fila. São necessários ${playersNeeded}.`;
    }
    if (currentMatch) {
      return 'Já existe uma partida em andamento.';
    }

    const playerObjects = queue.slice(0, playersNeeded).map(id => players.find(p => p.id === id)).filter((p): p is Player => p !== undefined);

    // --- NEW ADVANCED BALANCING LOGIC ---
    const teamA: Player[] = [];
    const teamB: Player[] = [];

    // Helper sort function based on game settings
    const sortPlayers = (playersToSort: Player[]): Player[] => {
        return [...playersToSort].sort((a, b) => {
            for (const criterion of gameSettings.teamFormationPriority) {
                let comparison = 0;
                if (criterion === 'priority') {
                    if (a.priority !== b.priority) {
                        comparison = a.priority === Priority.MEMBER ? -1 : 1;
                    }
                } else if (criterion === 'setter') {
                    const aIsSetter = a.positions.includes(Position.SETTER);
                    const bIsSetter = b.positions.includes(Position.SETTER);
                    if (aIsSetter !== bIsSetter) {
                        comparison = aIsSetter ? -1 : 1;
                    }
                } else if (criterion === 'gender') {
                    if (a.gender !== b.gender) {
                        comparison = a.gender === Gender.FEMALE ? -1 : 1;
                    }
                }
                if (comparison !== 0) return comparison;
            }
            return a.name.localeCompare(b.name); // Final tie-breaker
        });
    };

    // 1. Separate setters from other players
    const setters = sortPlayers(playerObjects.filter(p => p.positions.includes(Position.SETTER)));
    const nonSetters = playerObjects.filter(p => !p.positions.includes(Position.SETTER));

    // 2. Distribute setters evenly using a serpentine draft
    setters.forEach((setter, index) => {
        if (index % 2 === 0) {
            teamA.push(setter);
        } else {
            teamB.push(setter);
        }
    });

    // 3. Separate non-setters into more specific roles for better balance.
    const attackersOnly = sortPlayers(nonSetters.filter(p => p.positions.includes(Position.ATTACKER) && !p.positions.includes(Position.DEFENDER)));
    const defendersOnly = sortPlayers(nonSetters.filter(p => p.positions.includes(Position.DEFENDER) && !p.positions.includes(Position.ATTACKER)));
    const versatilePlayers = sortPlayers(nonSetters.filter(p => p.positions.includes(Position.ATTACKER) && p.positions.includes(Position.DEFENDER)));

    // Helper function to distribute players one by one to the smaller team to maintain size balance.
    const distributePlayersToTeams = (playersToDistribute: Player[]) => {
      playersToDistribute.forEach(player => {
        if (teamA.length <= teamB.length) {
          teamA.push(player);
        } else {
          teamB.push(player);
        }
      });
    };

    // 4. Distribute players from each role group. This ensures a mix of skills on each team.
    // The sorting within each group respects the user's settings (priority, gender).
    distributePlayersToTeams(versatilePlayers);
    distributePlayersToTeams(attackersOnly);
    distributePlayersToTeams(defendersOnly);
    // --- END OF BALANCING LOGIC ---

    const newMatch: Match = {
      id: Date.now(),
      startTime: new Date().toISOString(),
      teamA: { name: 'Time A', players: teamA },
      teamB: { name: 'Time B', players: teamB },
      gameMode,
    };

    setCurrentMatch(newMatch);
    setQueue(prev => prev.slice(playersNeeded));
    return null;
  }, [queue, players, currentMatch, gameSettings, setQueue, setCurrentMatch]);

  const endMatch = useCallback((winner: 'A' | 'B') => {
    if (!currentMatch) return;

    // 1. Finalize and archive the completed match
    const completedMatch = {
      ...currentMatch,
      endTime: new Date().toISOString(),
      winner,
    };
    setMatchHistory(prev => [completedMatch, ...prev]);

    // 2. Identify winner and loser teams
    const winningTeamPlayers = winner === 'A' ? currentMatch.teamA.players : currentMatch.teamB.players;
    const losingTeamPlayers = winner === 'A' ? currentMatch.teamB.players : currentMatch.teamA.players;
    
    const winningTeamIds = winningTeamPlayers.map(p => p.id);
    const losingTeamIds = losingTeamPlayers.map(p => p.id);

    // 3. Define how many players are needed for the next team
    const playersNeededForChallengerTeam = currentMatch.gameMode === '6v6' ? 6 : 4;

    // Pool of available players for the challenger team (current queue + losers)
    const availableChallengersIds = [...queue, ...losingTeamIds];

    // 4. Check if we have enough players in the combined pool to form a challenger team
    if (availableChallengersIds.length < playersNeededForChallengerTeam) {
      // Not enough players, even with the losers. Game over.
      // Clear the court. Winners go to the front of the queue, followed by everyone else.
      setCurrentMatch(null);
      setQueue([...winningTeamIds, ...availableChallengersIds]);
    } else {
      // Enough players to form a new challenger team.
      // 5. Form the challenger team from the front of the combined pool
      const challengerIds = availableChallengersIds.slice(0, playersNeededForChallengerTeam);
      const challengerPlayers = challengerIds
        .map(id => players.find(p => p.id === id))
        .filter((p): p is Player => p !== undefined);

      // 6. Create the next match
      const nextMatch: Match = {
        id: Date.now(),
        startTime: new Date().toISOString(),
        teamA: { name: 'Time A (Vencedor)', players: winningTeamPlayers },
        teamB: { name: 'Time B (Desafiante)', players: challengerPlayers },
        gameMode: currentMatch.gameMode,
      };

      // 7. Update state: set the next match, and update the queue with the remaining players from the pool.
      setCurrentMatch(nextMatch);
      setQueue(availableChallengersIds.slice(playersNeededForChallengerTeam));
    }
  }, [currentMatch, queue, players, setMatchHistory, setCurrentMatch, setQueue]);

  const performSubstitution = useCallback((playerOutId: number, playerInId: number) => {
    if (!currentMatch) return;

    // Create a new queue: remove playerIn, add playerOut at the end
    const newQueue = queue.filter(id => id !== playerInId);
    newQueue.push(playerOutId);

    // Find players objects
    const playerIn = players.find(p => p.id === playerInId);
    if (!playerIn) return; // Should not happen if logic is correct

    // Create new teams with the substituted player
    const newTeamA = {
        ...currentMatch.teamA,
        players: currentMatch.teamA.players.map(p => p.id === playerOutId ? playerIn : p)
    };
    const newTeamB = {
        ...currentMatch.teamB,
        players: currentMatch.teamB.players.map(p => p.id === playerOutId ? playerIn : p)
    };
    
    // Create the new match object
    const newMatch: Match = {
      ...currentMatch,
      teamA: newTeamA,
      teamB: newTeamB,
    };
    
    // Update state
    setCurrentMatch(newMatch);
    setQueue(newQueue);

  }, [currentMatch, queue, players, setCurrentMatch, setQueue]);
  
  const resetDailyData = () => {
    setPresentPlayerIdsAndTrack([]);
    setQueue([]);
    setCurrentMatch(null);
  };
  
  const clearAllData = () => {
    if (window.confirm("Você tem certeza que quer apagar TODOS os dados? Isso inclui jogadores, histórico e tudo mais. Esta ação não pode ser desfeita.")) {
      setPlayers([]);
      setPresentPlayerIds([]);
      setQueue([]);
      setCurrentMatch(null);
      setMatchHistory([]);
      setAttendanceHistory([]);
      setGameSettings(defaultSettings);
    }
  };

  return (
    <AppContext.Provider value={{ players, addPlayer, updatePlayer, togglePlayerActive, updatePlayersStatus, deletePlayers, presentPlayerIds, setPresentPlayerIds: setPresentPlayerIdsAndTrack, queue, addToQueue, removeFromQueue, currentMatch, startMatch, endMatch, performSubstitution, matchHistory, attendanceHistory, resetDailyData, clearAllData, gameSettings, setGameSettings, theme, setTheme, accentColor, setAccentColor }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};