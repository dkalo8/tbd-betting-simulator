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
`https://tbd-a-dev-sports-page-backend.uc.r.appspot.com`