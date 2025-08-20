import { useCallback, useEffect, useState } from "react";
import WatchlistService from "../services/watchlist";

/**
 * Shared watchlist state + actions with optimistic updates.
 * Returns: savedIds(Set), isSaved(id), add(id), remove(id), toggle(id), refresh(), loading, error
 */
function useWatchlist() {
  const [savedGameIds, setSavedGameIds] = useState(new Set());
  const [savedSimIds, setSavedSimIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items } = await WatchlistService.list();
      const g = new Set();
      const s = new Set();
      for (const it of items) {
        if (it.simulationId) s.add(String(it.simulationId));
        else g.add(String(it.game._id)); // game-only entry
      }
      setSavedGameIds(g);
      setSavedSimIds(s);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const isSavedGame = useCallback((gameId) => savedGameIds.has(String(gameId)), [savedGameIds]);
  const isSavedSim = useCallback((simId) => savedSimIds.has(String(simId)), [savedSimIds]);

  const addGame = useCallback(async (gameId) => {
    await WatchlistService.add(gameId);
    setSavedGameIds(prev => new Set(prev).add(String(gameId)));
  }, []);

  const removeGame = useCallback(async (gameId) => {
    await WatchlistService.remove(gameId);
    setSavedGameIds(prev => {
      const n = new Set(prev); n.delete(String(gameId)); return n;
    });
  }, []);

  const addSim = useCallback(async (simulation) => {
    const { _id: simId, gameId, result } = simulation;
    await WatchlistService.add(gameId, { simResult: result, simulationId: simId });
    setSavedSimIds(prev => new Set(prev).add(String(simId)));
  }, []);

  const removeSim = useCallback(async (simId) => {
    await WatchlistService.removeBySimulation(simId);
    setSavedSimIds(prev => {
      const n = new Set(prev); n.delete(String(simId)); return n;
    });
  }, []);

  // Toggles
  const toggleGame = useCallback(async (gameId) => {
    if (isSavedGame(gameId)) await removeGame(gameId);
    else await addGame(gameId);
  }, [isSavedGame, addGame, removeGame]);

  const toggleSim = useCallback(async (simulation) => {
    const simId = simulation._id;
    if (isSavedSim(simId)) await removeSim(simId);
    else await addSim(simulation);
  }, [isSavedSim, addSim, removeSim]);

  return {
    loading, error, refresh,
    isSavedGame, isSavedSim,
    addGame, removeGame, addSim, removeSim,
    toggleGame, toggleSim,
  };
}

export default useWatchlist;