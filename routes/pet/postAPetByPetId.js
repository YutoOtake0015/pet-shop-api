require("dotenv").config();
const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3");

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

  // Check request's id
  let idError = false;
  const num = Number(id);
  if (isNaN(num)) {
    return res.status(400).json({ error: "Invalid ID supplied" });
    db.close();
    idError = true;
  }

  if (!idError) {
    // Check requested data exists in the table
    let foundPet = false;
    const selectRequestPet = `SELECT COUNT(*) count FROM pets WHERE id = ?;`;
    const promise_checkRequest = new Promise((resolve, reject) => {
      db.get(selectRequestPet, [id], (err, pet) => {
        if (pet.count === 0) {
          foundPet = true;
        }
        resolve();
      });
    });

    promise_checkRequest.then(() => {
      if (foundPet) {
        return res.status(404).json({ error: "Pet not found" });
        db.close();
      } else {
        // Execute the SQL
        const changePet = `UPDATE pets SET name = ?, status = ? WHERE id = ? ;`;
        db.run(changePet, [name, status, id]);

        res.status(200).json({ message: "Successful Operation" });
        db.close();
      }
    });
  }
});

module.exports = router;
