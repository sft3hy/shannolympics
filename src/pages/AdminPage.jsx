import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Lock, Unlock, Save, PlusCircle, Copy, Check, UploadCloud, RotateCcw, AlertTriangle, LogOut, Info, Database, Wifi, WifiOff, Terminal, HelpCircle } from 'lucide-react';
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

  // Supabase Sync states
  const [dbUrl, setDbUrl] = useState(supabaseConfig?.url || '');
  const [dbKey, setDbKey] = useState(supabaseConfig?.key || '');
  const [cloudSyncError, setCloudSyncError] = useState('');
  const [cloudSyncSuccess, setCloudSyncSuccess] = useState(false);
  const [showSqlSetup, setShowSqlSetup] = useState(false);

  // Sync inputs with config changes
  React.useEffect(() => {
    if (supabaseConfig) {
      setDbUrl(supabaseConfig.url || '');
      setDbKey(supabaseConfig.key || '');
    }
  }, [supabaseConfig]);

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
    const evt = events.find(e => e.id === eventId);
    if (evt) {
      setEventStatus(evt.status);
      setScores({ ...evt.scores });
      setScoreSaveSuccess(false);
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
    setDbUrl('');
    setDbKey('');
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
          <div className="login-icon">
            <Lock size={36} className="lock-icon" />
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

                {/* Save button */}
                <div className="mt-4">
                  <button type="submit" className="btn btn-accent w-full" id="save-scores-btn">
                    <Save size={16} /> Save Scorecard & Status
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

          {/* SUPABASE CLOUD DATABASE SYNC CONFIG CARD */}
          <section className="admin-section glass-card" id="admin-supabase-config">
            <div className="section-title">
              <Database size={20} />
              Real-Time Cloud Sync
            </div>

            {isCloudConnected ? (
              <div className="cloud-connected-panel">
                <div className="cloud-status-badge success mb-3">
                  <Wifi size={16} />
                  <span>CONNECTED TO CLOUD</span>
                </div>
                <p className="sync-desc mb-3">
                  Your standings and event scores are backing up and syncing globally in real-time. Changes will sync immediately across all devices!
                </p>
                <div className="config-indicator mb-4 text-xs">
                  <strong>Source:</strong> {supabaseConfig.isEnv ? 'Environment Variables (.env)' : 'Admin Dashboard Config'}
                </div>
                <button 
                  onClick={handleDisconnectCloudClick} 
                  className="btn btn-secondary w-full"
                  id="disconnect-cloud-btn"
                >
                  <WifiOff size={16} /> Disconnect Sync Database
                </button>
              </div>
            ) : (
              <div className="cloud-disconnected-panel">
                <div className="cloud-status-badge warning mb-3">
                  <WifiOff size={16} />
                  <span>OFFLINE MODE (LOCAL STORAGE)</span>
                </div>
                <p className="sync-desc mb-4">
                  Standings are currently saved in your browser's local cache. Connect a free Supabase cloud database to automatically sync scores to your phone and computer.
                </p>

                <form onSubmit={handleConnectCloud}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="db-url">Supabase Project URL</label>
                    <input 
                      type="url" 
                      id="db-url"
                      placeholder="https://your-project.supabase.co" 
                      className="form-input text-xs" 
                      value={dbUrl}
                      onChange={(e) => setDbUrl(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="db-key">Supabase Publishable Key</label>
                    <input 
                      type="password" 
                      id="db-key"
                      placeholder="eyJhbGciOi..." 
                      className="form-input text-xs" 
                      value={dbKey}
                      onChange={(e) => setDbKey(e.target.value)}
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary w-full"
                    disabled={isSyncing}
                    id="connect-cloud-btn"
                  >
                    {isSyncing ? (
                      <span className="spinner-loader animate-spin">🔄 Connecting...</span>
                    ) : (
                      <span className="flex items-center justify-center gap-1">
                        <Wifi size={16} /> Link & Sync Cloud
                      </span>
                    )}
                  </button>

                  {cloudSyncError && (
                    <div className="sync-banner error mt-2">
                      <AlertTriangle size={16} />
                      <span>{cloudSyncError}</span>
                    </div>
                  )}
                  {cloudSyncSuccess && (
                    <div className="sync-banner success mt-2">
                      <Check size={16} />
                      <span>Cloud connected and synchronized!</span>
                    </div>
                  )}
                </form>

                {/* Collapsible SQL helper */}
                <div className="sql-helper-wrapper mt-3">
                  <button 
                    type="button"
                    onClick={() => setShowSqlSetup(!showSqlSetup)}
                    className="btn btn-text w-full text-xs flex justify-between items-center"
                    style={{ padding: '0.4rem', justifyContent: 'space-between', display: 'flex', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)', fontWeight: '600' }}
                  >
                    <span className="flex items-center gap-1"><Terminal size={14} /> View SQL Setup Query</span>
                    <span>{showSqlSetup ? '▲' : '▼'}</span>
                  </button>
                  {showSqlSetup && (
                    <div className="sql-box mt-2">
                      <pre className="text-xxs p-2 bg-dark rounded border text-left" style={{ overflowX: 'auto', background: 'rgba(15, 23, 42, 0.9)', color: '#38bdf8', fontSize: '0.7rem', padding: '0.5rem', borderRadius: '6px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
{`create table shannolympics_state (
  id integer primary key,
  events jsonb not null,
  activity jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table shannolympics_state enable row level security;

-- Create policies for anonymous access to row id=1
create policy "Allow public read" on shannolympics_state for select using (true);
create policy "Allow public insert" on shannolympics_state for insert with check (id = 1);
create policy "Allow public update" on shannolympics_state for update using (id = 1) with check (id = 1);`}
                      </pre>
                      <p className="text-xxs text-muted mt-1" style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textAlign: 'left' }}>
                        Paste this into your Supabase SQL Editor and click **Run**.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* CLOUD DATA BACKUP SYNC */}
          <section className="admin-section glass-card" id="admin-sync-util">
            <div className="section-title">
              <UploadCloud size={20} />
              Cross-Device Data Sync
            </div>

            <p className="sync-desc mb-4">
              Since scores save locally, you can backup or sync scores across devices. Copy your data block or import one!
            </p>

            <div className="sync-row">
              <button onClick={handleCopyToClipboard} className="btn btn-secondary w-full" id="export-btn">
                {copySuccess ? <Check size={16} className="text-green" /> : <Copy size={16} />}
                {copySuccess ? 'Copied Data Block!' : 'Export & Copy Data'}
              </button>
            </div>

            <form onSubmit={handleImportData} className="mt-4">
              <div className="form-group">
                <label className="form-label" htmlFor="import-data-ta">Paste Data to Synchronize</label>
                <textarea
                  id="import-data-ta"
                  className="form-textarea text-xs"
                  rows={3}
                  placeholder='Paste data block here...'
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary w-full" id="import-btn">
                <UploadCloud size={16} /> Sync paste data
              </button>
              {syncStatus.message && (
                <div className={`sync-banner mt-2 ${syncStatus.type === 'success' ? 'success' : 'error'}`}>
                  {syncStatus.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
                  <span>{syncStatus.message}</span>
                </div>
              )}
            </form>
          </section>

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
