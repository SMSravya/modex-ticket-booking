import axios from "axios";
import { API_BASE_URL } from "./config";

// ---- Types ----
export interface Show {
  id: number;
  name: string;
  start_time: string;
  total_seats: number;
}

export type Seat = {
  id: number;
  seat_number: number;
  status: "AVAILABLE" | "PENDING" | "CONFIRMED" | "FAILED";
  booking_id: number | null;
};

export type Booking = {
  id: number;
  show_id: number;
  user_name: string;
  status: "PENDING" | "CONFIRMED" | "FAILED";
  created_at: string;
  updated_at: string | null;
};

export type BookingWithSeats = {
  booking: Booking;
  seats: { seat_number: number; status: Seat["status"] }[];
};

// Runtime no-op so the module has a `Show` export value (avoids Vite error)
export const Show = {} as Show;

// ---- Axios instance ----
const client = axios.create({
  baseURL: API_BASE_URL,
});

// ---- API functions ----

// GET /shows
export async function fetchShows(): Promise<Show[]> {
  const res = await client.get<Show[]>("/shows");
  return res.data;
}

// GET /shows/:id/seats
export async function fetchShowSeats(showId: number): Promise<Seat[]> {
  const res = await client.get<Seat[]>(`/shows/${showId}/seats`);
  return res.data;
}

// POST /admin/shows
export async function createShow(payload: {
  name: string;
  start_time: string;
  total_seats: number;
}): Promise<{ message: string; showId: number }> {
  const res = await client.post("/admin/shows", payload);
  return res.data;
}

// POST /book
export async function createBooking(payload: {
  showId: number;
  seats: number[];
  userName: string;
}): Promise<{ message: string; bookingId: number; status: "PENDING" }> {
  const res = await client.post("/book", payload);
  return res.data;
}

// POST /book/confirm
export async function confirmBooking(payload: {
  bookingId: number;
}): Promise<{ message: string; bookingId: number }> {
  const res = await client.post("/book/confirm", payload);
  return res.data;
}

// GET /book/:id
export async function fetchBooking(
  bookingId: number
): Promise<BookingWithSeats> {
  const res = await client.get<BookingWithSeats>(`/book/${bookingId}`);
  return res.data;
}

// GET /admin/bookings[?status=...]
export async function fetchAdminBookings(status?: string): Promise<Booking[]> {
  const res = await client.get<Booking[]>(
    status
      ? `/admin/bookings?status=${encodeURIComponent(status)}`
      : "/admin/bookings"
  );
  return res.data;
}
