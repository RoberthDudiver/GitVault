import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// Guard: only initialize Firebase on the client and when the API key is present.
// During Next.js SSG builds without Firebase secrets this prevents
// auth/invalid-api-key from breaking the build.
let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;

if (typeof window !== "undefined" && apiKey) {
  _app =
    getApps().length === 0
      ? initializeApp({
          apiKey,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        })
      : getApps()[0];
  _auth = getAuth(_app);
}

// Cast as non-null — auth will always be defined when running in the browser
// (the guard above ensures it). Server-side code must not call auth.
export const auth = _auth as Auth;
export default _app;
