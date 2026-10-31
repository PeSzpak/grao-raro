import { describe, expect, it } from "vitest";
import { opcoesDeConexao } from "./conexao";

describe("opcoesDeConexao", () => {
  it("conexão local sem SSL fica como está", () => {
    expect(opcoesDeConexao("mysql://graoraro:graoraro@127.0.0.1:3307/graoraro")).toEqual({
      host: "127.0.0.1",
      port: 3307,
      user: "graoraro",
      password: "graoraro",
      database: "graoraro",
    });
  });

  it("ssl-mode=REQUIRED do Aiven liga o SSL e confere o certificado quando ele existe", () => {
    const opcoes = opcoesDeConexao("mysql://avnadmin:s%40nha@mysql-x.aivencloud.com:12345/defaultdb?ssl-mode=REQUIRED", "CERTIFICADO");
    expect(opcoes).toEqual({
      host: "mysql-x.aivencloud.com",
      port: 12345,
      user: "avnadmin",
      password: "s@nha",
      database: "defaultdb",
      ssl: { ca: "CERTIFICADO", rejectUnauthorized: true },
    });
  });

  it("sem o certificado, criptografa mas não confere a autoridade", () => {
    expect(opcoesDeConexao("mysql://a:b@h:1/d?ssl-mode=REQUIRED").ssl).toEqual({ rejectUnauthorized: false });
  });
});
