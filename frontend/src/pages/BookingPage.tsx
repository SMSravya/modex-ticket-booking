import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Seat, Show } from "../api";
import {
  fetchShowSeats,
  fetchShows,
  createBooking,
  confirmBooking,
} from "../api";

type SeatStatus = Seat["status"];

export function BookingPage() {
  const { id } = useParams();
  const showId = Number(id);
  const navigate = useNavigate();

  const [show, setShow] = useState<Show | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<
    "IDLE" | "PENDING" | "CONFIRMED" | "FAILED"
  >("IDLE");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  // Load show + seats
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const [showsList, seatList] = await Promise.all([
          fetchShows(),
          fetchShowSeats(showId),
        ]);
        if (!mounted) return;
        setShow(showsList.find((s) => s.id === showId) || null);
        setSeats(seatList);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.response?.data?.error || "Failed to load booking data");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (!Number.isNaN(showId)) load();
    return () => {
      mounted = false;
      setSelectedSeats([]); // cleanup selection on leave
      setBookingStatus("IDLE");
      setStatusMessage(null);
      setError(null);
    };
  }, [showId]);

  const isSelectable = (status: SeatStatus) => status === "AVAILABLE";

  const toggleSeat = (seat: Seat) => {
    if (!isSelectable(seat.status)) return;
    setSelectedSeats((prev) =>
      prev.includes(seat.seat_number)
        ? prev.filter((n) => n !== seat.seat_number)
        : [...prev, seat.seat_number]
    );
  };

  const handleBook = async () => {
    if (!showId || selectedSeats.length === 0) return;
    setBookingLoading(true);
    setError(null);
    setStatusMessage(null);
    setBookingStatus("PENDING");

    try {
      const booking = await createBooking({
        showId,
        seats: selectedSeats,
        userName: "Guest",
      });

      setStatusMessage(
        `Booking #${booking.bookingId} created with status PENDING. Confirming...`
      );

      const confirmed = await confirmBooking({ bookingId: booking.bookingId });

      setBookingStatus("CONFIRMED");
      setStatusMessage(`Booking #${confirmed.bookingId} CONFIRMED.`);

      const updatedSeats = await fetchShowSeats(showId);
      setSeats(updatedSeats);
      setSelectedSeats([]);
    } catch (e: any) {
      setBookingStatus("FAILED");
      setError(e?.response?.data?.error || "Booking failed.");
      setStatusMessage("Booking FAILED. Please try again with different seats.");
    } finally {
      setBookingLoading(false);
    }
  };

  const renderStatusBanner = () => {
    if (bookingStatus === "IDLE" && !error) return null;

    let bg = "bg-slate-800/70 border-slate-600";
    if (bookingStatus === "PENDING") bg = "bg-amber-500/10 border-amber-500/50";
    if (bookingStatus === "CONFIRMED") bg = "bg-emerald-500/10 border-emerald-500/60";
    if (bookingStatus === "FAILED") bg = "bg-red-500/10 border-red-500/60";

    const label =
      bookingStatus === "PENDING"
        ? "PENDING"
        : bookingStatus === "CONFIRMED"
        ? "CONFIRMED"
        : bookingStatus === "FAILED"
        ? "FAILED"
        : "INFO";

    return (
      <div className={`rounded-xl border px-4 py-3 text-xs mb-2 ${bg}`}>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900/80 border border-slate-600">
            {label}
          </span>
          <span className="text-slate-100">
            {statusMessage || error || "Booking status update."}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 rounded-2xl bg-slate-800/60 animate-pulse" />
        <div className="h-40 rounded-2xl bg-slate-800/60 animate-pulse" />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-pink-400 hover:text-pink-300"
        >
          ← Back
        </button>
        <p className="text-sm text-slate-200">Show not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-pink-400 hover:text-pink-300"
        >
          ← Back
        </button>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold mb-1">
            {show.name}
          </h1>
          <p className="text-xs md:text-sm text-slate-300">
            Starts at:{" "}
            <span className="font-medium">
              {new Date(show.start_time).toLocaleString()}
            </span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Total seats: {show.total_seats}
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2 text-xs">
          <div className="flex gap-3">
            <LegendDot color="bg-emerald-400" label="Available" />
            <LegendDot color="bg-pink-500" label="Selected" />
            <LegendDot color="bg-slate-500" label="Booked" />
          </div>
          <p className="text-slate-400">
            Click seats in the layout to select or deselect.
          </p>
        </div>
      </section>

      {renderStatusBanner()}

      <div className="grid md:grid-cols-[3fr_1.2fr] gap-6 items-start">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400 mb-3 text-center">
            Screen this side
          </p>
          <div className="mx-auto mb-5 h-1 w-40 bg-slate-500/70 rounded-full" />
          <div className="grid grid-cols-8 gap-2 justify-items-center">
            {seats.map((seat) => {
              const isSelected = selectedSeats.includes(seat.seat_number);
              const isBooked = seat.status !== "AVAILABLE";
              const bg = isSelected
                ? "bg-pink-600"
                : isBooked
                ? "bg-slate-600"
                : "bg-emerald-500";
              const cursor = isBooked ? "cursor-not-allowed" : "cursor-pointer";

              return (
                <button
                  key={seat.id}
                  className={`w-9 h-9 text-xs rounded-md flex items-center justify-center text-white font-semibold transition transform hover:scale-105 ${bg} ${cursor}`}
                  onClick={() => toggleSeat(seat)}
                  disabled={isBooked}
                >
                  {seat.seat_number}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-4">
          <h2 className="text-sm font-semibold">Your Selection</h2>
          <p className="text-xs text-slate-400">
            Selected seats:{" "}
            {selectedSeats.length > 0
              ? selectedSeats.sort((a, b) => a - b).join(", ")
              : "None"}
          </p>
          <p className="text-xs text-slate-400">
            Count: <span className="font-medium">{selectedSeats.length}</span>
          </p>
          <button
            disabled={selectedSeats.length === 0 || bookingLoading}
            onClick={handleBook}
            className="w-full mt-2 inline-flex items-center justify-center rounded-full bg-pink-600 px-3 py-2 text-sm font-medium text-white disabled:bg-slate-700 disabled:text-slate-300"
          >
            {bookingLoading ? "Booking..." : "Confirm Booking"}
          </button>
        </aside>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-300">
      <span className={`w-3 h-3 rounded-full ${color}`} />
      {label}
    </span>
  );
}
