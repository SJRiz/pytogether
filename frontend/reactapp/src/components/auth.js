export const isAuthenticated = () => {
  // Simple token check for now
  return !!localStorage.getItem("token");
};