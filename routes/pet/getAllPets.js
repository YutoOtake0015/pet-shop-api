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

// Get all pets
router.get("/", (req, res) => {
  const db = dbConnect();

  // SELECT pets's information
  const selectPets = `
    SELECT
       p.id petID,
       p.category_id categoryID,
       c.name categoryName,
       p.name petName,
       p.status petStatus
    FROM pets p 
    JOIN categories c ON p.category_id = c.id;`;

  // SELECT tags's information using pet_id
  const selectTags = `
    SELECT 
       t.id tagID,
       t.name tagName
    FROM tags t
    JOIN pet_tags pt ON pt.tag_id = t.id
    WHERE pt.pet_id = ? `;

  // SELECT pet_photos's information using pet_id
  const selectPhots = `
    SELECT 
      photo_url photoURL
    FROM pet_photos 
    WHERE pet_id = ? `;

  // Create base response
  db.all(selectPets, (err, pets) => {
    const formattedResponse = pets.map((pet) => ({
      id: pet.petID,
      category: { id: pet.categoryID, name: pet.categoryName },
      name: pet.petName,
      status: pet.petStatus,
    }));

    // Add pet.tags to the response
    const promises_getTags = formattedResponse.map((pet) => {
      return new Promise((resolve, reject) => {
        db.all(selectTags, [pet.id], (err, tags) => {
          pet.tags = tags.map((tag) => ({ id: tag.tagID, name: tag.tagName }));
          resolve();
        });
      });
    });

    // Add pet.photoUrls to the response
    const promises_getPhotUrl = formattedResponse.map((pet) => {
      return new Promise((resolve, reject) => {
        db.all(selectPhots, [pet.id], (err, photos) => {
          pet.photoUrls = photos.map((photo) => photo.photoURL);
          resolve();
        });
      });
    });

    // After all promises, respond and close DB.
    Promise.all([...promises_getTags, ...promises_getPhotUrl]).then(() => {
      res.status(200).json(formattedResponse);
      db.close();
    });
  });
});

module.exports = router;
