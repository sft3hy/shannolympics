import React, { createContext, useState, useEffect } from 'react';
import { DEFAULT_PARTICIPANTS, DEFAULT_EVENTS, DEFAULT_ACTIVITY } from '../utils/defaultData';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [participants, setParticipants] = useState(() => {
    const saved = localStorage.getItem('shannolympics_participants');
    return saved ? JSON.parse(saved) : DEFAULT_PARTICIPANTS;
  });

  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('shannolympics_events');
    return saved ? JSON.parse(saved) : DEFAULT_EVENTS;
  });

  const [activity, setActivity] = useState(() => {
    const saved = localStorage.getItem('shannolympics_activity');
    return saved ? JSON.parse(saved) : DEFAULT_ACTIVITY;
  });

  // Keep localStorage in sync when state changes
  useEffect(() => {
    localStorage.setItem('shannolympics_participants', JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem('shannolympics_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('shannolympics_activity', JSON.stringify(activity));
  }, [activity]);

  // Add an entry to the activity log
  const logActivity = (message) => {
    const newEntry = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      message
    };
    setActivity(prev => [newEntry, ...prev].slice(0, 50)); // Keep last 50 activities
  };

  // Update scores for a single event
  const updateEventScores = (eventId, scores, status) => {
    setEvents(prevEvents => {
      const updated = prevEvents.map(evt => {
        if (evt.id === eventId) {
          // If status changes to completed, see if we want to log the top performers
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

          logActivity(`Event "${evt.name}"${statusText}${podiumMsg}.`);
          return { ...evt, scores, status };
        }
        return evt;
      });
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

    setEvents(prev => [...prev, newEvent]);
    logActivity(`Added new event: "${newEvent.name}".`);
  };

  // Delete an event
  const deleteEvent = (eventId) => {
    const eventToDelete = events.find(e => e.id === eventId);
    if (eventToDelete) {
      setEvents(prev => prev.filter(e => e.id !== eventId));
      logActivity(`Deleted event: "${eventToDelete.name}".`);
    }
  };

  // Reset to default data
  const resetToDefault = () => {
    setParticipants(DEFAULT_PARTICIPANTS);
    setEvents(DEFAULT_EVENTS);
    setActivity(DEFAULT_ACTIVITY);
    localStorage.removeItem('shannolympics_participants');
    localStorage.removeItem('shannolympics_events');
    localStorage.removeItem('shannolympics_activity');
    logActivity('Reset all application data to default settings.');
  };

  // Import full state (JSON string)
  const importState = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Simple validation checks
      if (!parsed.participants || !parsed.events || !parsed.activity) {
        throw new Error("Missing required data categories.");
      }
      
      if (!Array.isArray(parsed.participants) || !Array.isArray(parsed.events)) {
        throw new Error("Data schema mismatch.");
      }

      setParticipants(parsed.participants);
      setEvents(parsed.events);
      setActivity(parsed.activity);
      logActivity('Successfully synchronized database from imported data block.');
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
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

      // Sort all participant scores for this event
      const participantScores = participants.map(p => ({
        id: p.id,
        score: Number(evt.scores[p.id]) || 0
      })).sort((a, b) => b.score - a.score);

      // Simple placement check (checking ties)
      if (participantScores.length > 0) {
        const topScore = participantScores[0].score;
        
        // Find gold players (could be tied)
        const goldIds = participantScores.filter(p => p.score === topScore && p.score > 0).map(p => p.id);
        
        if (goldIds.includes(participantId)) {
          gold++;
          return; // No double medals for same event
        }

        // Remaining players
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
