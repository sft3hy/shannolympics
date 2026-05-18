import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Award, ChevronDown, ChevronUp, Clock, Flame, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';
import './LeaderboardPage.css';

const LeaderboardPage = () => {
  const {
    participants,
    events,
    activity,
    getParticipantPoints,
    getParticipantMedals
  } = useContext(AppContext);

  // Accordion state to open detailed scorecard per player
  const [expandedPlayer, setExpandedPlayer] = useState(null);

  const toggleExpand = (playerId) => {
    if (expandedPlayer === playerId) {
      setExpandedPlayer(null);
    } else {
      setExpandedPlayer(playerId);
    }
  };

  // Compile leaderboard data
  const leaderboardData = participants.map(player => {
    const totalPoints = getParticipantPoints(player.id);
    const medals = getParticipantMedals(player.id);
    return {
      ...player,
      points: totalPoints,
      medals
    };
  }).sort((a, b) => b.points - a.points); // Sort descending by points

  // Identify podium (Top 3)
  const podium = [
    leaderboardData[1] || null, // 2nd Place (Left)
    leaderboardData[0] || null, // 1st Place (Center)
    leaderboardData[2] || null  // 3rd Place (Right)
  ];

  // Helper to format date
  const formatTime = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  // Helper to render rank badge
  const renderRankBadge = (rank) => {
    if (rank === 1) return <span className="rank-badge gold-bg">1st</span>;
    if (rank === 2) return <span className="rank-badge silver-bg">2nd</span>;
    if (rank === 3) return <span className="rank-badge bronze-bg">3rd</span>;
    return <span className="rank-badge normal-bg">{rank}th</span>;
  };

  // Get rank list of an event to show participant's performance
  const getPlayerEventPlacement = (eventId, playerId) => {
    const evt = events.find(e => e.id === eventId);
    if (!evt || evt.status === 'upcoming') return { points: '-', rankText: 'Upcoming', rankNum: 99 };
    
    const sorted = participants.map(p => ({
      id: p.id,
      score: Number(evt.scores[p.id]) || 0
    })).sort((a, b) => b.score - a.score);

    const playerIndex = sorted.findIndex(s => s.id === playerId);
    const playerScore = sorted.find(s => s.id === playerId)?.score || 0;

    if (playerIndex === 0 && playerScore > 0) return { points: playerScore, rankText: '🥇 1st', rankNum: 1 };
    if (playerIndex === 1 && playerScore > 0) return { points: playerScore, rankText: '🥈 2nd', rankNum: 2 };
    if (playerIndex === 2 && playerScore > 0) return { points: playerScore, rankText: '🥉 3rd', rankNum: 3 };
    
    // Check if score is 0
    if (playerScore === 0) return { points: 0, rankText: 'No score', rankNum: 10 };

    return { points: playerScore, rankText: `${playerIndex + 1}th`, rankNum: playerIndex + 1 };
  };

  return (
    <div className="leaderboard-page container">
      {/* Title */}
      <div className="page-header text-center mb-4">
        <div className="header-subtitle animate-pulse-subtle">
          <Flame size={16} className="flame-icon" /> Live Beach Standings
        </div>
        <h1>OBX Leaderboard</h1>
        <p className="header-desc">
          Tracking points, medals, and glory across all ShannOlympics beach tournaments & card matches!
        </p>
      </div>

      {/* Beach Podium Section */}
      {leaderboardData.length >= 3 && (
        <section className="podium-section glass-card mb-4" id="podium-card">
          <div className="podium-title">
            <Sparkles size={20} className="sparkle-icon" />
            Current Event Leaders
          </div>
          <div className="podium-container">
            {/* 2nd Place (Left) */}
            {podium[0] && (
              <div className="podium-spot spot-second">
                <div className="podium-avatar">
                  <div className="avatar-circle silver-border">{podium[0].name.substring(0,2).toUpperCase()}</div>
                  <Award className="medal-icon silver-medal" size={24} />
                </div>
                <div className="podium-name">{podium[0].name}</div>
                <div className="podium-score">{podium[0].points} pts</div>
                <div className="podium-pillar silver-pillar">
                  <span className="pillar-num">2</span>
                </div>
              </div>
            )}

            {/* 1st Place (Center) */}
            {podium[1] && (
              <div className="podium-spot spot-first">
                <div className="podium-avatar animate-float">
                  <div className="avatar-circle gold-border">{podium[1].name.substring(0,2).toUpperCase()}</div>
                  <Award className="medal-icon gold-medal" size={30} />
                </div>
                <div className="podium-name font-bold">{podium[1].name}</div>
                <div className="podium-score font-bold">{podium[1].points} pts</div>
                <div className="podium-pillar gold-pillar">
                  <span className="pillar-num">1</span>
                </div>
              </div>
            )}

            {/* 3rd Place (Right) */}
            {podium[2] && (
              <div className="podium-spot spot-third">
                <div className="podium-avatar">
                  <div className="avatar-circle bronze-border">{podium[2].name.substring(0,2).toUpperCase()}</div>
                  <Award className="medal-icon bronze-medal" size={24} />
                </div>
                <div className="podium-name">{podium[2].name}</div>
                <div className="podium-score">{podium[2].points} pts</div>
                <div className="podium-pillar bronze-pillar">
                  <span className="pillar-num">3</span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Main Leaderboard Grid */}
      <div className="leaderboard-grid">
        {/* Rankings Table Card */}
        <section className="rankings-section glass-card" id="rankings-card">
          <div className="section-title">
            <TrendingUp size={20} />
            Standings & scorecards
          </div>

          <div className="rankings-list">
            {leaderboardData.map((player, idx) => {
              const rank = idx + 1;
              const isExpanded = expandedPlayer === player.id;

              return (
                <div 
                  key={player.id} 
                  className={`player-rank-item ${isExpanded ? 'expanded' : ''}`}
                  id={`player-row-${player.id}`}
                >
                  {/* Summary Card Bar */}
                  <div className="player-summary-bar" onClick={() => toggleExpand(player.id)}>
                    <div className="rank-col">
                      {renderRankBadge(rank)}
                    </div>
                    
                    <div className="avatar-col">
                      <div className="avatar-badge">{player.name.charAt(0)}</div>
                    </div>

                    <div className="name-col">
                      <span className="player-name">{player.name}</span>
                      {/* Medal chips */}
                      <div className="medal-badges">
                        {player.medals.gold > 0 && (
                          <span className="mini-medal gold-text" title="Gold Medals">🥇 {player.medals.gold}</span>
                        )}
                        {player.medals.silver > 0 && (
                          <span className="mini-medal silver-text" title="Silver Medals">🥈 {player.medals.silver}</span>
                        )}
                        {player.medals.bronze > 0 && (
                          <span className="mini-medal bronze-text" title="Bronze Medals">🥉 {player.medals.bronze}</span>
                        )}
                      </div>
                    </div>

                    <div className="score-col">
                      <span className="score-value">{player.points}</span>
                      <span className="score-label">pts</span>
                    </div>

                    <div className="expand-col">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  {/* Expandable detailed scorecard tray */}
                  {isExpanded && (
                    <div className="player-detail-panel">
                      <div className="scorecard-header">Detailed Scorecard</div>
                      <div className="scorecard-grid">
                        {events.map(evt => {
                          const placement = getPlayerEventPlacement(evt.id, player.id);
                          let statusClass = 'status-tag-upcoming';
                          if (evt.status === 'in_progress') statusClass = 'status-tag-progress';
                          if (evt.status === 'completed') statusClass = 'status-tag-completed';

                          return (
                            <div key={evt.id} className="scorecard-row">
                              <div className="scorecard-evt-name">
                                {evt.name}
                                <span className={`status-mini-tag ${statusClass}`}>
                                  {evt.status.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="scorecard-evt-detail">
                                <span className="evt-score-badge">{placement.points} pts</span>
                                <span className="evt-placement-badge">{placement.rankText}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Live Activity Feed Card */}
        <section className="activity-section glass-card" id="activity-card">
          <div className="section-title">
            <Clock size={20} />
            Recent Activity
          </div>
          
          <div className="activity-list">
            {activity.length === 0 ? (
              <p className="no-activity">No recent activities recorded yet.</p>
            ) : (
              activity.map(item => (
                <div key={item.id} className="activity-item">
                  <div className="activity-marker"></div>
                  <div className="activity-content">
                    <p className="activity-msg">{item.message}</p>
                    <span className="activity-time">{formatTime(item.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LeaderboardPage;
