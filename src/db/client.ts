import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const isBuild = process.env.NEXT_PHASE === "phase-production-build";

if (!url && !isBuild) {
  throw new Error("TURSO_DATABASE_URL is not set");
}

export const libsql = createClient({
  url: url ?? "libsql://build-placeholder.invalid",
  authToken,
});
export const db = drizzle(libsql, { schema });

export type DB = typeof db;
