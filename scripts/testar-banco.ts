import mysql from "mysql2/promise";
import { certificadoDoAmbiente, opcoesDeConexao } from "../src/db/conexao";

// Confere se o banco de DATABASE_URL responde e se a conexão está criptografada.
async function main() {
  const conexao = await mysql.createConnection(opcoesDeConexao(process.env.DATABASE_URL!, certificadoDoAmbiente()));
  const [[versao]] = (await conexao.query("SELECT VERSION() AS v")) as unknown as [[{ v: string }]];
  const [[cifra]] = (await conexao.query("SHOW SESSION STATUS LIKE 'Ssl_cipher'")) as unknown as [[{ Value: string }]];
  const [tabelas] = await conexao.query("SHOW TABLES");
  console.log(`MySQL ${versao.v} | SSL: ${cifra.Value || "sem SSL"} | tabelas: ${(tabelas as unknown[]).length}`);
  await conexao.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
