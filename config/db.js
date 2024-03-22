import env from "dotenv";
// import mysql from "mysql2";
import mysql from "mysql2/promise";

env.config();
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_DBNAME,
    password: process.env.DB_PASSWORD,
    port: 10082,
};
// const pool = mysql.createConnection(dbConfig);

async function connectToDB() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        return connection;
    } catch (error) {
        console.log("error: ", error);
        return null;
    }
}
export default connectToDB;
