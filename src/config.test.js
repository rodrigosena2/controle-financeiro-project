import { firebaseConfig, requireFirebaseConfig } from "./config";

test("expõe todos os campos públicos esperados", () => {
  expect(firebaseConfig).toEqual(expect.objectContaining({
    apiKey: expect.any(String), authDomain: expect.any(String), projectId: expect.any(String),
    storageBucket: expect.any(String), messagingSenderId: expect.any(String),
    appId: expect.any(String), measurementId: expect.any(String)
  }));
});

test("aceita configuração mínima completa", () => {
  const value = {
    apiKey: "AIza-example",
    authDomain: "app.firebaseapp.com",
    projectId: "app",
    appId: "1:123:web:abc"
  };
  expect(requireFirebaseConfig(value)).toBe(value);
});

test.each(["apiKey", "authDomain", "projectId", "appId"])
  ("recusa configuração sem %s", field => {
    const value = {
      apiKey: "AIza-example",
      authDomain: "app.firebaseapp.com",
      projectId: "app",
      appId: "1:123:web:abc"
    };
    value[field] = "";
    expect(() => requireFirebaseConfig(value)).toThrow("Configuração do Firebase incompleta");
  });

test("recusa API key copiada para os demais campos", () => {
  const value = {
    apiKey: "AIza-example",
    authDomain: "AIza-example",
    projectId: "AIza-example",
    storageBucket: "AIza-example",
    messagingSenderId: "AIza-example",
    appId: "AIza-example",
    measurementId: "AIza-example"
  };

  expect(() => requireFirebaseConfig(value)).toThrow(
    /REACT_APP_FIREBASE_PROJECT_ID.*REACT_APP_FIREBASE_AUTH_DOMAIN.*REACT_APP_FIREBASE_APP_ID/
  );
});
