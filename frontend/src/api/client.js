// Central API base URL — reads from environment variable in production,
// falls back to localhost for local development.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export default BASE_URL;
