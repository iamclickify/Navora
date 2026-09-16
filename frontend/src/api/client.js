// Central API base URL — reads from environment variable in production.
// For local development, it dynamically uses the current hostname 
// (so it works on mobile devices over the local network).
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  const hostname = window.location.hostname;
  return `http://${hostname}:8000`;
};

const BASE_URL = getBaseUrl();
export default BASE_URL;
