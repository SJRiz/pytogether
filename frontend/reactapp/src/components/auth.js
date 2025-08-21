export const isAuthenticated = () => {
  return !!sessionStorage.getItem("access_token");
};