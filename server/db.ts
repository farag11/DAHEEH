import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";

const { Pool } = pg;

// وضعنا الرابط هنا مباشرة لتجاوز مشكلة عدم قراءة الويندوز لملف الـ .env
const DATABASE_URL = "postgresql://neondb_owner:npg_JY5wiZXT9oFs@ep-dry-tree-ah6jiczk-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";

export const pool = new Pool({
  connectionString: DATABASE_URL,
});

export const db = drizzle(pool, { schema });