import { firebaseConfig, requireFirebaseConfig } from "./config";

test("expõe todos os campos públicos esperados", () => {
  expect(firebaseConfig).toEqual(expect.objectContaining({
    apiKey: expect.any(String), authDomain: expect.any(String), projectId: expect.any(String),
    storageBucket: expect.any(String), messagingSenderId: expect.any(String),
    appId: expect.any(String), measurementId: expect.any(String)
  }));
});

test("aceita configuração mínima completa", () => {
  const value = { apiKey: "key", authDomain: "app.firebaseapp.com", projectId: "app", appId: "web" };
  expect(requireFirebaseConfig(value)).toBe(value);
});

test.each(["apiKey", "authDomain", "projectId", "appId"])
  ("recusa configuração sem %s", field => {
    const value = { apiKey: "key", authDomain: "app.firebaseapp.com", projectId: "app", appId: "web" };
    value[field] = "";
    expect(() => requireFirebaseConfig(value)).toThrow("Configuração do Firebase incompleta");
  });
