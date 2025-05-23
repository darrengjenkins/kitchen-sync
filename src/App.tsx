import React, { useState, useEffect } from 'react';
import './App.css';
import { Analytics } from "@vercel/analytics/react";

interface Player {
  id: number;
  name: string;
  sitOutCount: number;
}

interface Court {
  id: number;
  players: Player[];
}

const MIN_PLAYERS = 4;
const MAX_PLAYERS = 40;
const PLAYERS_PER_COURT = 4;
const MIN_COURTS = 1;
const MAX_COURTS = 8;

function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [courtCount, setCourtCount] = useState(4);
  const [courts, setCourts] = useState<Court[]>([]);
  const [sittingOut, setSittingOut] = useState<Player[]>([]);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [nextPlayerId, setNextPlayerId] = useState(1);

  // Initialize or update courts when courtCount changes
  useEffect(() => {
    const newCourts: Court[] = Array.from({ length: courtCount }, (_, index) => ({
      id: index + 1,
      players: []
    }));
    setCourts(newCourts);
  }, [courtCount]);

  const handleCourtCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCount = parseInt(e.target.value);
    setCourtCount(newCount);
  };

  const addPlayer = (name: string) => {
    if (players.length >= MAX_PLAYERS) {
      alert(`Maximum number of players (${MAX_PLAYERS}) reached!`);
      return;
    }
    const newPlayer: Player = {
      id: nextPlayerId,
      name: name.trim(),
      sitOutCount: 0
    };
    setPlayers([...players, newPlayer]);
    setNextPlayerId(nextPlayerId + 1);
  };

  const removePlayer = (id: number) => {
    setPlayers(players.filter(player => player.id !== id));
    setCourts(courts.map(court => ({
      ...court,
      players: court.players.filter(player => player.id !== id)
    })));
    setSittingOut(sittingOut.filter(player => player.id !== id));
  };

  const resetCounts = () => {
    setGamesPlayed(0);
    setPlayers(players.map(player => ({
      ...player,
      sitOutCount: 0
    })));
  };

  const assignPlayers = () => {
    if (players.length < MIN_PLAYERS) {
      alert(`Please add at least ${MIN_PLAYERS} players before assigning courts.`);
      return;
    }

    // Sort players by sitOutCount (ascending)
    const sortedPlayers = [...players].sort((a, b) => a.sitOutCount - b.sitOutCount);
    const numToSitOut = players.length % PLAYERS_PER_COURT;
    let sitOutCandidates: Player[] = [];
    let sitOutCount = 0;
    let i = 0;
    
    // Collect enough players from the lowest sitOutCount groups
    while (sitOutCandidates.length < numToSitOut && i < sortedPlayers.length) {
      const currentCount = sortedPlayers[i].sitOutCount;
      const group = sortedPlayers.filter(p => p.sitOutCount === currentCount && !sitOutCandidates.includes(p));
      // Shuffle the group
      const shuffledGroup = [...group].sort(() => Math.random() - 0.5);
      for (const p of shuffledGroup) {
        if (sitOutCandidates.length < numToSitOut) {
          sitOutCandidates.push(p);
        }
      }
      i += group.length;
    }

    // Remove sitOutCandidates from the list to get available players
    const availablePlayers = sortedPlayers.filter(p => !sitOutCandidates.includes(p)).sort(() => Math.random() - 0.5);

    // Reset all courts first
    const newCourts: Court[] = courts.map(court => ({ ...court, players: [] }));
    
    // Calculate how many courts we can fill
    const courtsNeeded = Math.floor(availablePlayers.length / PLAYERS_PER_COURT);
    
    // Assign players to courts
    for (let i = 0; i < courtsNeeded; i++) {
      const startIndex = i * PLAYERS_PER_COURT;
      const endIndex = startIndex + PLAYERS_PER_COURT;
      newCourts[i] = {
        ...newCourts[i],
        players: availablePlayers.slice(startIndex, endIndex)
      };
    }

    // Update sit-out counts for players who are sitting out
    const updatedPlayers = players.map(player => {
      if (sitOutCandidates.find(p => p.id === player.id)) {
        return { ...player, sitOutCount: player.sitOutCount + 1 };
      }
      return player;
    });

    setCourts(newCourts);
    setSittingOut(sitOutCandidates);
    setPlayers(updatedPlayers);
    setGamesPlayed(gamesPlayed + 1);
  };

  const handleAddPlayer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem('playerName') as HTMLInputElement;
    const names = input.value.split(',').map(name => name.trim()).filter(name => name !== '');
    
    // Check if adding all names would exceed the maximum
    if (players.length + names.length > MAX_PLAYERS) {
      alert(`Cannot add ${names.length} players. Only ${MAX_PLAYERS - players.length} spots remaining.`);
      return;
    }

    // Create all new players at once
    const newPlayers = names.map((name) => ({
      id: nextPlayerId + names.indexOf(name),
      name: name,
      sitOutCount: 0
    }));

    // Add all players in a single state update
    setPlayers([...players, ...newPlayers]);
    setNextPlayerId(nextPlayerId + names.length);
    input.value = '';
  };

  return (
    <div className="App">
      <Analytics />
      <div className="app-header">
        <h1>Kitchen Sync</h1>
        <p className="tagline">The pickleball court organizer with FairPlay Technology</p>
      </div>
      
      <div className="game-stats">
        <div className="games-played">
          <h3>Games Played: {gamesPlayed}</h3>
          <button onClick={resetCounts} className="reset-button">
            Reset Counts
          </button>
        </div>
      </div>

      <div className="court-count-selector">
        <label htmlFor="courtCount">Number of Available Courts:</label>
        <select
          id="courtCount"
          value={courtCount}
          onChange={handleCourtCountChange}
        >
          {Array.from({ length: MAX_COURTS }, (_, i) => i + 1).map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
      </div>

      <div className="player-input">
        <form onSubmit={handleAddPlayer}>
          <input
            type="text"
            name="playerName"
            placeholder="Enter player names (comma-separated)"
            disabled={players.length >= MAX_PLAYERS}
          />
          <button type="submit" disabled={players.length >= MAX_PLAYERS}>
            Add Player ({players.length}/{MAX_PLAYERS})
          </button>
        </form>
      </div>

      <div className="player-list">
        <h2>Players:</h2>
        <ul>
          {players.map((player) => (
            <li key={player.id}>
              <div className="player-info">
                <span>{player.name}</span>
                <span className="sit-out-count">Sat out: {player.sitOutCount}</span>
              </div>
              <button 
                onClick={() => removePlayer(player.id)}
                className="remove-button"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button 
        className="assign-button"
        onClick={assignPlayers}
        disabled={players.length < MIN_PLAYERS}
      >
        Assign Players
      </button>

      <div className="courts-container">
        {courts.map((court) => (
          <div key={court.id} className="court">
            <h3>Court {court.id}</h3>
            <div className="court-players">
              <div className="team">
                {court.players.slice(0, 2).map((player) => (
                  <div key={player.id} className="player">{player.name}</div>
                ))}
              </div>
              <div className="versus">vs</div>
              <div className="team">
                {court.players.slice(2, 4).map((player) => (
                  <div key={player.id} className="player">{player.name}</div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="sitting-out">
        <h3>Sitting Out:</h3>
        <ul>
          {sittingOut.map((player) => (
            <li key={player.id}>
              {player.name}
              <span className="sit-out-count">({player.sitOutCount})</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App; 