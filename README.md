# ShannOlympics

A lightweight, real-time interactive leaderboard and event schedule application built for a 60th birthday Olympics-style tournament in the Outer Banks, North Carolina.

## Features
- **Live Leaderboard**: Real-time points tracking across participants.
- **Tournament Events**: Built-in scoring systems for Surfing, Paddleboarding, Pickleball, Bocce Ball, Bike Rides, Egg Toss, and various Card Games.
- **Admin Cabana**: Secure admin dashboard for creating new events, updating statuses, and modifying points.
- **Real-Time Sync**: Fully synced across all devices instantly using Supabase Realtime WebSockets.
- **Offline Capable**: Graceful fallback to `localStorage` if the cloud database is disconnected.

## Tech Stack
- **Frontend**: React, Vite, Vanilla CSS
- **Database**: Supabase PostgreSQL (with Row-Level Security & Realtime WebSockets)
- **Deployment**: GitHub Pages

## Deployment
This project is configured to automatically deploy to GitHub Pages via the `gh-pages` branch using `npm run deploy`.
