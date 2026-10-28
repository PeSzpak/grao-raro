import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não definida");

// Pool pequeno: cada instância de função da Vercel abre o seu.
export const pool = mysql.createPool({ uri: url, connectionLimit: 5 });
// attachDatabasePool só reconhece o pool de callbacks que fica dentro do wrapper de promises.
attachDatabasePool(pool.pool);

export const db = drizzle(pool);
