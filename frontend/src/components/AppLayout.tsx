import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { cities } from "../types/showExtras";

export function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { selectedCity, setSelectedCity } = useAppContext();

  const navLinkClass = (path: string) =>
    `text-sm px-3 py-1 rounded-full transition ${
      pathname === path
        ? "bg-pink-600 text-white"
        : "text-slate-200 hover:bg-pink-500/10 hover:text-pink-300"
    }`;

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        // Demo: always map current location to Hyderabad
        setSelectedCity("Hyderabad");
      },
      () => {
        alert("Could not detect location. Showing All Cities.");
        setSelectedCity("All");
      },
      { timeout: 5000 }
    );
  };

  return (
    <div className="min-h-screen bg-[#050816] text-slate-100 flex flex-col">
      <header className="sticky top-0 z-20 bg-black/70 backdrop-blur border-b border-slate-800">
        <div className="mx-auto w-full max-w-5xl flex items-center justify-between px-4 py-3 gap-4">
          <Link to="/" className="text-xl font-semibold text-pink-500">
            Modex Tickets
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <select
                className="text-xs rounded-full bg-slate-900 border border-slate-700 px-3 py-1 text-slate-200 outline-none focus:border-pink-500"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city === "All" ? "All Cities" : city}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="text-[11px] px-3 py-1 rounded-full border border-pink-500/60 text-pink-300 hover:bg-pink-500/10 transition"
                onClick={handleUseLocation}
              >
                Use my location
              </button>
            </div>

            <nav className="flex gap-2">
              <Link to="/" className={navLinkClass("/")}>
                Shows
              </Link>
              <Link to="/admin" className={navLinkClass("/admin")}>
                Admin
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-4 py-8">{children}</div>
      </main>
    </div>
  );
}
