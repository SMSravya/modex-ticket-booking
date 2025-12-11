import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import type { Booking, Show } from "../api";
import { createShow, fetchAdminBookings } from "../api";
import { useAppContext } from "../context/AppContext";

type FormState = {
  name: string;
  start_time: string;
  total_seats: string;
};

export function AdminPage() {
  const { shows, loadShowsOnce, refreshShows } = useAppContext();

  const [form, setForm] = useState<FormState>({
    name: "",
    start_time: "",
    total_seats: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");

  // load bookings + shows
  useEffect(() => {
    loadShowsOnce();
  }, [loadShowsOnce]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setBookingsLoading(true);
        const data = await fetchAdminBookings(
          statusFilter || undefined
        );
        if (!mounted) return;
        setBookings(data);
        setBookingsError(null);
      } catch (e: any) {
        if (!mounted) return;
        setBookingsError(e?.response?.data?.error || "Failed to load bookings");
      } finally {
        if (mounted) setBookingsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [statusFilter]);

  const onChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!form.name || !form.start_time || !form.total_seats) {
      setFormError("All fields are required");
      return;
    }
    const seatNum = Number(form.total_seats);
    if (Number.isNaN(seatNum) || seatNum <= 0) {
      setFormError("Total seats must be a positive number");
      return;
    }

    try {
      setSubmitting(true);
      const res = await createShow({
        name: form.name.trim(),
        start_time: form.start_time,
        total_seats: seatNum,
      });
      setFormSuccess(`Show #${res.showId} created successfully`);
      setForm({ name: "", start_time: "", total_seats: "" });

      // refresh global shows cache so both Home/Admin see new show
      await refreshShows();
    } catch (e: any) {
      setFormError(e?.response?.data?.error || "Failed to create show");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_2fr] items-start">
      {/* Left column: create + shows list */}
      <div className="space-y-6">
        {/* Create show form */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
          <h1 className="text-lg font-semibold mb-2">Admin – Create Show</h1>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Show name</label>
              <input
                type="text"
                className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-pink-500"
                value={form.name}
                onChange={(e) => onChange("name", e.target.value)}
                placeholder="Demo Movie"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">
                Start time (ISO / local)
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-pink-500"
                value={form.start_time}
                onChange={(e) => onChange("start_time", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Total seats</label>
              <input
                type="number"
                min={1}
                className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-pink-500"
                value={form.total_seats}
                onChange={(e) => onChange("total_seats", e.target.value)}
                placeholder="40"
              />
            </div>

            {formError && (
              <p className="text-xs text-red-300">{formError}</p>
            )}
            {formSuccess && (
              <p className="text-xs text-emerald-300">{formSuccess}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center rounded-full bg-pink-600 px-3 py-2 text-sm font-medium text-white disabled:bg-slate-700"
            >
              {submitting ? "Creating..." : "Create Show"}
            </button>
          </form>
        </section>

        {/* Shows list for admin */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">All Shows</h2>
            <button
              className="text-[11px] text-pink-300 hover:text-pink-200"
              onClick={refreshShows}
              type="button"
            >
              Refresh
            </button>
          </div>

          {shows.length === 0 ? (
            <p className="text-xs text-slate-400">No shows created yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {shows.map((s: Show) => (
                <div
                  key={s.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs flex flex-col gap-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-100">
                      #{s.id} · {s.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Seats: {s.total_seats}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-300">
                    {new Date(s.start_time).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Right column: bookings table */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent Bookings</h2>
          <select
            className="text-xs rounded-full bg-slate-950 border border-slate-700 px-2 py-1 outline-none focus:border-pink-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        {bookingsLoading && (
          <p className="text-xs text-slate-400">Loading bookings...</p>
        )}
        {bookingsError && (
          <p className="text-xs text-red-300">{bookingsError}</p>
        )}
        {!bookingsLoading && !bookingsError && bookings.length === 0 && (
          <p className="text-xs text-slate-400">No bookings yet.</p>
        )}

        {!bookingsLoading && bookings.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-slate-300">
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">Show</th>
                  <th className="py-2 pr-3">User</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-slate-800/70 last:border-0"
                  >
                    <td className="py-2 pr-3 text-slate-200">{b.id}</td>
                    <td className="py-2 pr-3 text-slate-300">{b.show_id}</td>
                    <td className="py-2 pr-3 text-slate-300">
                      {b.user_name}
                    </td>
                    <td className="py-2 pr-3">
                      <StatusChip status={b.status} />
                    </td>
                    <td className="py-2 pr-3 text-slate-400">
                      {new Date(b.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusChip({ status }: { status: Booking["status"] }) {
  const color =
    status === "CONFIRMED"
      ? "bg-emerald-600/80 text-emerald-100"
      : status === "FAILED"
      ? "bg-red-600/80 text-red-100"
      : "bg-amber-500/80 text-amber-50";
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] ${color}`}>
      {status}
    </span>
  );
}
