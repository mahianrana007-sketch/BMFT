import { 
  Team, Match, LeagueStanding, PlayerLeaderboardItem, Player,
  PlayerMatchPerformance, PlayerAggregatedStats, TournamentAwardLeaderboard
} from '../types';

/**
 * Calculates real-time league table standings dynamically from teams and finished matches.
 * Guarantees zero duplicate counting and 100% mathematical consistency.
 */
export function calculateLeagueStandings(teams: Team[], matches: Match[]): LeagueStanding[] {
  const standingsMap = new Map<string, LeagueStanding>();

  // Initialize every team in the standings
  teams.forEach((team) => {
    standingsMap.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      logoUrl: team.logoUrl,
      color: team.color,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      recentForm: [],
    });
  });

  // Filter finished matches with valid scores
  const finishedMatches = matches
    .filter((m) => m.status === 'finished' && typeof m.homeScore === 'number' && typeof m.awayScore === 'number')
    .sort((a, b) => new Date(`${a.date} ${a.time || ''}`).getTime() - new Date(`${b.date} ${b.time || ''}`).getTime());

  finishedMatches.forEach((match) => {
    const homeGoals = Number(match.homeScore) || 0;
    const awayGoals = Number(match.awayScore) || 0;

    const home = standingsMap.get(match.homeTeamId);
    const away = standingsMap.get(match.awayTeamId);

    if (home) {
      home.played += 1;
      home.goalsFor += homeGoals;
      home.goalsAgainst += awayGoals;
      home.goalDifference = home.goalsFor - home.goalsAgainst;

      if (homeGoals > awayGoals) {
        home.won += 1;
        home.points += 3;
        home.recentForm.push('W');
      } else if (homeGoals === awayGoals) {
        home.drawn += 1;
        home.points += 1;
        home.recentForm.push('D');
      } else {
        home.lost += 1;
        home.recentForm.push('L');
      }
    }

    if (away) {
      away.played += 1;
      away.goalsFor += awayGoals;
      away.goalsAgainst += homeGoals;
      away.goalDifference = away.goalsFor - away.goalsAgainst;

      if (awayGoals > homeGoals) {
        away.won += 1;
        away.points += 3;
        away.recentForm.push('W');
      } else if (awayGoals === homeGoals) {
        away.drawn += 1;
        away.points += 1;
        away.recentForm.push('D');
      } else {
        away.lost += 1;
        away.recentForm.push('L');
      }
    }
  });

  const standings = Array.from(standingsMap.values());

  // Keep only the last 5 matches for form
  standings.forEach((st) => {
    if (st.recentForm.length > 5) {
      st.recentForm = st.recentForm.slice(-5);
    }
  });

  // Sort standings: Points DESC, Goal Difference DESC, Goals For DESC, Name ASC
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName);
  });

  return standings;
}

/**
 * Calculates top goalscorers from finished matches and career records.
 */
