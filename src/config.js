const read = name => (process.env[name] || "").trim();

export const firebaseConfig = {
  apiKey: read("REACT_APP_FIREBASE_API_KEY"),
  authDomain: read("REACT_APP_FIREBASE_AUTH_DOMAIN"),
  projectId: read("REACT_APP_FIREBASE_PROJECT_ID"),
  storageBucket: read("REACT_APP_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: read("REACT_APP_FIREBASE_MESSAGING_SENDER_ID"),
  appId: read("REACT_APP_FIREBASE_APP_ID"),
  measurementId: read("REACT_APP_FIREBASE_MEASUREMENT_ID")
};

const requiredFields = ["apiKey", "authDomain", "projectId", "appId"];

export function requireFirebaseConfig(config = firebaseConfig) {
  const missing = requiredFields.filter(field => !config[field]);
  if (missing.length) {
    throw new Error(
      "Configuração do Firebase incompleta. Defina as variáveis REACT_APP_FIREBASE_* antes de iniciar a aplicação."
    );
  }
  return config;
}
