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

// Search a pet by petId
router.get("/:id", (req, res) => {
  const db = dbConnect();
  // Get request
  const id = req.params.id;

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
        // SELECT pets's information using petId
        const selectPets = `
              SELECT
                  p.id petID,
                  p.category_id categoryID,
                  c.name categoryName,
                  p.name petName,
                  p.status petStatus
              FROM pets p 
              JOIN categories c ON p.category_id = c.id
              WHERE p.id = ?;`;

        // SELECT tag's information using pet_id
        const selectTags = `
              SELECT 
                  t.id tagID,
                  t.name tagName
              FROM tags t
              JOIN pet_tags pt ON pt.tag_id = t.id
              WHERE pt.pet_id = ? `;

        // SELECT pet_photos's information using pet_id
        const selectPetPhots = `
              SELECT 
                  photo_url photoURL
              FROM pet_photos
              WHERE pet_id = ? `;
        // Create base information
        db.get(selectPets, [id], (err, pet) => {
          const formattedResponse = {
            id: pet.petID,
            category: { id: pet.categoryID, name: pet.categoryName },
            name: pet.petName,
            status: pet.petStatus,
          };

          // Add tags's information to the response
          const promises_getTags = new Promise((resolve, reject) => {
            db.all(selectTags, [formattedResponse.id], (err, tags) => {
              formattedResponse.tags = tags.map((tag) => ({
                id: tag.tagID,
                name: tag.tagName,
              }));
              resolve();
            });
          });

          // Add pet_photos's information to the response
          const promises_getPhotUrl = new Promise((resolve, reject) => {
            db.all(selectPetPhots, [formattedResponse.id], (err, photos) => {
              formattedResponse.photoUrls = photos.map(
                (photo) => photo.photoURL,
              );
              resolve();
            });
          });

          // After all promises, respond and close DB.
          Promise.all([promises_getTags, promises_getPhotUrl]).then(() => {
            res.status(200).json(formattedResponse);
            db.close();
          });
        });
      }
    });
  }
});

module.exports = router;
