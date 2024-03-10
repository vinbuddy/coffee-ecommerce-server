import env from "dotenv";
import mysql from "mysql2";
env.config();
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_DBNAME,
    password: process.env.DB_PASSWORD,
    port: 10082,
};
const pool = mysql.createConnection(dbConfig);

export default pool;
