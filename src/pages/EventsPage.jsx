import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Search, Calendar, Clock, Award, Star, Info, Gamepad2, Compass } from 'lucide-react';
import './EventsPage.css';

const EventsPage = () => {
  const { events, participants } = useContext(AppContext);
  const [activeFilter, setActiveFilter] = useState('all'); // all, upcoming, in_progress, completed
  const [searchTerm, setSearchTerm] = useState('');

  // Get participant name by ID
  const getPlayerName = (id) => {
    return participants.find(p => p.id === id)?.name || id;
  };

  // Sort and filter events
  const filteredEvents = events.filter(evt => {
    // Status filter
    if (activeFilter !== 'all' && evt.status !== activeFilter) return false;
    
    // Search filter
    const matchesSearch = 
      evt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }).sort((a, b) => {
    // Sort logic: In progress first, then upcoming, then completed
    const statusWeight = {
      'in_progress': 1,
      'upcoming': 2,
      'completed': 3
    };
    if (statusWeight[a.status] !== statusWeight[b.status]) {
      return statusWeight[a.status] - statusWeight[b.status];
    }
    // Secondary sort by date
    return new Date(a.date) - new Date(b.date);
  });

  // Get sorted scores for a completed/in-progress event
  const getSortedEventScores = (scores) => {
    return Object.entries(scores)
      .map(([playerId, score]) => ({
        id: playerId,
        name: getPlayerName(playerId),
        score: Number(score) || 0
      }))
      .sort((a, b) => b.score - a.score);
  };

  // Render score badge inside cards
  const renderEventScoreboard = (evt) => {
    if (evt.status === 'upcoming') {
      return (
        <div className="upcoming-placeholder">
          <Info size={16} />
          <span>Scores will be posted once the tournament starts.</span>
        </div>
      );
    }

    const sortedScores = getSortedEventScores(evt.scores);
    const hasScores = sortedScores.some(s => s.score > 0);

    if (!hasScores && evt.status === 'in_progress') {
      return (
        <div className="upcoming-placeholder">
          <Clock size={16} className="text-amber" />
          <span>Event is live! Scores will be posted soon.</span>
        </div>
      );
    }

    return (
      <div className="event-scoreboard">
        <div className="scoreboard-title">Tournament Leaderboard</div>
        <div className="scoreboard-ranks">
          {sortedScores.map((scoreObj, idx) => {
            const isWinner = evt.status === 'completed' && idx < 3 && scoreObj.score > 0;
            let medalSymbol = '';
            let medalClass = '';
            
            if (isWinner) {
              if (idx === 0) { medalSymbol = '🥇'; medalClass = 'gold'; }
              if (idx === 1) { medalSymbol = '🥈'; medalClass = 'silver'; }
              if (idx === 2) { medalSymbol = '🥉'; medalClass = 'bronze'; }
            }

            return (
              <div 
                key={scoreObj.id} 
                className={`score-row-item ${medalClass} ${scoreObj.score === 0 ? 'zero-score' : ''}`}
              >
                <span className="player-rank-num">{idx + 1}</span>
                <span className="player-name-text">
                  {scoreObj.name} {medalSymbol}
                </span>
                <span className="player-score-pts">
                  {scoreObj.score} <span className="pts-suffix">pts</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Determine what type of icon to show based on name
  const getEventIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes('surf')) return <Compass className="evt-icon text-sky" />;
    if (n.includes('paddle') || n.includes('board')) return <Compass className="evt-icon text-sky" />;
    if (n.includes('card') || n.includes('crown') || n.includes('pitch') || n.includes('yours')) {
      return <Gamepad2 className="evt-icon text-orange" />;
    }
    return <Star className="evt-icon text-amber" />;
  };

  return (
    <div className="events-page container">
      {/* Page Header */}
      <div className="page-header text-center mb-4">
        <div className="header-subtitle">
          <Calendar size={16} /> Tournament Schedule
        </div>
        <h1>Olympic Events</h1>
        <p className="header-desc">
          Browse tournaments, schedule details, rules, and live scoreboards for beach matches and indoor card battles.
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div className="controls-panel glass-card mb-4">
        {/* Search */}
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search events (e.g. Surfing, Cards)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            id="event-search-input"
          />
        </div>

        {/* Filter Chips */}
        <div className="filter-chips">
          <button 
            className={`chip ${activeFilter === 'all' ? 'active' : ''}`} 
            onClick={() => setActiveFilter('all')}
            id="filter-btn-all"
          >
            All Events
          </button>
          <button 
            className={`chip chip-upcoming ${activeFilter === 'upcoming' ? 'active' : ''}`} 
            onClick={() => setActiveFilter('upcoming')}
            id="filter-btn-upcoming"
          >
            Upcoming
          </button>
          <button 
            className={`chip chip-progress ${activeFilter === 'in_progress' ? 'active' : ''}`} 
            onClick={() => setActiveFilter('in_progress')}
            id="filter-btn-progress"
          >
            In Progress
          </button>
          <button 
            className={`chip chip-completed ${activeFilter === 'completed' ? 'active' : ''}`} 
            onClick={() => setActiveFilter('completed')}
            id="filter-btn-completed"
          >
            Completed
          </button>
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="no-events glass-card text-center">
          <Compass size={48} className="no-events-icon animate-float" />
          <h3>No events match your criteria</h3>
          <p>Try searching for another term or clearing the status filter.</p>
        </div>
      ) : (
        <div className="events-grid">
          {filteredEvents.map(evt => {
            let statusBadge = <span className="badge badge-upcoming">Upcoming</span>;
            if (evt.status === 'in_progress') {
              statusBadge = <span className="badge badge-progress animate-pulse-subtle">In Progress</span>;
            } else if (evt.status === 'completed') {
              statusBadge = <span className="badge badge-completed">Completed</span>;
            }

            return (
              <article key={evt.id} className="event-card glass-card" id={`event-card-${evt.id}`}>
                {/* Card Top */}
                <div className="card-top">
                  <div className="card-icon-container">
                    {getEventIcon(evt.name)}
                  </div>
                  <div className="card-labels">
                    {statusBadge}
                    <div className="points-avail">
                      <Award size={14} />
                      <span>{evt.pointsAvailable} Max pts</span>
                    </div>
                  </div>
                </div>

                {/* Card Title & Desc */}
                <h3 className="event-name">{evt.name}</h3>
                <p className="event-description">{evt.description}</p>

                {/* Card Date & Time info */}
                <div className="event-schedule-info">
                  <div className="sched-item">
                    <Calendar size={14} />
                    <span>{evt.date}</span>
                  </div>
                  <div className="sched-item">
                    <Clock size={14} />
                    <span>{evt.time}</span>
                  </div>
                </div>

                {/* Scoreboard display */}
                <div className="scoreboard-container">
                  {renderEventScoreboard(evt)}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
