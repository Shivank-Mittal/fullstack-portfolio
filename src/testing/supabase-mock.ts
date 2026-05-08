export const supabaseMock = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signInWithOAuth: () => Promise.resolve({ data: null, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
  storage: { from: () => ({}) },
  functions: { invoke: () => Promise.resolve({ data: null, error: null }) },
};
