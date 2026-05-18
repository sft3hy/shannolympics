import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Search, Calendar, Clock, Award, Star, Info, Gamepad2, Compass, X, MapPin } from 'lucide-react';
import './EventsPage.css';

const EventsPage = () => {
  const { events, participants } = useContext(AppContext);
  const [activeFilter, setActiveFilter] = useState('all'); // all, upcoming, in_progress, completed
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null); // Modal state

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
  });

  // Group filtered events by date
  const eventsByDate = {};
  filteredEvents.forEach(evt => {
    if (!eventsByDate[evt.date]) {
      eventsByDate[evt.date] = [];
    }
    eventsByDate[evt.date].push(evt);
  });

  // Get sorted unique dates
  const sortedDates = Object.keys(eventsByDate).sort();

  // Helper to format date to Weekday Name (e.g. Monday, Aug 3)
  const formatDayName = (dateStr) => {
    try {
      const date = new Date(dateStr + 'T00:00:00'); // Prevent timezone offset shift
      const weekday = date.toLocaleDateString(undefined, { weekday: 'long' });
      const dayDate = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return { weekday, dayDate };
    } catch (e) {
      return { weekday: 'Day', dayDate: dateStr };
    }
  };

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

  // Render scoreboard inside modal
  const renderEventScoreboard = (evt) => {
    if (evt.status === 'upcoming') {
      return (
        <div className="upcoming-placeholder py-4 text-center">
          <Info size={18} className="mx-auto mb-2 text-muted" />
          <p className="text-sm text-muted">This event hasn't started yet. Scores will be posted once play begins!</p>
        </div>
      );
    }

    const sortedScores = getSortedEventScores(evt.scores);
    const hasScores = sortedScores.some(s => s.score > 0);

    if (!hasScores && evt.status === 'in_progress') {
      return (
        <div className="upcoming-placeholder py-4 text-center">
          <Clock size={18} className="mx-auto mb-2 text-amber animate-pulse" />
          <p className="text-sm text-amber font-semibold">Event is currently In Progress! Check back soon for scores.</p>
        </div>
      );
    }

    return (
      <div className="event-scoreboard-modal mt-3">
        <h4 className="scoreboard-title mb-3">Live Standings</h4>
        <div className="scoreboard-ranks-list">
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
                <div className="flex items-center gap-2">
                  <span className="player-rank-num">{idx + 1}</span>
                  <span className="player-name-text font-bold">
                    {scoreObj.name} {medalSymbol}
                  </span>
                </div>
                <span className="player-score-pts font-bold">
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
    if (n.includes('corn')) return <Compass className="evt-icon text-amber" />;
    if (n.includes('bike')) return <Compass className="evt-icon text-green" />;
    if (n.includes('pickle')) return <Compass className="evt-icon text-teal" />;
    if (n.includes('bocce')) return <Compass className="evt-icon text-indigo" />;
    if (n.includes('egg')) return <Compass className="evt-icon text-yellow" />;
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
          <Calendar size={16} /> Week Schedule
        </div>
        <h1>Olympic Schedule</h1>
        <p className="header-desc">
          Events are slated daily between **10:00 AM** and **8:00 PM**. Select any event card below to view active scoreboards, rules, and placement standings.
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div className="controls-panel glass-card mb-4">
        {/* Search */}
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search events..." 
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

      {/* Calendar Grid Schedule */}
      {sortedDates.length === 0 ? (
        <div className="no-events glass-card text-center">
          <Compass size={48} className="no-events-icon animate-float" />
          <h3>No matching events found</h3>
          <p>Try resetting filters or typing another tournament game name.</p>
        </div>
      ) : (
        <div className="calendar-grid">
          {sortedDates.map(dateKey => {
            const { weekday, dayDate } = formatDayName(dateKey);
            const dayEvents = eventsByDate[dateKey];

            return (
              <div key={dateKey} className="calendar-day-card glass-card" id={`day-box-${dateKey}`}>
                {/* Day Header */}
                <div className="calendar-day-header">
                  <span className="calendar-day-name">{weekday}</span>
                  <span className="calendar-day-date">{dayDate}</span>
                </div>

                {/* Day Events Container */}
                <div className="calendar-day-events">
                  {dayEvents.map(evt => {
                    let statusClass = 'upcoming';
                    if (evt.status === 'in_progress') statusClass = 'in-progress';
                    if (evt.status === 'completed') statusClass = 'completed';

                    return (
                      <div 
                        key={evt.id} 
                        className={`calendar-event-item status-${statusClass}`}
                        onClick={() => setSelectedEvent(evt)}
                        style={{ cursor: 'pointer' }}
                        id={`event-item-${evt.id}`}
                      >
                        <div className="event-item-top">
                          <div className="event-item-icon">
                            {getEventIcon(evt.name)}
                          </div>
                          <span className={`mini-status-tag ${statusClass}`}>
                            {evt.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h4 className="event-item-title">{evt.name}</h4>
                        <div className="event-item-meta">
                          <Clock size={12} />
                          <span>{evt.time}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event Details and Scoreboard Modal Popup */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-card glass-card animate-zoom-in" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedEvent(null)}>
              <X size={20} />
            </button>

            {/* Modal Content */}
            <div className="modal-header-section">
              <div className="modal-icon-wrapper mb-3">
                {getEventIcon(selectedEvent.name)}
              </div>
              <div className="modal-meta-row flex gap-2 mb-2">
                <span className={`badge badge-${selectedEvent.status}`}>
                  {selectedEvent.status.replace('_', ' ')}
                </span>
                <span className="badge badge-points">
                  <Award size={12} /> {selectedEvent.pointsAvailable} Max pts
                </span>
              </div>
              <h2 className="modal-event-title">{selectedEvent.name}</h2>
            </div>

            <div className="modal-body-section">
              <div className="event-schedule-tray mb-3">
                <div className="tray-item">
                  <Calendar size={14} />
                  <span>{formatDayName(selectedEvent.date).weekday}, {formatDayName(selectedEvent.date).dayDate}</span>
                </div>
                <div className="tray-item">
                  <Clock size={14} />
                  <span>{selectedEvent.time}</span>
                </div>
                <div className="tray-item">
                  <MapPin size={14} />
                  <span>Outer Banks, NC</span>
                </div>
              </div>

              <div className="event-modal-desc mb-4">
                <h5>About the Event</h5>
                <p>{selectedEvent.description}</p>
              </div>

              {/* Scoreboard */}
              <div className="event-modal-scores pt-3 border-t">
                {renderEventScoreboard(selectedEvent)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
