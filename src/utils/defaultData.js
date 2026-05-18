export const DEFAULT_PARTICIPANTS = [
  { id: 'shannon', name: 'Shannon' },
  { id: 'wick', name: 'Wick' },
  { id: 'sam', name: 'Sam' },
  { id: 'brielle', name: 'Brielle' },
  { id: 'halley', name: 'Halley' },
  { id: 'peter', name: 'Peter' }
];

export const DEFAULT_EVENTS = [
  {
    id: 'surfing',
    name: 'Surfing',
    description: 'Best wave performance and style competition at Outer Banks beaches.',
    pointsAvailable: 10,
    status: 'upcoming', // completed, in_progress, upcoming
    date: '2026-05-19',
    time: '09:00 AM',
    scores: {
      shannon: 0,
      wick: 0,
      sam: 0,
      brielle: 0,
      halley: 0,
      peter: 0
    }
  },
  {
    id: 'paddleboarding',
    name: 'Paddleboarding',
    description: 'Timed sprint paddle board race around the sound buoys.',
    pointsAvailable: 10,
    status: 'upcoming',
    date: '2026-05-20',
    time: '10:30 AM',
    scores: {
      shannon: 0,
      wick: 0,
      sam: 0,
      brielle: 0,
      halley: 0,
      peter: 0
    }
  },
  {
    id: 'bocce',
    name: 'Bocce Ball',
    description: 'Beachside Bocce tournament. Closest to the pallino wins!',
    pointsAvailable: 8,
    status: 'upcoming',
    date: '2026-05-21',
    time: '04:00 PM',
    scores: {
      shannon: 0,
      wick: 0,
      sam: 0,
      brielle: 0,
      halley: 0,
      peter: 0
    }
  },
  {
    id: 'pickleball',
    name: 'Pickleball',
    description: 'Fast-paced 2v2 tournament at local OBX courts.',
    pointsAvailable: 12,
    status: 'upcoming',
    date: '2026-05-22',
    time: '02:00 PM',
    scores: {
      shannon: 0,
      wick: 0,
      sam: 0,
      brielle: 0,
      halley: 0,
      peter: 0
    }
  },
  {
    id: 'bike-ride',
    name: 'Bike Ride',
    description: 'Scenic group bike ride with sprint milestones along the coastal trail.',
    pointsAvailable: 8,
    status: 'upcoming',
    date: '2026-05-23',
    time: '08:30 AM',
    scores: {
      shannon: 0,
      wick: 0,
      sam: 0,
      brielle: 0,
      halley: 0,
      peter: 0
    }
  },
  {
    id: 'egg-toss',
    name: 'Egg Toss',
    description: 'Traditional distance-scaling partner egg toss. Do not drop it!',
    pointsAvailable: 6,
    status: 'upcoming',
    date: '2026-05-24',
    time: '11:00 AM',
    scores: {
      shannon: 0,
      wick: 0,
      sam: 0,
      brielle: 0,
      halley: 0,
      peter: 0
    }
  },
  {
    id: 'up-yours',
    name: 'Up Yours (Card Game)',
    description: 'Strategic card game match around the kitchen table.',
    pointsAvailable: 6,
    status: 'upcoming',
    date: '2026-05-18',
    time: '08:00 PM',
    scores: {
      shannon: 0,
      wick: 0,
      sam: 0,
      brielle: 0,
      halley: 0,
      peter: 0
    }
  },
  {
    id: 'pitch-6',
    name: 'Pitch 6 (Card Game)',
    description: 'Classic Pitch tournament of cards. High strategies only.',
    pointsAvailable: 6,
    status: 'upcoming',
    date: '2026-05-19',
    time: '08:30 PM',
    scores: {
      shannon: 0,
      wick: 0,
      sam: 0,
      brielle: 0,
      halley: 0,
      peter: 0
    }
  },
  {
    id: 'five-crowns',
    name: 'Five Crowns (Card Game)',
    description: 'Rummy-style game with five suits. Keeping points low is the goal!',
    pointsAvailable: 6,
    status: 'upcoming',
    date: '2026-05-20',
    time: '09:00 PM',
    scores: {
      shannon: 0,
      wick: 0,
      sam: 0,
      brielle: 0,
      halley: 0,
      peter: 0
    }
  }
];

export const DEFAULT_ACTIVITY = [
  {
    id: 'act-init',
    timestamp: new Date().toISOString(),
    message: 'ShannOlympics initialized! Let the games begin!'
  }
];
