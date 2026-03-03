// backend/setup.js
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQLHOST,
    port: process.env.MYSQLPORT,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    ssl: { rejectUnauthorized: false },
  });

  console.log("✅ Connected to Railway MySQL...");

  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      category VARCHAR(100) NOT NULL,
      description VARCHAR(255),
      date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS income (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      source VARCHAR(100) NOT NULL,
      frequency ENUM('one-time','weekly','monthly') DEFAULT 'monthly',
      date DATE NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS budgets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      category VARCHAR(100) NOT NULL,
      monthly_limit DECIMAL(10,2) NOT NULL,
      month VARCHAR(7) NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
  ];

  for (const query of queries) {
    await connection.execute(query);
    const tableName = query.match(/CREATE TABLE IF NOT EXISTS (\w+)/)[1];
    console.log(`✅ Table "${tableName}" created or already exists`);
  }

  console.log("\n🎉 Database setup complete! All 4 tables are ready.");
  await connection.end();
  process.exit(0);
}

setupDatabase().catch((err) => {
  console.error("❌ Setup failed:", err);
  process.exit(1);
});
