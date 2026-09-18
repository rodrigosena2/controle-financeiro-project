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
const environmentNames = {
  apiKey: "REACT_APP_FIREBASE_API_KEY",
  authDomain: "REACT_APP_FIREBASE_AUTH_DOMAIN",
  projectId: "REACT_APP_FIREBASE_PROJECT_ID",
  storageBucket: "REACT_APP_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "REACT_APP_FIREBASE_MESSAGING_SENDER_ID",
  appId: "REACT_APP_FIREBASE_APP_ID",
  measurementId: "REACT_APP_FIREBASE_MEASUREMENT_ID"
};

export function requireFirebaseConfig(config = firebaseConfig) {
  const missing = requiredFields.filter(field => !config[field]);
  if (missing.length) {
    throw new Error(
      "Configuração do Firebase incompleta. Defina as variáveis REACT_APP_FIREBASE_* antes de iniciar a aplicação."
    );
  }

  const invalid = [];
  if (config.projectId.startsWith("AIza") || !/^[a-z0-9][a-z0-9-]*$/i.test(config.projectId)) {
    invalid.push("projectId");
  }
  if (config.authDomain.startsWith("AIza") || !config.authDomain.includes(".")) {
    invalid.push("authDomain");
  }
  if (config.appId.startsWith("AIza") || !config.appId.includes(":")) {
    invalid.push("appId");
  }
  const configuredValues = Object.entries(config).filter(([, value]) => Boolean(value));
  const duplicates = configuredValues
    .filter(([, value], index, values) => values.findIndex(([, candidate]) => candidate === value) !== index)
    .map(([field]) => field);
  for (const field of duplicates) if (!invalid.includes(field)) invalid.push(field);

  if (invalid.length) {
    const names = invalid.map(field => environmentNames[field] || field).join(", ");
    throw new Error(`Configuração do Firebase inválida. Confira na Vercel: ${names}.`);
  }
  return config;
}
