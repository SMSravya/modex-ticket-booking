import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type { Show } from "../api";
import { fetchShows } from "../api";

type User = {
  name: string;
  role: "USER" | "ADMIN";
};

type AppContextValue = {
  currentUser: User;
  shows: Show[];
  loadingShows: boolean;
  showsError: string | null;
  loadShowsOnce: () => Promise<void>;
  refreshShows: () => Promise<void>;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser] = useState<User>({ name: "Guest", role: "USER" });
  const [shows, setShows] = useState<Show[]>([]);
  const [loadingShows, setLoadingShows] = useState(false);
  const [showsError, setShowsError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>("All");

  const load = useCallback(
    async (force: boolean) => {
      if (!force && hasLoadedOnce) return;
      setLoadingShows(true);
      try {
        const data = await fetchShows();
        setShows(data);
        setShowsError(null);
        setHasLoadedOnce(true);
      } catch (err: any) {
        setShowsError(err?.response?.data?.error || "Failed to load shows");
      } finally {
        setLoadingShows(false);
      }
    },
    [hasLoadedOnce]
  );

  const loadShowsOnce = useCallback(() => load(false), [load]);
  const refreshShows = useCallback(() => load(true), [load]);

  const value: AppContextValue = {
    currentUser,
    shows,
    loadingShows,
    showsError,
    loadShowsOnce,
    refreshShows,
    selectedCity,
    setSelectedCity,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
