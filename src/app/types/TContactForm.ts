/**
 * Contact form payload — same shape as the reactive form value.
 * Use for API requests, Supabase inserts, etc.
 */
export type TContactForm = {
  name: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  message: string;
};
