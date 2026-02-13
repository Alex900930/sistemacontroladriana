// Neutralized the useAuth hook to return a mock user object
export function useAuth() {
  return {
    user: { id: 1, username: 'admin' },
    isLoading: false,
    isAuthenticated: true,
    logout: () => {},
    isLoggingOut: false,
  };
}
