import { useState } from 'react';
import { LeagueCreator } from './components/LeagueCreator';
import { SeasonView } from './components/SeasonView';
import { MatchView } from './components/MatchView';
import { TeamView } from './components/TeamView';
import { createSeason } from './engine/season';
import { applyAgeProgression, ALL_TRAITS } from './engine/generator';
import { createMatch, advanceRallyLoop } from './engine/simulator';
import type { Team, Player, MatchState, SaveGame } from './engine/models';
import type { Season } from './engine/season';
import { exportSave, saveToLocal } from './engine/saveload';
import { Trophy, Download } from 'lucide-react';

type AppState = 'LOBBY' | 'SEASON' | 'TEAM' | 'MATCH';

function App() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [season, setSeason] = useState<Season | null>(null);
  const [viewState, setViewState] = useState<AppState>('LOBBY');
  const [leagueName, setLeagueName] = useState('My League');

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  interface PendingMatchIds {
    a: string;
    b: string;
    currentMatchIndex: number;
    playoffMatchId?: string;
    weekIndex?: number;
  }
  const [pendingMatchIds, setPendingMatchIds] = useState<PendingMatchIds | null>(null);

  const [myTeamId, setMyTeamId] = useState<string>('');

  const saveState = (currentTeams: Team[], currentSeason: Season, currentMyTeamId: string, currentLeagueName: string) => {
    const timestamp = new Date().toISOString();
    saveToLocal({
      version: 1,
      leagueName: currentLeagueName,
      myTeamId: currentMyTeamId,
      teams: currentTeams,
      season: currentSeason,
      savedAt: timestamp
    });
  };


  const processAIFrontOffice = (currentTeams: Team[], currentFA: Player[]): { updatedTeams: Team[], updatedFA: Player[] } => {
    let newTeams = [...currentTeams];
    let newFA = [...currentFA];

    newTeams = newTeams.map(team => {
      if (team.id === myTeamId) return team;
      if (team.players.length >= 14) return team; // Full roster

      // Calculate team salary
      const totalSalary = team.players.reduce((sum, p) => sum + (p.salary || 0), 0);
      const capSpace = team.salaryCap - totalSalary;

      // Simple AI logic: If less than 12 players, try to sign best FA they can afford
      if (team.players.length < 12 && newFA.length > 0) {
        const affordableFA = [...newFA]
          .filter(p => (p.salary || 50000) <= capSpace)
          .sort((a, b) => b.overall - a.overall);

        if (affordableFA.length > 0) {
          const recruit = affordableFA[0];
          newFA = newFA.filter(p => p.id !== recruit.id);
          return { ...team, players: [...team.players, recruit] };
        }
      }
      return team;
    });

    return { updatedTeams: newTeams, updatedFA: newFA };
  };

  const handleLeagueStart = (newTeams: Team[], newMyTeamId: string, newLeagueName: string) => {
    const newSeason = createSeason(newTeams);
    setTeams(newTeams);
    setSeason(newSeason);
    setMyTeamId(newMyTeamId);
    setLeagueName(newLeagueName);
    setViewState('SEASON');
    saveState(newTeams, newSeason, newMyTeamId, newLeagueName);
  };

  const handleImportSave = (save: SaveGame) => {
    // Migration: Ensure all players have traits
    const migratePlayer = (p: Player) => {
      let traits = p.traits || [];
      if (traits.length === 0) {
        // Migration: give 1 random trait 30% of the time if missing
        traits = Math.random() > 0.7 ? [ALL_TRAITS[Math.floor(Math.random() * ALL_TRAITS.length)]] : [];
      } else if (traits.length > 1) {
        traits = [traits[0]];
      }

      // Initialize career stats if missing or incomplete
      const careerStats = p.careerStats || {
        seasons: 0,
        totalKills: 0,
        totalBlocks: 0,
        totalAces: 0,
        totalAssists: 0,
        mvps: 0,
        championships: 0
      };

      // Ensure new fields exist in careerStats
      if (careerStats.totalAces === undefined) careerStats.totalAces = 0;
      if (careerStats.totalAssists === undefined) careerStats.totalAssists = 0;

      return { ...p, traits, careerStats };
    };

    const migratedTeams = save.teams.map(t => ({
      ...t,
      players: t.players.map(p => migratePlayer(p))
    }));

    const migratedFA = (save.season.freeAgents || []).map((p: Player) => migratePlayer(p));
    const migratedSeason = { ...save.season, freeAgents: migratedFA };

    setTeams(migratedTeams);
    setSeason(migratedSeason);
    setMyTeamId(save.myTeamId);
    setLeagueName(save.leagueName);
    setViewState('SEASON');
  };

  const handleExportSave = () => {
    if (!season) return;
    exportSave(teams, season, myTeamId, leagueName);
  };

  const handleSelectTeam = (teamId: string) => {
    const t = teams.find(x => x.id === teamId);
    if (t) {
      setSelectedTeam(t);
      setViewState('TEAM');
    }
  };

  const handleUpdatePlayer = (playerId: string, updatedData: any) => {
    setTeams(prevTeams => {
      const nextTeams = prevTeams.map(t => {
        if (t.id === selectedTeam?.id) {
          if (playerId === 'TACTICS_UPDATE') {
            const newTeam = { ...t, tactics: updatedData };
            if (selectedTeam.id === newTeam.id) setSelectedTeam(newTeam);
            return newTeam;
          }
          const newPlayers = t.players.map(p => p.id === playerId ? updatedData : p);
          const newTeam = { ...t, players: newPlayers };
          if (selectedTeam.id === newTeam.id) setSelectedTeam(newTeam);
          return newTeam;
        }
        return t;
      });
      if (season) saveState(nextTeams, season, myTeamId, leagueName);
      return nextTeams;
    });
  };

  const handlePlayNextMatch = (matchIndexStr: string) => {
    if (!season) return;

    if (matchIndexStr === 'ADVANCE_WEEK') {
      let nextSeasonState = { ...season };
      let nextTeamsState = [...teams];

      if (season.week >= season.schedule.length) {
        // Start playoffs
        const sortedTeams = Object.entries(season.standings)
          .sort(([, a], [, b]) => {
            if ((b as any).points !== (a as any).points) return (b as any).points - (a as any).points;
            if ((b as any).wins !== (a as any).wins) return (b as any).wins - (a as any).wins;
            return ((b as any).setsWon - (b as any).setsLost) - ((a as any).setsWon - (a as any).setsLost);
          }).map(([id]) => id);

        const semis: any = [
          { id: 'SF1', teamAId: sortedTeams[0], teamBId: sortedTeams[3], isPlayed: false },
          { id: 'SF2', teamAId: sortedTeams[1], teamBId: sortedTeams[2], isPlayed: false }
        ];
        const finals: any = { id: 'F', teamAId: null, teamBId: null, isPlayed: false };
        nextSeasonState = { ...season, phase: 'PLAYOFFS', playoffs: { semis, finals } };
      } else {
        // Apply age progression at end of season
        const isEndOfSeason = season.week >= season.schedule.length - 1;
        if (isEndOfSeason) {
          nextTeamsState = teams.map(team => ({
            ...team,
            players: team.players.map(p => applyAgeProgression(p))
          }));
        }

        // Injury Recovery Logic
        nextTeamsState = nextTeamsState.map(team => ({
          ...team,
          players: team.players.map(p => {
            if (p.injury) {
              const weeksLeft = p.injury.weeksLeft - 1;
              if (weeksLeft <= 0) return { ...p, injury: undefined };
              return { ...p, injury: { ...p.injury, weeksLeft } };
            }
            return p;
          })
        }));

        const nextFreeAgents = (season.freeAgents || []).map(p => {
          if (p.injury) {
            const weeksLeft = p.injury.weeksLeft - 1;
            if (weeksLeft <= 0) return { ...p, injury: undefined };
            return { ...p, injury: { ...p.injury, weeksLeft } };
          }
          return p;
        });

        const { updatedTeams: aiTeams, updatedFA } = processAIFrontOffice(nextTeamsState, nextFreeAgents);
        nextTeamsState = aiTeams;
        nextSeasonState = { ...season, week: season.week + 1, freeAgents: updatedFA };
        setTeams(nextTeamsState);
      }
      setSeason(nextSeasonState);
      saveState(nextTeamsState, nextSeasonState, myTeamId, leagueName);
      return;
    }

    if (matchIndexStr.startsWith('PLAYOFF_')) {
      const id = matchIndexStr.replace('PLAYOFF_', '');
      let match: any;
      if (season.playoffs?.semis[0].id === id) match = season.playoffs.semis[0];
      if (season.playoffs?.semis[1].id === id) match = season.playoffs.semis[1];
      if (season.playoffs?.finals.id === id) match = season.playoffs.finals;

      if (match && match.teamAId && match.teamBId) {
        setPendingMatchIds({ a: match.teamAId, b: match.teamBId, currentMatchIndex: -1, playoffMatchId: id });
        setViewState('MATCH');
      }
      return;
    }

    if (matchIndexStr.startsWith('PLAYOFFS-')) {
      const parts = matchIndexStr.split('-');
      const stage = parts[1]; // SEMIS or FINALS
      const idx = parseInt(parts[2]);

      let match: any = null;
      if (stage === 'SEMIS') match = season.playoffs?.semis[idx];
      if (stage === 'FINALS') match = season.playoffs?.finals;

      if (match && match.teamAId && match.teamBId) {
        setPendingMatchIds({
          a: match.teamAId,
          b: match.teamBId,
          currentMatchIndex: -1,
          playoffMatchId: stage === 'SEMIS' ? `SF${idx + 1}` : 'FINALS'
        });
        setViewState('MATCH');
      }
      return;
    }

    if (matchIndexStr === 'FEATURED') {
      const weekMatches = season.schedule[season.week - 1];
      const featuredIdx = weekMatches.findIndex(m => m.teamAId === myTeamId || m.teamBId === myTeamId);
      if (featuredIdx !== -1) {
        const match = weekMatches[featuredIdx];
        setPendingMatchIds({ a: match.teamAId, b: match.teamBId, currentMatchIndex: featuredIdx });
        setViewState('MATCH');
      }
      return;
    }

    // Handle "W-M" format
    if (matchIndexStr.includes('-')) {
      const [wIdx, mIdx] = matchIndexStr.split('-').map(Number);
      const match = season.schedule[wIdx][mIdx];
      setPendingMatchIds({ a: match.teamAId, b: match.teamBId, currentMatchIndex: mIdx, weekIndex: wIdx });
      setViewState('MATCH');
      return;
    }

    const idx = parseInt(matchIndexStr);
    const match = season.schedule[season.week - 1][idx];
    setPendingMatchIds({ a: match.teamAId, b: match.teamBId, currentMatchIndex: idx });
    setViewState('MATCH');
  };

  const handleMatchExit = (result: MatchState) => {
    if (!season || !pendingMatchIds) {
      setViewState('SEASON');
      return;
    }

    if (result.gameOver && result.winnerId) {
      const s = { ...season };

      // Update cumulative and CAREER stats for all match exits
      const updatedTeams = teams.map(team => ({
        ...team,
        players: team.players.map(p => {
          const stats = result.playerStats[p.id];
          if (!stats) return p;

          const curCareer = p.careerStats || { seasons: 0, totalKills: 0, totalBlocks: 0, totalAces: 0, totalAssists: 0, mvps: 0, championships: 0 };
          return {
            ...p,
            careerStats: {
              ...curCareer,
              totalKills: curCareer.totalKills + stats.kills,
              totalBlocks: curCareer.totalBlocks + stats.blocks,
              totalAces: (curCareer.totalAces || 0) + stats.aces,
              totalAssists: (curCareer.totalAssists || 0) + stats.assists
            }
          };
        })
      }));

      if (pendingMatchIds.playoffMatchId && s.playoffs) {
        const pId = pendingMatchIds.playoffMatchId;
        const match = pId === 'SF1' ? s.playoffs.semis[0] : (pId === 'SF2' ? s.playoffs.semis[1] : s.playoffs.finals);
        match.isPlayed = true;
        match.winnerId = result.winnerId;
        match.score = `${result.setsA}-${result.setsB}`;
        match.setScores = result.setScores;

        if (pId === 'SF1' || pId === 'SF2') {
          if (s.playoffs.semis[0].isPlayed && s.playoffs.semis[1].isPlayed) {
            s.playoffs.finals.teamAId = s.playoffs.semis[0].winnerId || null;
            s.playoffs.finals.teamBId = s.playoffs.semis[1].winnerId || null;
          }
        } else if (pId === 'F') {
          s.phase = 'OFFSEASON';
          // Calculate final awards
          s.awards = calculateSeasonAwards(s, updatedTeams);
        }
      } else {
        const weekMatches = s.schedule[s.week - 1];
        const matchRecord = weekMatches[pendingMatchIds.currentMatchIndex];

        matchRecord.isPlayed = true;
        matchRecord.winnerId = result.winnerId;
        matchRecord.score = `${result.setsA}-${result.setsB}`;
        matchRecord.setScores = result.setScores;

        const loserId = result.winnerId === result.teamAId ? result.teamBId : result.teamAId;
        s.standings[result.winnerId].wins += 1;
        s.standings[result.winnerId].points += 3;
        s.standings[loserId].losses += 1;
        s.standings[result.teamAId].setsWon += result.setsA;
        s.standings[result.teamAId].setsLost += result.setsB;
        s.standings[result.teamBId].setsWon += result.setsB;
        s.standings[result.teamBId].setsLost += result.setsA;

        // Update cumulative stats
        Object.entries(result.playerStats).forEach(([pId, stats]) => {
          if (!s.cumulativeStats![pId]) {
            s.cumulativeStats![pId] = {
              kills: stats.kills,
              errors: stats.errors,
              attempts: stats.attempts,
              blocks: stats.blocks,
              digs: stats.digs,
              aces: stats.aces,
              assists: stats.assists,
              passes: stats.passes,
              gamesPlayed: 1,
              performanceScore: stats.performanceScore
            };
          } else {
            const cur = s.cumulativeStats![pId];
            cur.kills += stats.kills;
            cur.errors += stats.errors;
            cur.attempts += stats.attempts;
            cur.blocks += stats.blocks;
            cur.digs += stats.digs;
            cur.aces += stats.aces;
            cur.assists += stats.assists;
            cur.passes += stats.passes;
            cur.gamesPlayed += 1;
            cur.performanceScore += stats.performanceScore;
          }
        });

        // Championship MVP logic
        if (pendingMatchIds.playoffMatchId === 'F' && result.winnerId) {
          s.awards!.champMVP = result.matchMVP;
        }
      }

      s.achievements = checkAchievements(s, myTeamId || '', result);

      setTeams(updatedTeams);
      setSeason(s);
      // Auto-save to local storage
      saveToLocal({
        version: 1,
        leagueName,
        myTeamId,
        teams: updatedTeams,
        season: s,
        savedAt: new Date().toISOString()
      });
    }

    setPendingMatchIds(null);
    setViewState('SEASON');
  };

  const handleStartNextSeason = () => {
    if (!season) return;

    // 1. Archive previous season
    const winnerId = season.playoffs?.finals.winnerId || '';
    const mvpId = season.awards?.mvp || '';
    const runnerUpId = season.playoffs ? (season.playoffs.finals.teamAId === winnerId ? season.playoffs.finals.teamBId : season.playoffs.finals.teamAId) : '';

    const newHistoryEntry: any = {
      year: season.year,
      championId: winnerId,
      mvpId: mvpId,
      runnerUpId: runnerUpId || ''
    };

    const newHistory = [...season.history, newHistoryEntry];

    // 2. Update Career Metadata for ALL players in all teams
    const updatedTeams = teams.map(team => ({
      ...team,
      players: team.players.map(p => {
        const currentCareer = p.careerStats || { seasons: 0, totalKills: 0, totalBlocks: 0, totalAces: 0, totalAssists: 0, mvps: 0, championships: 0 };

        return {
          ...applyAgeProgression(p), // Handle age & regression/progression
          careerStats: {
            ...currentCareer, // Keep the real-time accumulated stats
            seasons: currentCareer.seasons + 1,
            mvps: currentCareer.mvps + (p.id === mvpId ? 1 : 0),
            championships: currentCareer.championships + (team.id === winnerId ? 1 : 0)
          }
        };
      })
    }));

    // 3. Create New Season
    const nextSeason = createSeason(updatedTeams, season.year + 1, newHistory);

    setTeams(updatedTeams);
    setSeason(nextSeason);
    setViewState('SEASON');

    // Auto-save
    saveToLocal({
      version: 1,
      leagueName,
      myTeamId,
      teams: updatedTeams,
      season: nextSeason,
      savedAt: new Date().toISOString()
    });
  };

  const handleSimulateAll = () => {
    if (!season) return;
    const s = { ...season };
    const weekMatches = [...s.schedule[s.week - 1]];
    let currentTeams = [...teams];

    for (let i = 0; i < weekMatches.length; i++) {
      const match = weekMatches[i];
      if (match.isPlayed) continue;

      const tA = currentTeams.find(t => t.id === match.teamAId)!;
      const tB = currentTeams.find(t => t.id === match.teamBId)!;

      const state = createMatch(tA, tB);
      let safety = 0;
      while (!state.gameOver && safety < 50000) {
        advanceRallyLoop(state, tA, tB);
        safety++;
      }

      match.isPlayed = true;
      match.winnerId = state.winnerId;
      match.score = `${state.setsA}-${state.setsB}`;
      match.setScores = state.setScores;

      if (state.winnerId) {
        const loserId = state.winnerId === state.teamAId ? state.teamBId : state.teamAId;
        s.standings[state.winnerId].wins += 1;
        s.standings[state.winnerId].points += 3;
        s.standings[loserId].losses += 1;
        s.standings[state.teamAId].setsWon += state.setsA;
        s.standings[state.teamAId].setsLost += state.setsB;
        s.standings[state.teamBId].setsWon += state.setsB;
        s.standings[state.teamBId].setsLost += state.setsA;

        // Update cumulative and CAREER stats for simulated
        currentTeams = currentTeams.map(team => ({
          ...team,
          players: team.players.map(p => {
            const stats = state.playerStats[p.id];
            if (!stats) return p;

            const curCareer = p.careerStats || { seasons: 0, totalKills: 0, totalBlocks: 0, totalAces: 0, totalAssists: 0, mvps: 0, championships: 0 };
            return {
              ...p,
              careerStats: {
                ...curCareer,
                totalKills: curCareer.totalKills + stats.kills,
                totalBlocks: curCareer.totalBlocks + stats.blocks,
                totalAces: (curCareer.totalAces || 0) + stats.aces,
                totalAssists: (curCareer.totalAssists || 0) + stats.assists
              }
            };
          })
        }));

        Object.entries(state.playerStats).forEach(([pId, stats]) => {
          if (!s.cumulativeStats![pId]) {
            s.cumulativeStats![pId] = {
              kills: stats.kills,
              errors: stats.errors,
              attempts: stats.attempts,
              blocks: stats.blocks,
              digs: stats.digs,
              aces: stats.aces,
              assists: stats.assists,
              passes: stats.passes,
              gamesPlayed: 1,
              performanceScore: stats.performanceScore
            };
          } else {
            const cur = s.cumulativeStats![pId];
            cur.kills += stats.kills;
            cur.errors += stats.errors;
            cur.attempts += stats.attempts;
            cur.blocks += stats.blocks;
            cur.digs += stats.digs;
            cur.aces += stats.aces;
            cur.assists += stats.assists;
            cur.passes += stats.passes;
            cur.gamesPlayed += 1;
            cur.performanceScore += stats.performanceScore;
          }
        });
      }
    }

    s.schedule[s.week - 1] = weekMatches;
    setTeams(currentTeams);
    setSeason(s);
    saveState(currentTeams, s, myTeamId, leagueName);
  };

  const handleLineupChange = (newStarters: Team['starters']) => {
    if (!pendingMatchIds) return;
    setTeams(prev => prev.map(t => {
      if (t.id === myTeamId) return { ...t, starters: newStarters };
      return t;
    }));
  };

  const handleTacticChange = (teamId: string, tactic: string, value: any) => {
    const updatedTeams = teams.map(t => {
      if (t.id === teamId) {
        return {
          ...t,
          tactics: {
            ...t.tactics,
            [tactic]: value
          }
        };
      }
      return t;
    });
    setTeams(updatedTeams);

    // Auto-save tactics change
    if (season) {
      saveToLocal({
        version: 1,
        leagueName,
        myTeamId,
        teams: updatedTeams,
        season,
        savedAt: new Date().toISOString()
      });
    }
  };

  const handleTransferPlayer = (action: 'SIGN' | 'RELEASE', player: Player) => {
    if (!season || !selectedTeam) return;
    const s = { ...season };
    const teamId = selectedTeam.id;

    if (action === 'RELEASE') {
      s.freeAgents = [...(s.freeAgents || []), player];
      setTeams(prevTeams => prevTeams.map(t => {
        if (t.id === teamId) {
          const newTeam = { ...t, players: t.players.filter(p => p.id !== player.id) };
          if (selectedTeam.id === newTeam.id) setSelectedTeam(newTeam);
          return newTeam;
        }
        return t;
      }));
    } else if (action === 'SIGN') {
      s.freeAgents = (s.freeAgents || []).filter(p => p.id !== player.id);
      setTeams(prevTeams => prevTeams.map(t => {
        if (t.id === teamId) {
          const newTeam = { ...t, players: [...t.players, player] };
          if (selectedTeam.id === newTeam.id) setSelectedTeam(newTeam);
          return newTeam;
        }
        return t;
      }));
    }

    setSeason(s);
  };

  if (viewState === 'LOBBY') {
    return (
      <LeagueCreator
        onStart={handleLeagueStart}
        onImport={handleImportSave}
      />
    );
  }

  if (!season) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Premium Header / Navigation */}
      <div className="bg-slate-800/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setViewState('LOBBY')}
        >
          <div className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl group-hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all transform group-hover:scale-110">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase leading-none">Volleyball GM</h1>
            <p className="text-[10px] font-bold text-blue-400/60 tracking-[0.2em] uppercase mt-1">Management Simulation</p>
          </div>
        </div>

        {viewState === 'SEASON' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportSave}
              className="group flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-xl border border-white/5 transition-all text-slate-300"
            >
              <Download className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
              Export Data
            </button>
          </div>
        )}
      </div>

      <div className="pt-4 pb-20">
        {viewState === 'SEASON' && (
          <SeasonView
            season={season}
            teams={teams}
            myTeamId={myTeamId}
            leagueName={leagueName}
            onSelectTeam={handleSelectTeam}
            onPlayNextMatch={handlePlayNextMatch}
            onSimulateAll={handleSimulateAll}
            onTacticChange={handleTacticChange}
            onStartNextSeason={handleStartNextSeason}
          />
        )}

        {viewState === 'TEAM' && selectedTeam && (
          <TeamView
            team={selectedTeam}
            allTeams={teams}
            freeAgents={season.freeAgents || []}
            isMyTeam={selectedTeam.id === myTeamId}
            onBack={() => setViewState('SEASON')}
            onUpdatePlayer={handleUpdatePlayer}
            onTransferPlayer={handleTransferPlayer}
            season={season}
          />
        )}

        {viewState === 'MATCH' && pendingMatchIds && (
          <MatchView
            teamA={teams.find(t => t.id === pendingMatchIds.a)!}
            teamB={teams.find(t => t.id === pendingMatchIds.b)!}
            onExit={handleMatchExit}
            isSimulated={pendingMatchIds.a !== myTeamId && pendingMatchIds.b !== myTeamId && pendingMatchIds.currentMatchIndex !== -1}
            isMyTeamA={pendingMatchIds.a === myTeamId ? true : (pendingMatchIds.b === myTeamId ? false : undefined)}
            onLineupChange={handleLineupChange}
          />
        )}
      </div>
    </div>
  );
}

