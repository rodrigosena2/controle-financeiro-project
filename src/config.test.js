import { resolveApiBase } from "./config";

test.each(["https://localhost:7091", "https://192.168.1.20:7091", "https://financas.example"])
  ("usa a origem da página em %s sem IP nos componentes", origin => {
    expect(resolveApiBase("/api/", origin)).toBe("/api");
    expect(resolveApiBase(origin + "/api", origin)).toBe("/api");
  });

test.each(["https://outro.example/api", "//outro.example/api", "api", "/api?key=secret"])
  ("configuração incompatível %s é recusada antes de enviar credenciais", base => {
    expect(() => resolveApiBase(base, "https://localhost:7091")).toThrow("mesma origem");
  });
