const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = 3000;

app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function prepararBaseDeDatos() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reservas (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      actividad VARCHAR(100) NOT NULL
    )
  `);
}

app.get("/api/saludo", (req, res) => {
  res.json({
    mensaje: "API de reservas funcionando"
  });
});

app.get("/api/reservas", async (req, res) => {
  try {
    const resultado = await pool.query(
      "SELECT * FROM reservas ORDER BY id"
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error("Error al consultar reservas:", error.message);
    res.status(500).json({ error: "Error al consultar la base de datos" });
  }
});

app.post("/api/reservas", async (req, res) => {
  const { nombre, actividad } = req.body;

  if (!nombre || !actividad) {
    return res.status(400).json({
      error: "Debes indicar nombre y actividad"
    });
  }

  try {
    const resultado = await pool.query(
      "INSERT INTO reservas (nombre, actividad) VALUES ($1, $2) RETURNING *",
      [nombre, actividad]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error("Error al crear reserva:", error.message);
    res.status(500).json({ error: "Error al guardar la reserva" });
  }
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ estado: "ok" });
  } catch (error) {
    res.status(503).json({ estado: "error" });
  }
});

prepararBaseDeDatos()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`API escuchando en el puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("No se pudo preparar la base de datos:", error.message);
    process.exit(1);
  });