function calculateSeasonAwards(season: Season, teams: Team[]) {
  const allPlayers = teams.flatMap(t => t.players);
  const stats = season.cumulativeStats || {};

  const getScore = (pId: string) => {
    const p = stats[pId];
    if (!p) return 0;
    return (p.kills * 3) + (p.blocks * 4) + (p.aces * 4) + (p.digs * 1.5) + (p.assists * 1) + (p.passes * 0.5) - (p.errors * 2);
  };

  const sortedByScore = [...allPlayers].sort((a, b) => getScore(b.id) - getScore(a.id));

  const bestByPos = (pos: string) =>
    [...allPlayers].filter(p => p.position === pos)
      .sort((a, b) => getScore(b.id) - getScore(a.id))[0]?.id || '';

  return {
    mvp: sortedByScore[0]?.id || '',
    bestSetter: bestByPos('S'),
    bestHitter: bestByPos('OH') || bestByPos('OPP'),
    bestMB: bestByPos('MB'),
    bestLibero: bestByPos('L')
  };
}

function checkAchievements(season: Season, myTeamId: string, lastMatch: MatchState) {
  const achievements = season.achievements || [];
  const myTeamWon = lastMatch.winnerId === myTeamId;

  const add = (id: string, title: string, desc: string) => {
    if (!achievements.find(a => a.id === id)) {
      achievements.push({ id, title, description: desc, unlockedAt: new Date().toISOString() });
    }
  };

  if (myTeamWon) {
    add('FIRST_WIN', 'First Taste of Glory', 'Won your first match as a manager.');
  }

  if (season.phase === 'OFFSEASON' && season.playoffs?.finals.winnerId === myTeamId) {
    add('CHAMPION', 'World Class', 'Won the league championship!');
  }

  return achievements;
}

export default App;