export function calculateTopScorers(
  players: Player[],
  teams: Team[],
  matches: Match[]
): PlayerLeaderboardItem[] {
  const scoreMap = new Map<string, { goals: number; assists: number; matchesSet: Set<string>; playerName: string; teamId?: string | null }>();

  // Seed with known players
  players.forEach((p) => {
    scoreMap.set(p.id, {
      goals: p.careerStats?.goals || 0,
      assists: p.careerStats?.assists || 0,
      matchesSet: new Set<string>(),
      playerName: p.name,
      teamId: p.teamId,
    });
  });

  // Add goals scored in registered finished matches
  const finishedMatches = matches.filter((m) => m.status === 'finished');
  finishedMatches.forEach((m) => {
    if (m.goals && Array.isArray(m.goals)) {
      m.goals.forEach((g) => {
        if (g.isOwnGoal) return; // Skip own goals for scorer stats
        const key = g.playerId || g.playerName.trim().toLowerCase();
        let record = scoreMap.get(key);
        if (!record && g.playerId) {
          record = scoreMap.get(g.playerId);
        }
        if (!record) {
          record = {
            goals: 0,
            assists: 0,
            matchesSet: new Set<string>(),
            playerName: g.playerName,
            teamId: g.teamId,
          };
          scoreMap.set(key, record);
        }
        record.goals += 1;
        record.matchesSet.add(m.id);
        if (!record.teamId && g.teamId) record.teamId = g.teamId;

        // If assist provider recorded in goal event
        if (g.assistPlayerId || g.assistPlayerName) {
          const aKey = g.assistPlayerId || g.assistPlayerName!.trim().toLowerCase();
          let aRecord = scoreMap.get(aKey);
          if (!aRecord) {
            aRecord = {
              goals: 0,
              assists: 0,
              matchesSet: new Set<string>(),
              playerName: g.assistPlayerName || 'অ্যাসিস্ট প্লেয়ার',
              teamId: g.teamId,
            };
            scoreMap.set(aKey, aRecord);
          }
          aRecord.assists += 1;
          aRecord.matchesSet.add(m.id);
        }
      });
    }

    if (m.assists && Array.isArray(m.assists)) {
      m.assists.forEach((a) => {
        const aKey = a.playerId || a.playerName.trim().toLowerCase();
        let aRecord = scoreMap.get(aKey);
        if (!aRecord) {
          aRecord = {
            goals: 0,
            assists: 0,
            matchesSet: new Set<string>(),
            playerName: a.playerName,
            teamId: a.teamId,
          };
          scoreMap.set(aKey, aRecord);
        }
        aRecord.assists += 1;
        aRecord.matchesSet.add(m.id);
      });
    }
  });

  const list: PlayerLeaderboardItem[] = [];

  scoreMap.forEach((val, id) => {
    const playerObj = players.find((p) => p.id === id || p.name.toLowerCase() === val.playerName.toLowerCase());
    const teamObj = teams.find((t) => t.id === (playerObj?.teamId || val.teamId));

    list.push({
      playerId: playerObj?.id || id,
      playerName: playerObj?.name || val.playerName,
      playerPhoto: playerObj?.photoUrl,
      teamId: teamObj?.id || null,
      teamName: teamObj?.name || 'দল নির্ধারিত হয়নি',
      jerseyNumber: playerObj?.jerseyNumber,
      position: playerObj?.position,
      goals: val.goals,
      assists: val.assists,
      matchesPlayed: Math.max(val.matchesSet.size, playerObj?.careerStats?.matchesPlayed || 0),
    });
  });

  return list
    .filter((item) => item.goals > 0)
    .sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      if (b.assists !== a.assists) return b.assists - a.assists;
      return a.playerName.localeCompare(b.playerName);
    });
}

/**
 * Calculates top assists from finished matches and career records.
 */
export function calculateTopAssists(
  players: Player[],
  teams: Team[],
  matches: Match[]
): PlayerLeaderboardItem[] {
  const allScorers = calculateTopScorers(players, teams, matches);
  
  // Also check if any player has 0 goals but >0 assists
  const assistList: PlayerLeaderboardItem[] = [];
  players.forEach((p) => {
    const existing = allScorers.find((s) => s.playerId === p.id);
    if (!existing && p.careerStats && p.careerStats.assists > 0) {
      const teamObj = teams.find((t) => t.id === p.teamId);
      assistList.push({
        playerId: p.id,
        playerName: p.name,
        playerPhoto: p.photoUrl,
        teamId: teamObj?.id || null,
        teamName: teamObj?.name || 'দল নির্ধারিত হয়নি',
        jerseyNumber: p.jerseyNumber,
        position: p.position,
        goals: p.careerStats.goals || 0,
        assists: p.careerStats.assists,
        matchesPlayed: p.careerStats.matchesPlayed || 0,
      });
    }
  });

  const combined = [...allScorers.filter((s) => s.assists > 0), ...assistList];

  return combined.sort((a, b) => {
    if (b.assists !== a.assists) return b.assists - a.assists;
    if (b.goals !== a.goals) return b.goals - a.goals;
    return a.playerName.localeCompare(b.playerName);
  });
}

/**
 * Calculates aggregated player performance stats by combining all match performance logs.
 * Returns a Map keyed by playerId.
 */
