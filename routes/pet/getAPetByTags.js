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

// Search a pets by tags
router.get("/findByTags", (req, res) => {
  const db = dbConnect();

  // Get request
  const tags = req.query.tags;
  const tagsArray = tags.split(",");

  // Check request's tags
  let tagsCount = 0;
  let foundInValidTag = false;
  let invalidTags = false;
  const selectTagName = `SELECT COUNT(*) count FROM tags WHERE tags.name = ?;`;
  for (let tagName of tagsArray) {
    db.get(selectTagName, [tagName], (err, tag) => {
      if (tag.count === 0) {
        foundInValidTag = true;
      }
      tagsCount++;

      if (foundInValidTag && tagsCount === tagsArray.length) {
        return res.status(400).json({ error: "Invalid tag value" });
        invalidTags = true;
      }
    });
  }

  if (!invalidTags) {
    // Get the tag's ids from the request parameters
    const tagsPlaceholder = tagsArray.map(() => "?").join(", ");
    const selectTags = `
      SELECT 
          DISTINCT id tagID,
          name tagName
      FROM tags
      WHERE name IN (${tagsPlaceholder});`;

    // Get pet_id from pet_tags using tag's id
    db.all(selectTags, tagsArray, (err, tags) => {
      // Create SQL
      const tag_ids = tags.map((tag) => tag.tagID);
      const tagIdsOfPetTags = tag_ids.map(() => "?").join(", ");
      const selectPetIdsOfPetTags = `
          SELECT
              DISTINCT pt.pet_id petId
          FROM pet_tags pt
          JOIN tags t ON t.id = pt.tag_id
          WHERE pt.tag_id IN (${tagIdsOfPetTags})
          ORDER BY petId;`;

      // Get pets using petIds
      db.all(selectPetIdsOfPetTags, tag_ids, (err, petIds) => {
        // Create SQL
        const petIdsOfPetTags = petIds.map(() => "?").join(", ");
        const selectPets = ` 
              SELECT
                  DISTINCT p.id petID,
                  p.category_id categoryID,
                  c.name categoryName,
                  p.name petName,
                  p.status petStatus
              FROM pets p 
              LEFT JOIN categories c ON p.category_id = c.id
              JOIN pet_tags pt ON pt.pet_id = p.id
              WHERE p.id IN (${petIdsOfPetTags});`;

        const getPetIdArray = () => {
          let petIdArray = [];
          for (let obj of petIds) {
            petIdArray.push(obj.petId);
          }
          return petIdArray;
        };

        // Create base response
        db.all(selectPets, getPetIdArray(), (err, pets) => {
          const formattedResponse = pets.map((pet) => ({
            id: pet.petID,
            category: { id: pet.categoryID, name: pet.categoryName },
            name: pet.petName,
            tags: [],
            status: pet.petStatus,
            photoUrls: [],
          }));
          // Add tags to the response
          const selectTags = `
              SELECT 
                  DISTINCT t.id tagID,
                  t.name tagName
              FROM tags t
              JOIN pet_tags pt ON pt.tag_id = t.id
              WHERE pt.pet_id = ? `;

          const promise_getTags = formattedResponse.map((pet) => {
            return new Promise((resolve, reject) => {
              db.all(selectTags, [pet.id], (err, tags) => {
                pet.tags = tags.map((tag) => ({
                  id: tag.tagID,
                  name: tag.tagName,
                }));
                resolve();
              });
            });
          });

          // Add photo_urls to the response
          const selectPetPhotos = `
              SELECT 
              photo_url photoURL
              FROM pet_photos
              WHERE pet_id = ? `;

          const promises_getPhotUrls = formattedResponse.map((pet) => {
            return new Promise((resolve, reject) => {
              db.all(selectPetPhotos, [pet.id], (err, photos) => {
                pet.photoUrls = photos.map((photo) => photo.photoURL);
                resolve();
              });
            });
          });

          // After all promises and respond
          Promise.all([...promise_getTags, ...promises_getPhotUrls]).then(
            () => {
              res.status(200).json(formattedResponse);
            },
          );
        });
      });
    });
  }
  db.close();
});

module.exports = router;
