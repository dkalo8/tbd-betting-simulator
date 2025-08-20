# TBD – A Developing Sports Page -- Iteration 3 Backend

This service powers game listing, Monte-Carlo simulations, and a robust **Watchlist** (save games or specific simulations). It’s an Express + MongoDB (Mongoose) app with Google OAuth verification and App Engine–ready configs.

### What’s new in Iteration 3
- **Watchlist API**  
  Save **games** or **specific simulations** (including the sim’s results).  
  - Unique compound index: `{ userId, gameId, simulationId }`  
    - `simulationId: null` → one game-only row per user/game  
    - `simulationId: ObjectId(...)` → any number of per-simulation rows  
  - Drag-and-drop ordering via `order` (optional).  
- **Saved Simulations: deterministic order**  
  - `getSimulations()` sorts by `order` ascending when present; else `createdAt` desc.  
  - `updateOrder(ids)` bulk-persists the new order.  
  - `bumpNewSimulationToTop(userId, insertedId)` shifts others and sets the new sim to `order: 0`.  
- **Cron config (GROC format)** — fixed `cron.yaml` used to run automated jobs that pull real games and scores from `scripts/realGames.js` and `scripts/realScores.js`.
- **Seeding for local dev** — `yarn seed:games` to populate the local DB when not using Atlas.

## API

**Base URL (local):** `http://localhost:5001/api`  
**Base URL (prod):** `https://tbd-backend.uc.r.appspot.com/api`

### Public
- `GET /health` → `{ status: "ok" }` (optionally include `{ version, commit, deployedAt }`)
- `GET /games?sport=&league=&when=today|upcoming&daysAhead=`  
  Returns games; supports filters and “today” auto-refresh usage on the frontend.

### Auth-required (Google ID token → `Authorization: Bearer <idToken>`)
- **Simulations**
  - `GET /simulations` → current user’s simulations (ordered deterministically)
  - `POST /simulations` → run Monte-Carlo and save `{ gameId, params, result }`
  - `PUT /simulations` → update one (generic field updates)
  - `DELETE /simulations` (body: `{ simulationId }`) → delete one
  - `PUT /simulations/order` (body: `{ order: [<id1>, <id2>, ...] }`) → reorder all
- **Watchlist**
  - `GET /watchlist` → `[{ _id, userId, addedAt, order?, simulationId?, simResult?, game }]`
  - `POST /watchlist` (body: `{ gameId, simResult?, simulationId? }`)  
    - game-only save: omit `simulationId`  
    - per-sim save: include `simulationId` and `simResult`
  - `DELETE /watchlist/:gameId` → remove **game-only** save
  - `DELETE /watchlist/sim/:simulationId` → remove a **specific sim** save
  - `PUT /watchlist/order` (body: `{ order: [<watchlistRowId>, ...] }`) → (optional) reorder UI rows

> **Auth middleware**: `verifyGoogleToken` validates the Google ID token and sets `req.user` (we use `req.user._id` / `req.user.sub` as the stable userId).

## The Odds API – how it's used

- **Base**: `ODDS_API_BASE=https://api.the-odds-api.com/v4`
- **Inputs**: configured leagues via `ODDS_SPORT_KEYS` (e.g., `basketball_nba`, `americanfootball_nfl`, `soccer_`, `tennis_`).
- **Use cases**:
  - Populate game odds & implied probabilities used by Monte-Carlo (`moneylineToProb`).
  - Live scores refresh for “Live Now” and **StatusBadge** rendering.
- **Quotas**: we **cache** the response headers (e.g., requests used/remaining) on normal calls and expose a tiny `/api/odds-quota` if desired—no extra request just to check usage.
**Note: Quota usage is at 347 / 500 (69.4%), so game data will be updated as of 8/14 @ 12:01 AM ET --scores are not showing because the API doesn't pull tennis scores, and there were also no soccer games live when it was last run**

## Notable Implementation Notes

- **Deterministic ordering** for Saved Sims:
  - DAO returns `{ order: 1 }` if any doc has `order`; else defaults to `{ createdAt: -1 }`.
  - Drag-and-drop persists with `bulkWrite` via `/simulations/order`.
- **Watchlist design**:
  - **Game save**: `{ userId, gameId, simulationId: null }`
  - **Sim save**: `{ userId, gameId, simulationId, simResult }`
  - Listing uses `$lookup` to join the `games` collection and returns a simple shape for the frontend.
- **Auth**: Google ID tokens verified in `verifyGoogleToken`; all `/simulations` and `/watchlist` routes are protected, while `/games` and `/health` are public.
- **CORS & Axios**: CORS enabled; frontend injects the Google token automatically on requests (see frontend README).

------------------------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------------------------------

# TBD – A Developing Sports Page -- Iteration 2 Backend

- **Added Google ID token verification**  
  - Created `src/auth.js` with `verifyGoogleToken` middleware  
  - Introduced `GOOGLE_CLIENT_ID` env var for `OAuth2Client.verifyIdToken`  
  - Mounted `/api/simulations` routes under this auth guard  
- **Refactored to full ESM**  
  - Converted all `require` → `import` and `module.exports` → `export default`  
  - Updated `server.js`, DAO, controllers, and route imports accordingly  
- **DAO injection on startup**  
  - In `server.js`, call `await SimulationsDAO.injectDB(mongoose.connection.db)` before listening  
- **Separated concerns**  
  - Moved Monte Carlo logic (`runMonteCarlo`, `moneylineToProb`) into `src/utilities/simulationUtilities.js`  
- **Environment & deployment**  
  - Added `GOOGLE_CLIENT_ID` to `.env` and `app.yaml`  
  - Deployed backend to Google App Engine at https://tbd-backend.uc.r.appspot.com  

Now supports a fully authenticated POST / GET loop for simulations, protected by real Google accounts. Specifically:

* GET /api/games → returns a list of upcoming games
* GET /api/simulations → returns the current user’s saved simulations
* POST /api/simulations → runs Monte Carlo + saves a new simulation

------------------------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------------------------------

# TBD – A Developing Sports Page -- Iteration 1 Backend

Express + MongoDB backend that powers the sports-simulation front-end.  
Current scope covers health-check, game listing, and create/read of simulation runs.

## 3rd Party Libraries Used

| Library            | Why it’s included (Iteration 1 requirement)                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **express**        | Minimal, battle-tested Node web-framework to expose REST endpoints.                                                |
| **mongoose**       | Object-Document Mapper for MongoDB; gives us schemas (`Game`, `Simulation`), validation, and helper query methods. |
| **cors**           | Enables requests from the CRA dev server (`localhost:3000`) during development.                                    |
| **dotenv**         | Loads secrets such as `MONGODB_URI` from `.env` (keeps creds out of code).                                         |
| **nodemon** ( dev) | Auto-restarts the server on file changes—speeds local development.                                                 |

## Live API

| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/health` | GET | Simple status JSON |
| `/api/games` | GET | Optional `?sport=NBA\|NFL\|SOC\|TEN` |
| `/api/simulations` | POST | Body `{ gameId, userId, params }` |
| `/api/simulations?userId=demo` | GET | All sims for user |

**Prod Base URL:**  
`https://tbd-backend.uc.r.appspot.com`