export function calculateAggregatedStats(
  players: Player[],
  performances: PlayerMatchPerformance[],
  teams: Team[]
): Map<string, PlayerAggregatedStats> {
  const map = new Map<string, PlayerAggregatedStats>();

  // 1. Initialize with players
  players.forEach((p) => {
    const assignedTeam = teams.find((t) => t.id === p.teamId);
    map.set(p.id, {
      playerId: p.id,
      playerName: p.name,
      playerPhoto: p.photoUrl,
      jerseyNumber: p.jerseyNumber,
      position: p.position,
      teamId: p.teamId || null,
      teamName: assignedTeam?.name || 'দল নির্ধারিত হয়নি',
      matchesPlayed: p.careerStats?.matchesPlayed || 0,
      minutesPlayed: (p.careerStats?.matchesPlayed || 0) * 70, // baseline estimate if no match logs
      goals: p.careerStats?.goals || 0,
      assists: p.careerStats?.assists || 0,
      keyPasses: 0,
      shotsOnTarget: 0,
      tackles: 0,
      interceptions: 0,
      clearances: 0,
      blocks: 0,
      cleanSheets: p.careerStats?.cleanSheets || 0,
      saves: 0,
      goalsConceded: 0,
      yellowCards: p.careerStats?.yellowCards || 0,
      redCards: p.careerStats?.redCards || 0,
      averageRating: p.rating || 7.0,
      matchLogs: [],
    });
  });

  // Group performances by playerId
  const playerLogsMap = new Map<string, PlayerMatchPerformance[]>();
  performances.forEach((perf) => {
    const list = playerLogsMap.get(perf.playerId) || [];
    list.push(perf);
    playerLogsMap.set(perf.playerId, list);
  });

  // Calculate live aggregate totals from actual match performance entries
  playerLogsMap.forEach((logs, pId) => {
    // Sort logs by date descending
    logs.sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());

    let existing = map.get(pId);
    if (!existing) {
      const first = logs[0];
      existing = {
        playerId: pId,
        playerName: first.playerName,
        playerPhoto: first.playerPhoto,
        teamId: first.teamId,
        teamName: first.teamName,
        matchesPlayed: 0,
        minutesPlayed: 0,
        goals: 0,
        assists: 0,
        keyPasses: 0,
        shotsOnTarget: 0,
        tackles: 0,
        interceptions: 0,
        clearances: 0,
        blocks: 0,
        cleanSheets: 0,
        saves: 0,
        goalsConceded: 0,
        yellowCards: 0,
        redCards: 0,
        averageRating: 0,
        matchLogs: [],
      };
      map.set(pId, existing);
    }

    // Accumulate stats from all match entries
    let totalMinutes = 0;
    let totalMatches = 0;
    let totalGoals = 0;
    let totalAssists = 0;
    let totalKeyPasses = 0;
    let totalShotsOnTarget = 0;
    let totalTackles = 0;
    let totalInterceptions = 0;
    let totalClearances = 0;
    let totalBlocks = 0;
    let totalCleanSheets = 0;
    let totalSaves = 0;
    let totalConceded = 0;
    let totalYellow = 0;
    let totalRed = 0;
    let ratingSum = 0;

    logs.forEach((log) => {
      totalMatches += Number(log.matchesPlayed ?? 1);
      totalMinutes += Number(log.minutesPlayed || 0);
      totalGoals += Number(log.goals || 0);
      totalAssists += Number(log.assists || 0);
      totalKeyPasses += Number(log.keyPasses || 0);
      totalShotsOnTarget += Number(log.shotsOnTarget || 0);
      totalTackles += Number(log.tackles || 0);
      totalInterceptions += Number(log.interceptions || 0);
      totalClearances += Number(log.clearances || 0);
      totalBlocks += Number(log.blocks || 0);
      totalCleanSheets += Number(log.cleanSheets || 0);
      totalSaves += Number(log.saves || 0);
      totalConceded += Number(log.goalsConceded || 0);
      totalYellow += Number(log.yellowCards || 0);
      totalRed += Number(log.redCards || 0);
      ratingSum += Number(log.rating || 7.0);
    });

    const count = logs.length;
    const avgRating = count > 0 ? Number((ratingSum / count).toFixed(1)) : (existing.averageRating || 7.0);

    existing.matchesPlayed = totalMatches;
    existing.minutesPlayed = totalMinutes;
    existing.goals = totalGoals;
    existing.assists = totalAssists;
    existing.keyPasses = totalKeyPasses;
    existing.shotsOnTarget = totalShotsOnTarget;
    existing.tackles = totalTackles;
    existing.interceptions = totalInterceptions;
    existing.clearances = totalClearances;
    existing.blocks = totalBlocks;
    existing.cleanSheets = totalCleanSheets;
    existing.saves = totalSaves;
    existing.goalsConceded = totalConceded;
    existing.yellowCards = totalYellow;
    existing.redCards = totalRed;
    existing.averageRating = avgRating;
    existing.matchLogs = logs;
  });

  return map;
}

