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

// Post a new pet
router.post("/", async (req, res) => {
  // Check "id" exists in request
  if (!req.body.id || req.body.id === "") {
    return res
      .status(400)
      .json({ error: "Bad Request", message: "id is required" });
  }
  // Connect to database
  const db = dbConnect();

  // Get request
  const id = req.body.id;
  const category = req.body.category ? req.body.category : "";
  const name = req.body.name ? req.body.name : "";
  const photoUrls = req.body.photoUrls ? req.body.photoUrls : "";
  const tags = req.body.tags ? req.body.tags : "";
  const status = req.body.status ? req.body.status : "";

  try {
    // Check request's "id" is already registered in pets
    const sql = `SELECT COUNT(*) count FROM pets WHERE id = '${id}'`;
    const func = await new Promise((resolve, reject) => {
      db.get(sql, (err, pet) => {
        if (pet.count > 0) {
          resolve(true);
        }
        resolve(false);
      });
    });
    if (func) {
      return res
        .status(400)
        .json({ error: "Bad Request", message: "id is already in use" });
    }

    // Add information to pets
    const promise_insertPets = await new Promise((resolve, reject) => {
      // Create SQL
      const insertPets = `
          INSERT INTO pets (id, category_id, name, status)
          VALUES (${id}, ${category.id}, "${name}", "${status}");`;

      resolve(insertPets);
    });

    // Add information to tags
    const promise_insertTags = await new Promise((resolve, reject) => {
      let insertTags = "INSERT INTO tags (id, name) VALUES";
      tags.forEach((tag, index) => {
        const valuesToTags = `(${tag.id}, "${tag.name}")`;
        insertTags += index === 0 ? valuesToTags : "," + valuesToTags;
      });
      insertTags += ";";

      resolve(insertTags);
    });

    // Add information to pet_tags
    const promise_insertPetTags = new Promise((resolve, reject) => {
      // Create SQL
      let insertPetTags = "INSERT INTO pet_tags (pet_id, tag_id) VALUES";
      tags.forEach((tag, index) => {
        const tag_id = tag.id;
        const valuesToPetTags = `(${id}, ${tag_id})`;

        insertPetTags += index === 0 ? valuesToPetTags : "," + valuesToPetTags;
      });
      insertPetTags += ";";

      resolve(insertPetTags);
    });

    // Add information to categories
    const promise_insertCategories = await new Promise((resolve, reject) => {
      // Create SQL
      let insertCategories = `INSERT INTO categories (id, name) VALUES (${category.id}, "${category.name}")`;
      resolve(insertCategories);
    });

    // Add information to pet_photos
    const promise_insertPetPhotos = new Promise((resolve, reject) => {
      // Create SQL
      let insertPetPhotos = "INSERT INTO pet_photos (pet_id, photo_url) VALUES";
      photoUrls.forEach((photoUrl, index) => {
        const valuesToPetPhotos = `("${id}", "${photoUrl}")`;

        insertPetPhotos +=
          index === 0 ? valuesToPetPhotos : "," + valuesToPetPhotos;
      });
      insertPetPhotos += ";";
      resolve(insertPetPhotos);
    });

    // After all promises and respond
    await Promise.all([
      promise_insertCategories,
      promise_insertPets,
      promise_insertTags,
      promise_insertPetTags,
      promise_insertPetPhotos,
    ]).then((queries) => {
      const runQuery = async (queries) =>
        await new Promise(() => {
          for (let query of queries) {
            db.run(query);
          }
        });
      runQuery(queries);

      // Response
      const responseObject = {
        id: id,
        category: category,
        name: name,
        photoUrls: photoUrls,
        tags: tags,
        status: status,
      };

      res.status(200).json(responseObject);
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  } finally {
    db.close();
  }
});

module.exports = router;
