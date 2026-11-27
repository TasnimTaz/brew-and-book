type BookingEvent = {
  type: 'booking.updated';
  date: string;
  slotId: number;
  tableId: number;
  status: string;
  bookingId?: number;
  token?: string;
};

export function emitBookingUpdate(event: BookingEvent) {
  const io = (globalThis as unknown as { __brewBookIO?: { to: (room: string) => { emit: (ev: string, payload: unknown) => void } } }).__brewBookIO;
  if (!io) return;
  io.to(`slot:${event.date}:${event.slotId}`).emit('booking.updated', event);
}
