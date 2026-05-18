import React, { createContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_PARTICIPANTS, DEFAULT_EVENTS, DEFAULT_ACTIVITY } from '../utils/defaultData';
import { initSupabase, getSupabaseConfig } from '../utils/supabaseClient';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [participants] = useState(DEFAULT_PARTICIPANTS);
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [activity, setActivity] = useState(DEFAULT_ACTIVITY);
  
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [supabaseConfig, setSupabaseConfig] = useState(getSupabaseConfig());
  const [isSyncing, setIsSyncing] = useState(false);

  // Helper to load local storage as initial fallback
  useEffect(() => {
    const savedEvents = localStorage.getItem('shannolympics_events');
    const savedActivity = localStorage.getItem('shannolympics_activity');
    if (savedEvents) setEvents(JSON.parse(savedEvents));
    if (savedActivity) setActivity(JSON.parse(savedActivity));
  }, []);

  // Main sync function to pull from Supabase
  const fetchCloudState = useCallback(async (client) => {
    const supabase = client || initSupabase();
    if (!supabase) {
      setIsCloudConnected(false);
      return;
    }
    
    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from('shannolympics_state')
        .select('*')
        .eq('id', 1)
        .single();
        
      if (error) {
        // PGRST116 is single row empty result (row 1 not found but table exists)
        if (error.code === 'PGRST116') {
          await supabase.from('shannolympics_state').insert({
            id: 1,
            events: DEFAULT_EVENTS,
            activity: DEFAULT_ACTIVITY
          });
          setIsCloudConnected(true);
        } else if (error.code === 'PGRST125') {
          // Table 'shannolympics_state' is not found (PGRST125 invalid path)
          console.warn("Supabase Sync Notice: Table 'shannolympics_state' not found in public schema. Run the SQL Setup Query in Admin Panel to activate cloud sync.");
          setIsCloudConnected(false);
        } else {
          console.error('Error fetching Supabase state:', error);
          setIsCloudConnected(false);
        }
      } else if (data) {
        if (Array.isArray(data.events)) setEvents(data.events);
        if (Array.isArray(data.activity)) setActivity(data.activity);
        setIsCloudConnected(true);
      }
    } catch (e) {
      console.error('Network error connecting to cloud:', e);
      setIsCloudConnected(false);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Trigger initial database fetch on mount
  useEffect(() => {
    const supabase = initSupabase();
    if (supabase) {
      fetchCloudState(supabase);
    }
  }, [fetchCloudState, supabaseConfig]);

  // Main save helper to push state to Supabase + localStorage backup
  const pushState = useCallback(async (updatedEvents, updatedActivity) => {
    // Secondary local backup
    localStorage.setItem('shannolympics_events', JSON.stringify(updatedEvents));
    localStorage.setItem('shannolympics_activity', JSON.stringify(updatedActivity));

    const supabase = initSupabase();
    if (supabase && isCloudConnected) {
      try {
        const { error } = await supabase
          .from('shannolympics_state')
          .upsert({
            id: 1,
            events: updatedEvents,
            activity: updatedActivity,
            updated_at: new Date().toISOString()
          });
        if (error) {
          console.error('Failed to sync to Supabase:', error);
        }
      } catch (e) {
        console.error('Network error during cloud sync:', e);
      }
    }
  }, [isCloudConnected]);

  // Add an entry to the activity log and trigger save
  const logActivity = (message, currentEvents = events) => {
    const newEntry = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      message
    };
    
    setActivity(prev => {
      const updatedActivity = [newEntry, ...prev].slice(0, 50);
      pushState(currentEvents, updatedActivity);
      return updatedActivity;
    });
  };

  // Update scores for a single event
  const updateEventScores = (eventId, scores, status) => {
    setEvents(prevEvents => {
      const updated = prevEvents.map(evt => {
        if (evt.id === eventId) {
          const oldStatus = evt.status;
          const statusText = status !== oldStatus ? ` marked as ${status}` : ' scores updated';
          
          let podiumMsg = '';
          if (status === 'completed') {
            const sortedPlayers = [...DEFAULT_PARTICIPANTS]
              .map(p => ({ name: p.name, score: Number(scores[p.id]) || 0 }))
              .sort((a, b) => b.score - a.score);
            
            if (sortedPlayers[0].score > 0) {
              podiumMsg = ` (1st: ${sortedPlayers[0].name} - ${sortedPlayers[0].score} pts)`;
            }
          }

          // Delay activity log slightly so state update is batched
          setTimeout(() => {
            logActivity(`Event "${evt.name}"${statusText}${podiumMsg}.`, updated);
          }, 50);

          return { ...evt, scores, status };
        }
        return evt;
      });
      
      // Save locally immediately
      localStorage.setItem('shannolympics_events', JSON.stringify(updated));
      return updated;
    });
  };

  // Add a new event
  const addEvent = (eventData) => {
    const defaultScores = {};
    participants.forEach(p => {
      defaultScores[p.id] = 0;
    });

    const newEvent = {
      id: eventData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `event-${Date.now()}`,
      scores: defaultScores,
      status: 'upcoming',
      ...eventData
    };

    setEvents(prev => {
      const updated = [...prev, newEvent];
      setTimeout(() => {
        logActivity(`Added new event: "${newEvent.name}".`, updated);
      }, 50);
      return updated;
    });
  };

  // Delete an event
  const deleteEvent = (eventId) => {
    const eventToDelete = events.find(e => e.id === eventId);
    if (eventToDelete) {
      setEvents(prev => {
        const updated = prev.filter(e => e.id !== eventId);
        setTimeout(() => {
          logActivity(`Deleted event: "${eventToDelete.name}".`, updated);
        }, 50);
        return updated;
      });
    }
  };

  // Reset to default data
  const resetToDefault = () => {
    setEvents(DEFAULT_EVENTS);
    setActivity(DEFAULT_ACTIVITY);
    localStorage.removeItem('shannolympics_events');
    localStorage.removeItem('shannolympics_activity');
    
    // Attempt push to cloud if connected, otherwise fallback
    const supabase = initSupabase();
    if (supabase && isCloudConnected) {
      supabase.from('shannolympics_state').upsert({
        id: 1,
        events: DEFAULT_EVENTS,
        activity: DEFAULT_ACTIVITY,
        updated_at: new Date().toISOString()
      }).then(({ error }) => {
        if (error) console.error('Cloud reset failed:', error);
      });
    }
    
    // Log resetting activity
    const initEntry = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      message: 'Reset all application standings to default settings.'
    };
    setActivity([initEntry]);
  };

  // Import full state (JSON string)
  const importState = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      
      if (!parsed.events || !parsed.activity) {
        throw new Error("Missing events or activity data.");
      }
      
      if (!Array.isArray(parsed.events) || !Array.isArray(parsed.activity)) {
        throw new Error("Data schema mismatch.");
      }

      setEvents(parsed.events);
      setActivity(parsed.activity);
      
      pushState(parsed.events, parsed.activity);
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  // Connect to Supabase dynamically
  const connectCloud = async (url, key) => {
    localStorage.setItem('shannolympics_supabase_url', url);
    localStorage.setItem('shannolympics_supabase_key', key);
    
    const config = getSupabaseConfig();
    setSupabaseConfig(config);
    
    const client = initSupabase();
    if (client) {
      setIsSyncing(true);
      try {
        const { data, error } = await client
          .from('shannolympics_state')
          .select('*')
          .eq('id', 1)
          .single();
          
        if (error) {
          if (error.code === 'PGRST116') {
            // Table exists but is empty, initialize it with current scores
            await client.from('shannolympics_state').insert({
              id: 1,
              events,
              activity
            });
            setIsCloudConnected(true);
            return { success: true };
          }
          // Wrap error and include status code
          const err = new Error(error.message);
          err.code = error.code;
          throw err;
        } else if (data) {
          if (Array.isArray(data.events)) setEvents(data.events);
          if (Array.isArray(data.activity)) setActivity(data.activity);
          setIsCloudConnected(true);
          return { success: true };
        }
      } catch (e) {
        const isTableMissing = e.code === 'PGRST125' || (e.message && e.message.includes('shannolympics_state'));
        
        // If it is NOT just a missing table (e.g. invalid credentials or network error), clear credentials.
        // For missing table, we KEEP credentials so they can easily hit "Link & Sync" again after running SQL.
        if (!isTableMissing) {
          localStorage.removeItem('shannolympics_supabase_url');
          localStorage.removeItem('shannolympics_supabase_key');
          setSupabaseConfig(getSupabaseConfig());
        }
        
        setIsCloudConnected(false);
        return { 
          success: false, 
          error: isTableMissing 
            ? "Table 'shannolympics_state' not found in your Supabase database. Please open the SQL Setup Query drawer below, copy the SQL, run it in your Supabase SQL Editor, and click 'Link & Sync' again!"
            : (e.message || 'Connection check failed. Verify your Supabase URL and Publishable API Key.')
        };
      } finally {
        setIsSyncing(false);
      }
    }
    return { success: false, error: 'Initialization error. Ensure credentials are valid.' };
  };

  // Disconnect Cloud
  const disconnectCloud = () => {
    localStorage.removeItem('shannolympics_supabase_url');
    localStorage.removeItem('shannolympics_supabase_key');
    setSupabaseConfig(getSupabaseConfig());
    setIsCloudConnected(false);
    
    // Load local storage fallback values
    const savedEvents = localStorage.getItem('shannolympics_events');
    const savedActivity = localStorage.getItem('shannolympics_activity');
    setEvents(savedEvents ? JSON.parse(savedEvents) : DEFAULT_EVENTS);
    setActivity(savedActivity ? JSON.parse(savedActivity) : DEFAULT_ACTIVITY);
  };

  // Helper to calculate total points dynamically
  const getParticipantPoints = (participantId) => {
    return events.reduce((total, evt) => {
      const score = Number(evt.scores[participantId]);
      return total + (isNaN(score) ? 0 : score);
    }, 0);
  };

  // Helper to calculate medal counts dynamically
  const getParticipantMedals = (participantId) => {
    let gold = 0;
    let silver = 0;
    let bronze = 0;

    events.forEach(evt => {
      if (evt.status !== 'completed') return;

      const participantScores = DEFAULT_PARTICIPANTS.map(p => ({
        id: p.id,
        score: Number(evt.scores[p.id]) || 0
      })).sort((a, b) => b.score - a.score);

      if (participantScores.length > 0) {
        const topScore = participantScores[0].score;
        const goldIds = participantScores.filter(p => p.score === topScore && p.score > 0).map(p => p.id);
        
        if (goldIds.includes(participantId)) {
          gold++;
          return;
        }

        const remainingScores = participantScores.filter(p => !goldIds.includes(p.id));
        if (remainingScores.length > 0) {
          const secondScore = remainingScores[0].score;
          const silverIds = remainingScores.filter(p => p.score === secondScore && p.score > 0).map(p => p.id);
          
          if (silverIds.includes(participantId)) {
            silver++;
            return;
          }

          const bronzeCandidates = remainingScores.filter(p => !silverIds.includes(p.id));
          if (bronzeCandidates.length > 0) {
            const thirdScore = bronzeCandidates[0].score;
            const bronzeIds = bronzeCandidates.filter(p => p.score === thirdScore && p.score > 0).map(p => p.id);
            
            if (bronzeIds.includes(participantId)) {
              bronze++;
            }
          }
        }
      }
    });

    return { gold, silver, bronze };
  };

  return (
    <AppContext.Provider value={{
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
      importState,
      getParticipantPoints,
      getParticipantMedals
    }}>
      {children}
    </AppContext.Provider>
  );
};
