require("dotenv").config();
const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3");
const { route } = require("./getAllPets");

// Connect to database
const dbFile = "database.sqlite3";
const dbConnect = () => {
  // Create a new database connection
  const db = new sqlite3.Database(dbFile);

  // Enable foreign key constraints for this connection
  db.run("PRAGMA foreign_keys=ON");

  return db;
};

// Middleware applied
router.use(express.json());

// Change a petName and petStatus  by petId
router.post("/:id", (req, res) => {
  const db = dbConnect();

  // Get request
  const id = req.params.id;
  const name = req.body.name ? req.body.name : "";
  const status = req.body.status ? req.body.status : "";

  // Execute the SQL
  const changePet = `UPDATE pets SET name = ?, status = ? WHERE id = ? ;`;
  db.run(changePet, [name, status, id]);

  res.status(204).end();
  db.close();
});

module.exports = router;
