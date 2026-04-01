import axios from "axios";
import { auth } from "./firebase";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export const api = axios.create({
  baseURL: `${API_URL}/v1`,
  headers: { "Content-Type": "application/json" },
});

// Attach Firebase idToken to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Serving base (no /v1 prefix, different rate limit policy)
// Optionally append filename for prettier URLs: /f/{publicId}/foto.jpg
export const servingUrl = (publicId: string, filename?: string) =>
  filename
    ? `${API_URL}/f/${publicId}/${encodeURIComponent(filename)}`
    : `${API_URL}/f/${publicId}`;

// Thumbnail URL — server resizes to max 400×400 JPEG, heavily cached
export const thumbUrl = (publicId: string) => `${API_URL}/f/${publicId}/thumb`;
