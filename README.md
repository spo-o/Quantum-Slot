# Quantum Avatar Engine

This project is a web-based slot machine powered by real quantum entropy from the CURBy API (University of Colorado).

Instead of relying on pseudo-random functions like Math.random(), every spin is driven by true quantum randomness. The outcome is deterministic, reproducible, and verifiable.

## What it does

- Fetches real quantum entropy from CURBy
- Uses that entropy to deterministically generate slot results
- Displays:
 - Raw entropy values
 - Source (Quantum)
 - Proof hash (SHA-256)
 - Quantum pulse timestamp
 - Local spin time
 - Mapping from entropy → symbols

## Tech Stack

- React (Vite)
- Node.js (Express backend)
- CURBy Quantum Entropy API
- Web Crypto API (SHA-256)

## How it works (high level)

1. Backend calls CURBy endpoint: "https://random.colorado.edu/api/chains/xxx/pulses/latest"

2. Fetch latest quantum pulse from CURBy.

3. Combine entropy with:
- a pre(Quantum-derived value)
- a salt(additional entropy)
- CURBy’s timestamp (quantum pulse time)
- current system time (spin time)

4. Generate a SHA-256 hash from this combined input

5. Use entropy values to deterministically map to slot symbols

6. Display everything for transparency

## Testing / Demo Tip

Hitting a jackpot with many symbols can take a while due to randomness.

To quickly test the jackpot behavior:

Reduce the number of symbols in App.jsx (e.g., to 3) - const symbols = ["🍒","💎","7️⃣"];

This increases the probability of matching all three reels, allowing you to easily observe:

- jackpot animation
- confetti effects
- sound trigger

## Running locally

```bash
BACKEND
cd server
npm install
node server.js


FRONTEND
npm run dev

