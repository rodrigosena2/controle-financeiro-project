import { getApp, getApps, initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { requireFirebaseConfig } from "./config";

const app = getApps().length ? getApp() : initializeApp(requireFirebaseConfig());

export const auth = getAuth(app);
export const db = getFirestore(app);

// Firebase owns session persistence. The app never stores ID or refresh tokens itself.
export const authPersistenceReady = setPersistence(auth, browserLocalPersistence);
