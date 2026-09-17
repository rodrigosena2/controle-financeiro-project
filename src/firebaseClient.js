import { getApp, getApps, initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { requireFirebaseConfig } from "./config";

const app = getApps().length ? getApp() : initializeApp(requireFirebaseConfig());

export const auth = getAuth(app);
// Some mobile networks, proxies and privacy filters buffer Firestore's default
// streaming channel for 30+ seconds. Long polling keeps requests compatible
// with those networks; security rules and persistence behavior are unchanged.
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });

// Firebase owns session persistence. The app never stores ID or refresh tokens itself.
export const authPersistenceReady = setPersistence(auth, browserLocalPersistence);
