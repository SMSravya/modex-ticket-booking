import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

export function HomePage() {
  const {
    shows,
    loadingShows,
    showsError,
    loadShowsOnce,
  } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    loadShowsOnce();
  }, [loadShowsOnce]);

  const loading = loadingShows;
  const error = showsError;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-r from-pink-600/40 via-purple-700/30 to-slate-900/40 border border-pink-500/30 shadow-xl p-6">
        <h1 className="text-3xl font-semibold mb-2">
          Book your next show in seconds
        </h1>
        <p className="text-sm md:text-base text-slate-200/80 max-w-2xl">
          Browse available shows and grab your seats with a smooth,
          BookMyShow-style experience.
        </p>
      </section>

      <div className="space-y-6">
        {loading && (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-40 rounded-2xl bg-slate-800/60 animate-pulse"
              />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && shows.length === 0 && (
          <p className="text-slate-300 text-sm">No shows available yet.</p>
        )}

        {!loading && !error && shows.length > 0 && (
          <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {shows.map((show) => (
              <article
                key={show.id}
                className="group relative cursor-pointer rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-pink-500/60 hover:shadow-[0_20px_60px_rgba(0,0,0,0.7)] transition overflow-hidden"
                onClick={() => navigate(`/booking/${show.id}`)}
              >
                <div className="h-24 bg-gradient-to-tr from-pink-600 via-purple-500 to-indigo-500 opacity-80 group-hover:opacity-100 transition" />
                <div className="p-4 space-y-2">
                  <h2 className="font-semibold text-lg truncate">
                    {show.name}
                  </h2>
                  <p className="text-xs text-slate-300">
                    Starts at:{" "}
                    <span className="font-medium">
                      {new Date(show.start_time).toLocaleString()}
                    </span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Total seats: {show.total_seats}
                  </p>
                  <button
                    className="mt-3 inline-flex items-center justify-center rounded-full bg-pink-600 px-3 py-1.5 text-xs font-medium text-white group-hover:bg-pink-500 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/booking/${show.id}`);
                    }}
                  >
                    View Seats
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
