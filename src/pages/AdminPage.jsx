import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Lock, Unlock, Save, PlusCircle, Copy, Check, UploadCloud, RotateCcw, AlertTriangle, LogOut, Info, Database, Wifi, WifiOff, Terminal, HelpCircle, Trash2 } from 'lucide-react';
import logoImg from '../assets/shannolympics.png';
import './AdminPage.css';

const AdminPage = () => {
  const {
    participants,
    events,
    activity,
    isCloudConnected,
    supabaseConfig,
    isSyncing,
    connectCloud,
    disconnectCloud,
    updateEventScores,
    addEvent,
    deleteEvent,
    resetToDefault,
    importState
  } = useContext(AppContext);

  // Authenticate State
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('shannolympics_admin_auth') === 'true';
  });
  const [authError, setAuthError] = useState('');

  // Event delete confirmation state
  const [deleteConfirmEventId, setDeleteConfirmEventId] = useState(null);


  // Score editor states
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [eventStatus, setEventStatus] = useState('');
  const [scores, setScores] = useState({});
  const [scoreSaveSuccess, setScoreSaveSuccess] = useState(false);

  // Event creator states
  const [newEventName, setNewEventName] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventPoints, setNewEventPoints] = useState(10);
  const [newEventDate, setNewEventDate] = useState('2026-05-18');
  const [newEventTime, setNewEventTime] = useState('09:00 AM');
  const [eventCreateSuccess, setEventCreateSuccess] = useState(false);

  // Sync / Import states
  const [importJson, setImportJson] = useState('');
  const [syncStatus, setSyncStatus] = useState({ type: '', message: '' });
  const [copySuccess, setCopySuccess] = useState(false);

  // Reset confirmation
  const [resetConfirmCount, setResetConfirmCount] = useState(0);

  // Handle Authentication
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'shanno60') {
      sessionStorage.setItem('shannolympics_admin_auth', 'true');
      setIsAuthenticated(true);
      setAuthError('');
      // Initialize scores for first event
      const firstEvt = events.find(evt => evt.id === selectedEventId);
      if (firstEvt) {
        setEventStatus(firstEvt.status);
        setScores({ ...firstEvt.scores });
      }
    } else {
      setAuthError('Incorrect password! Keep guessing or check the beach rules.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('shannolympics_admin_auth');
    setIsAuthenticated(false);
    setPassword('');
  };

  // When selected event changes in dropdown
  const handleEventSelect = (eventId) => {
    setSelectedEventId(eventId);
    setDeleteConfirmEventId(null); // Reset delete confirmation
    const evt = events.find(e => e.id === eventId);
    if (evt) {
      setEventStatus(evt.status);
      setScores({ ...evt.scores });
      setScoreSaveSuccess(false);
    }
  };

  // Handle Event deletion
  const handleDeleteEventClick = (eventId) => {
    if (deleteConfirmEventId === eventId) {
      deleteEvent(eventId);
      setDeleteConfirmEventId(null);

      // Auto select the first remaining event
      const remainingEvents = events.filter(e => e.id !== eventId);
      if (remainingEvents.length > 0) {
        handleEventSelect(remainingEvents[0].id);
      } else {
        setSelectedEventId('');
      }
    } else {
      setDeleteConfirmEventId(eventId);
    }
  };

  // Setup score state if not yet loaded when selecting first event
  React.useEffect(() => {
    if (isAuthenticated && selectedEventId && Object.keys(scores).length === 0) {
      const evt = events.find(e => e.id === selectedEventId);
      if (evt) {
        setEventStatus(evt.status);
        setScores({ ...evt.scores });
      }
    }
  }, [isAuthenticated, selectedEventId, events]);

  // Handle slider/input score changes
  const handleScoreChange = (playerId, val) => {
    const numeric = Math.max(0, Number(val) || 0);
    setScores(prev => ({
      ...prev,
      [playerId]: numeric
    }));
    setScoreSaveSuccess(false);
  };

  // Save Event scores & status
  const handleSaveScores = (e) => {
    e.preventDefault();
    updateEventScores(selectedEventId, scores, eventStatus);
    setScoreSaveSuccess(true);
    setTimeout(() => setScoreSaveSuccess(false), 3000);
  };

  // Create Event
  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (!newEventName || !newEventDesc) {
      alert("Please fill out event name and description!");
      return;
    }

    addEvent({
      name: newEventName,
      description: newEventDesc,
      pointsAvailable: Number(newEventPoints) || 10,
      date: newEventDate,
      time: newEventTime
    });

    setEventCreateSuccess(true);
    setNewEventName('');
    setNewEventDesc('');
    setNewEventPoints(10);

    setTimeout(() => setEventCreateSuccess(false), 3000);
  };

  // Export full state
  const getExportData = () => {
    return JSON.stringify({
      participants,
      events,
      activity
    }, null, 2);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(getExportData())
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error("Clipboard fail: ", err);
      });
  };

  // Connect to Supabase Cloud Sync
  const handleConnectCloud = async (e) => {
    e.preventDefault();
    if (!dbUrl.trim() || !dbKey.trim()) {
      setCloudSyncError('Please enter both Supabase URL and Publishable API key.');
      return;
    }
    setCloudSyncError('');
    setCloudSyncSuccess(false);

    const result = await connectCloud(dbUrl.trim(), dbKey.trim());
    if (result.success) {
      setCloudSyncSuccess(true);
      setTimeout(() => setCloudSyncSuccess(false), 3000);
    } else {
      setCloudSyncError(result.error || 'Connection failed. Verify your Supabase settings.');
    }
  };

  // Unlink/Disconnect Supabase
  const handleDisconnectCloudClick = () => {
    disconnectCloud();
    setCloudSyncError('');
    setCloudSyncSuccess(false);
  };

  // Import full state
  const handleImportData = (e) => {
    e.preventDefault();
    if (!importJson.trim()) {
      setSyncStatus({ type: 'error', message: 'Please paste a valid JSON block first.' });
      return;
    }
    const res = importState(importJson);
    if (res.success) {
      setSyncStatus({ type: 'success', message: 'Data imported and synchronized!' });
      setImportJson('');
      // Recenter drop-down score editor
      if (events.length > 0) {
        setSelectedEventId(events[0].id);
        setScores({ ...events[0].scores });
        setEventStatus(events[0].status);
      }
    } else {
      setSyncStatus({ type: 'error', message: `Import error: ${res.error}` });
    }
    setTimeout(() => setSyncStatus({ type: '', message: '' }), 5000);
  };

  // Reset database safely
  const handleResetData = () => {
    if (resetConfirmCount === 0) {
      setResetConfirmCount(1);
    } else if (resetConfirmCount === 1) {
      resetToDefault();
      setResetConfirmCount(0);
      alert("Standings reset to initial OBX defaults.");
      // Recenter drops
      if (events.length > 0) {
        setSelectedEventId(events[0].id);
        setScores({ ...events[0].scores });
        setEventStatus(events[0].status);
      }
    }
  };

  // Render Password Gate
  if (!isAuthenticated) {
    return (
      <div className="admin-page container">
        <div className="login-wrapper glass-card text-center mt-4">
          <div className="login-logo-wrapper mb-3" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <img src={logoImg} alt="ShannOlympics Logo" className="login-logo animate-float" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
          </div>
          <h2>Beach Cabana Portal</h2>
          <p className="login-desc">
            Access to the ShannOlympics scorecard matrices requires administrative credentials.
          </p>

          <form onSubmit={handleLogin} className="login-form mt-4">
            <div className="form-group text-left">
              <label htmlFor="admin-pass" className="form-label">Cabana Password</label>
              <input
                type="password"
                id="admin-pass"
                className="form-input text-center"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            {authError && <div className="auth-error-msg"><AlertTriangle size={14} /> {authError}</div>}

            <button type="submit" className="btn btn-primary w-full mt-4" id="admin-login-btn">
              <Unlock size={16} /> Enter Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Active event configuration
  const currentEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="admin-page container">
      {/* Header */}
      <div className="admin-header mb-4">
        <div>
          <h1>Admin Cabana</h1>
          <p className="admin-subtitle">Update live leaderboard scores and manage tournament structures.</p>
        </div>
        <button className="btn btn-secondary btn-logout" onClick={handleLogout} id="admin-logout-btn">
          <LogOut size={16} /> Exit Cabana
        </button>
      </div>

      <div className="admin-grid">
        {/* SCORE MATRIX EDITOR CARD */}
        <section className="admin-section glass-card" id="admin-score-editor">
          <div className="section-title">
            <Save size={20} />
            Scoreboard Controller
          </div>

          <form onSubmit={handleSaveScores}>
            {/* Event Dropdown */}
            <div className="form-group">
              <label className="form-label" htmlFor="select-event-dd">Select Tournament</label>
              <select
                className="form-select"
                value={selectedEventId}
                onChange={(e) => handleEventSelect(e.target.value)}
                id="select-event-dd"
              >
                {events.map(evt => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name} ({evt.status})
                  </option>
                ))}
              </select>
            </div>

            {currentEvent && (
              <div className="current-event-panel">
                <p className="current-event-desc">
                  <strong>Description:</strong> {currentEvent.description}
                </p>
                <div className="current-event-meta">
                  <span><strong>Max Points:</strong> {currentEvent.pointsAvailable}</span>
                  <span><strong>Date:</strong> {currentEvent.date} {currentEvent.time}</span>
                </div>

                {/* Status selector */}
                <div className="form-group mt-4">
                  <label className="form-label">Event Status</label>
                  <div className="status-radio-group">
                    <label className={`status-radio-label ${eventStatus === 'upcoming' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="evt-status"
                        value="upcoming"
                        checked={eventStatus === 'upcoming'}
                        onChange={() => setEventStatus('upcoming')}
                      />
                      Upcoming
                    </label>
                    <label className={`status-radio-label ${eventStatus === 'in_progress' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="evt-status"
                        value="in_progress"
                        checked={eventStatus === 'in_progress'}
                        onChange={() => setEventStatus('in_progress')}
                      />
                      In Progress
                    </label>
                    <label className={`status-radio-label ${eventStatus === 'completed' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="evt-status"
                        value="completed"
                        checked={eventStatus === 'completed'}
                        onChange={() => setEventStatus('completed')}
                      />
                      Completed
                    </label>
                  </div>
                </div>

                {/* Participant matrix */}
                <div className="score-sliders-matrix mt-4">
                  <h4 className="matrix-title">Scores Per Participant</h4>
                  {participants.map(player => {
                    const playerScore = scores[player.id] !== undefined ? scores[player.id] : 0;
                    return (
                      <div key={player.id} className="matrix-row">
                        <span className="player-label">{player.name}</span>
                        <div className="slider-controls">
                          <input
                            type="range"
                            min="0"
                            max={currentEvent.pointsAvailable}
                            value={playerScore}
                            onChange={(e) => handleScoreChange(player.id, e.target.value)}
                            className="score-range-slider"
                            id={`slider-${player.id}`}
                          />
                          <input
                            type="number"
                            min="0"
                            max={currentEvent.pointsAvailable}
                            value={playerScore}
                            onChange={(e) => handleScoreChange(player.id, e.target.value)}
                            className="score-number-input"
                            id={`score-input-${player.id}`}
                          />
                          <span className="max-text">/ {currentEvent.pointsAvailable}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Save & Delete buttons */}
                <div className="mt-4" style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-accent" id="save-scores-btn" style={{ flex: 1 }}>
                    <Save size={16} /> Save Scorecard & Status
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEventClick(currentEvent.id)}
                    className={`btn flex items-center justify-center gap-1 ${deleteConfirmEventId === currentEvent.id ? 'btn-danger animate-pulse-subtle' : 'btn-secondary'
                      }`}
                    style={{
                      minWidth: deleteConfirmEventId === currentEvent.id ? '160px' : '120px',
                      borderColor: deleteConfirmEventId === currentEvent.id ? 'var(--color-red)' : 'var(--color-text-muted)',
                      color: deleteConfirmEventId === currentEvent.id ? 'white' : 'var(--color-red, #ef4444)',
                      padding: '0.6rem 1rem',
                      fontWeight: '600'
                    }}
                    id="delete-event-btn"
                  >
                    <Trash2 size={16} />
                    {deleteConfirmEventId === currentEvent.id ? 'Confirm Delete?' : 'Delete Event'}
                  </button>
                </div>
                {scoreSaveSuccess && (
                  <div className="success-banner mt-2">
                    <Check size={16} /> Standings and scorecard saved successfully!
                  </div>
                )}
              </div>
            )}
          </form>
        </section>

        {/* EVENT SCALER CARD & DATA PORTABILITY CARD */}
        <div className="admin-sidebar-grid">
          {/* CREATE EVENT CARD */}
          <section className="admin-section glass-card" id="admin-event-creator">
            <div className="section-title">
              <PlusCircle size={20} />
              Add Olympic Event
            </div>

            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label className="form-label" htmlFor="new-evt-name">Event Name</label>
                <input
                  type="text"
                  id="new-evt-name"
                  placeholder="e.g. Cornhole, Tug of War..."
                  className="form-input"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-evt-desc">Rules / Description</label>
                <textarea
                  id="new-evt-desc"
                  placeholder="Briefly explain point rules..."
                  className="form-textarea"
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="new-evt-pts">Max Points</label>
                  <input
                    type="number"
                    id="new-evt-pts"
                    min="1"
                    max="50"
                    className="form-input"
                    value={newEventPoints}
                    onChange={(e) => setNewEventPoints(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-evt-time">Time</label>
                  <input
                    type="text"
                    id="new-evt-time"
                    placeholder="e.g. 10:00 AM"
                    className="form-input"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-evt-date">Date</label>
                <input
                  type="date"
                  id="new-evt-date"
                  className="form-input"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary w-full" id="create-event-btn">
                <PlusCircle size={16} /> Create Event Card
              </button>
              {eventCreateSuccess && (
                <div className="success-banner mt-2">
                  <Check size={16} /> Event created and scheduled successfully!
                </div>
              )}
            </form>
          </section>

          {/* Removed Supabase Cloud Sync and Cross-Device Sync forms as credentials are fully auto-configured via .env */}

          {/* DANGER DESTRUCTION CONTROL */}
          <section className="admin-section glass-card border-red" id="admin-danger-util">
            <div className="section-title text-red">
              <RotateCcw size={20} />
              System Reset
            </div>
            <p className="danger-desc">
              Resets score standings and restores initial OBX beach/card game tournaments.
            </p>
            <button
              onClick={handleResetData}
              className={`btn w-full mt-2 ${resetConfirmCount > 0 ? 'btn-danger animate-pulse-subtle' : 'btn-secondary'}`}
              id="reset-btn"
            >
              <RotateCcw size={16} />
              {resetConfirmCount === 0 ? 'Reset Standings to Defaults' : 'Confirm Reset (Click Again!)'}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
