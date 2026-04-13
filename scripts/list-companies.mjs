import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function list() {
  try {
    const rows = await sql`SELECT name, "hiringSeason" FROM companies ORDER BY rank ASC`;
    console.log(JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await sql.end();
  }
}

list();
