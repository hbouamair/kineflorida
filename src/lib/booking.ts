export const bookingStatuses = ["pending", "confirmed", "cancelled", "completed"] as const;
export const paymentStatuses = ["unpaid", "paid"] as const;

export type BookingStatus = (typeof bookingStatuses)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];

export type Booking = {
  id: string;
  reference: string;
  service_id: string;
  service_name: string;
  date: string;
  start_minutes: number;
  duration_minutes: number;
  price_mad: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  locale: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  created_at: string;
};

export const statusLabel: Record<BookingStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  cancelled: "Annulé",
  completed: "Terminé",
};

export const paymentLabel: Record<PaymentStatus, string> = {
  unpaid: "Impayé",
  paid: "Payé",
};
