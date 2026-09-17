import { getApp, getApps, initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore/lite";
import { requireFirebaseConfig } from "./config";

const app = getApps().length ? getApp() : initializeApp(requireFirebaseConfig());

export const auth = getAuth(app);
// This app uses point reads and CRUD only; Firestore Lite uses regular HTTP
// requests and avoids the streaming channel that was stalling on some networks.
export const db = getFirestore(app);

// Firebase owns session persistence. The app never stores ID or refresh tokens itself.
export const authPersistenceReady = setPersistence(auth, browserLocalPersistence);
