import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';

import NavigationBar from './components/NavigationBar';
import Home from './pages/Home';
import MatchList from './pages/MatchList';
import SimulationSetup from './pages/SimulationSetup';
import SavedSimulations from './pages/SavedSimulations';

function App() {
  return (
    <BrowserRouter>
      <NavigationBar />

      <Container className="pb-5">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/games" element={<MatchList />} />
          <Route path="/game/:id" element={<SimulationSetup />} />
          <Route path="/my-sims" element={<SavedSimulations />} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}

export default App;