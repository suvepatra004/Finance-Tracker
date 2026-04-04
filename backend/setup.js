// backend/setup.js
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Client } = pg;

async function setupDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("✅ Connected to Supabase PostgreSQL...");

  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      category VARCHAR(100) NOT NULL,
      description VARCHAR(255),
      date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS income (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      source VARCHAR(100) NOT NULL,
      frequency VARCHAR(20) DEFAULT 'monthly',
      date DATE NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS budgets (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      category VARCHAR(100) NOT NULL,
      monthly_limit DECIMAL(10,2) NOT NULL,
      month VARCHAR(7) NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE (user_id, category, month)
    )`,
  ];

  for (const query of queries) {
    await client.query(query);
    const match = query.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
    console.log(`✅ Table "${match[1]}" created or already exists`);
  }

  console.log("\n🎉 Database setup complete! All 4 tables are ready.");
  await client.end();
  process.exit(0);
}

setupDatabase().catch((err) => {
  console.error("❌ Setup failed:", err);
  process.exit(1);
});
