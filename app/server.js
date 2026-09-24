require("dotenv").config();

const express = require("express");
const mysql = require("mysql2/promise");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
    region: "ap-south-1"
});

async function getS3Css() {
    const command = new GetObjectCommand({
        Bucket: "faizan-3tier-static-2026-0108",
        Key: "static/style.css"
    });

    const response = await s3.send(command);
    return await response.Body.transformToString();
}

const app = express();
const PORT = 3000;

// MySQL connection pool
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 5
});

// Initialize database table and sample data
async function initializeDatabase() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                department VARCHAR(100) NOT NULL
            )
        `);

        const [rows] = await db.query(
            "SELECT COUNT(*) AS count FROM employees"
        );

        if (rows[0].count === 0) {
            await db.query(`
                INSERT INTO employees (name, department)
                VALUES
                ('Rahul Sharma', 'IT'),
                ('Priya Patil', 'HR'),
                ('Amit Verma', 'Finance')
            `);
        }

        console.log("Database initialization successful");
    } catch (error) {
        console.log("Database initialization error:", error.message);
    }
}

// Home page
app.get("/", async (req, res) => {
    let databaseStatus = "Not Connected";
    let employees = [];

        let s3Css = "";

    try {
        s3Css = await getS3Css();
    } catch (error) {
        console.log("S3 CSS error:", error.message);
    }

    try {
        const [rows] = await db.query(
            "SELECT id, name, department FROM employees"
        );

        databaseStatus = "Connected";
        employees = rows;
    } catch (error) {
        console.log("Database connection error:", error.message);
    }

    const employeeRows = employees
        .map(
            (employee) =>
                `<tr>
                    <td>${employee.id}</td>
                    <td>${employee.name}</td>
                    <td>${employee.department}</td>
                </tr>`
        )
        .join("");

    res.send(`
        <html>
            <head>
                <title>AWS 3-Tier Web Application</title>

                <style>
    ${s3Css}

    body {
        margin: 0;
        padding: 40px;
    }

    .container {
        max-width: 700px;
        margin: auto;
        background: white;
        padding: 40px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    h1 {
        color: #232f3e;
    }

    .status {
        color: green;
        font-weight: bold;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
    }

    th, td {
        border: 1px solid #ddd;
        padding: 10px;
        text-align: left;
    }

    th {
        background-color: #232f3e;
        color: white;
    }
</style>
            </head>

            <body>

                <div class="container">

                    <h1>AWS 3-Tier Web Application</h1>

                    <p class="status">
                        Application Status: Running
                    </p>

                    <p>
                        Database Status:
                        <strong>${databaseStatus}</strong>
                    </p>

                    <h2>Employees</h2>

                    <table>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Department</th>
                        </tr>

                        ${employeeRows}
                    </table>

                </div>

            </body>
        </html>
    `);
});

// Health check for Application Load Balancer
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "healthy"
    });
});

// Initialize database, then start application
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Application running on port ${PORT}`);
    });
});