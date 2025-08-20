import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import NavigationBar from "./components/NavigationBar";
import Home from "./pages/Home";
import MatchList from "./pages/MatchList";
import SimulationSetup from "./pages/SimulationSetup";
import SavedSimulations from "./pages/SavedSimulations";
import Watchlist from './pages/Watchlist';

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("login");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user?.exp && Date.now()/1000 > user.exp) {
      localStorage.removeItem("login");
      setUser(null);
    }
  }, [user]);

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <NavigationBar user={user} setUser={setUser} />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/games" element={<MatchList initialWhen="today" />} />
          <Route path="/games/upcoming" element={<MatchList initialWhen="upcoming" />} />
          <Route path="/game/:id" element={<SimulationSetup />} />
          <Route path="/my-sims" element={<SavedSimulations />} />
          <Route path="/watchlist" element={<Watchlist />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;