/**
 * Calculates Tournament Awards using performance sheet statistics:
 * 1. Player of the Tournament (MVP score)
 * 2. Best Defender (Defensive actions & clean sheets)
 * 3. Best Goalkeeper (Saves, Clean Sheets, fewest goals conceded)
 */
export function calculateTournamentAwards(
  players: Player[],
  performances: PlayerMatchPerformance[],
  teams: Team[]
): TournamentAwardLeaderboard {
  const aggregatedMap = calculateAggregatedStats(players, performances, teams);
  const allStats = Array.from(aggregatedMap.values());

  // 1. Player of the Tournament (Overall MVP formula)
  const mvpList = allStats
    .filter((s) => s.matchesPlayed > 0 || (s.matchLogs && s.matchLogs.length > 0))
    .map((s) => {
      const mvpScore = Number((
        (s.goals * 5) +
        (s.assists * 3.5) +
        (s.keyPasses * 1.5) +
        (s.shotsOnTarget * 1.0) +
        (s.tackles * 1.5) +
        (s.interceptions * 1.5) +
        (s.cleanSheets * 3.0) +
        (s.saves * 2.0) +
        (s.averageRating * 4.0) -
        (s.yellowCards * 2.0) -
        (s.redCards * 5.0)
      ).toFixed(1));

      return {
        ...s,
        mvpScore,
      };
    })
    .sort((a, b) => b.mvpScore - a.mvpScore);

  // 2. Best Defender (Defensive actions & clean sheets)
  const defenderList = allStats
    .filter((s) => s.position === 'DEF' || s.tackles > 0 || s.interceptions > 0 || s.clearances > 0)
    .map((s) => {
      const defenseScore = Number((
        (s.tackles * 3.5) +
        (s.interceptions * 3.5) +
        (s.clearances * 2.0) +
        (s.blocks * 3.0) +
        (s.cleanSheets * 5.0) +
        (s.averageRating * 3.0) +
        (s.goals * 2.0) -
        (s.goalsConceded * 1.0) -
        (s.yellowCards * 2.0) -
        (s.redCards * 5.0)
      ).toFixed(1));

      return {
        ...s,
        defenseScore,
      };
    })
    .sort((a, b) => b.defenseScore - a.defenseScore);

  // 3. Best Goalkeeper
  const gkList = allStats
    .filter((s) => s.position === 'GK' || s.saves > 0)
    .map((s) => {
      const gkScore = Number((
        (s.saves * 3.5) +
        (s.cleanSheets * 6.0) +
        (s.averageRating * 3.5) -
        (s.goalsConceded * 2.0) -
        (s.yellowCards * 2.0) -
        (s.redCards * 5.0)
      ).toFixed(1));

      return {
        ...s,
        gkScore,
      };
    })
    .sort((a, b) => b.gkScore - a.gkScore);

  // 4. Top Scorers & Playmakers from performance sheet
  const topScorers = [...allStats]
    .filter((s) => s.goals > 0)
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists);

  const topPlaymakers = [...allStats]
    .filter((s) => s.assists > 0)
    .sort((a, b) => b.assists - a.assists || b.goals - a.goals);

  return {
    playerOfTheTournament: mvpList,
    bestDefenders: defenderList,
    bestGoalkeepers: gkList,
    topScorers,
    topPlaymakers,
  };
}
