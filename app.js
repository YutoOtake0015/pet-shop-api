require("dotenv").config();
const express = require("express");
const app = express();
const sqlite3 = require("sqlite3");

// Connect to database
const dbFile = "database.sqlite3";
const dbConnect = () => new sqlite3.Database(dbFile);

// Middleware applied
app.use(express.json());

// Get all pets
app.get("/pet", (req, res) => {
  const db = dbConnect();

  //   Base information
  const sql = `
    SELECT
       p.id petID,
       p.category_id categoryID,
       c.name categoryName,
       p.name petName,
       p.status petStatus
    FROM pets p 
    JOIN categories c ON p.category_id = c.id;`;
  // Tags
  const sqlTags = `
    SELECT 
       t.id tagID,
       t.name tagName
    FROM tags t
    JOIN pet_tags pt ON pt.tag_id = t.id
    WHERE pt.pet_id = ? `;

  // Phot Urls
  const sqlPhots = `
    SELECT 
      pp.photo_url photoURL
    FROM pet_photos pp
    WHERE pp.pet_id = ? `;

  // Create base information
  db.all(sql, (err, rows) => {
    const formattedResponse = rows.map((row) => ({
      id: row.petID,
      category: { id: row.categoryID, name: row.categoryName },
      name: row.petName,
      status: row.petStatus,
    }));

    // Add tags to the response
    const promises_getTags = formattedResponse.map((pet) => {
      return new Promise((resolve, reject) => {
        db.all(sqlTags, [pet.id], (err, tags) => {
          pet.tags = tags.map((tag) => ({ id: tag.tagID, name: tag.tagName }));
          resolve();
        });
      });
    });

    // Add phot_urls to the response
    const promises_getPhotUrl = formattedResponse.map((pet) => {
      return new Promise((resolve, reject) => {
        db.all(sqlPhots, [pet.id], (err, photos) => {
          pet.photoUrls = photos.map((photo) => photo.photoURL);
          resolve();
        });
      });
    });

    // After all promises, respond and close DB.
    Promise.all([...promises_getTags, ...promises_getPhotUrl]).then(() => {
      res.json(formattedResponse);

      //  Disconnect from database
      db.close();
    });
  });
});

// Post a pet
app.post("/pet", (req, res) => {
  const db = dbConnect();

  //   Get request body
  const id = req.body.id;
  const category = req.body.category ? req.body.category : null;
  const name = req.body.name ? req.body.name : "";
  const photoUrls = req.body.photoUrls ? req.body.photoUrls : null;
  const tags = req.body.tags ? req.body.tags : null;
  const status = req.body.status ? req.body.status : "";

  //   Add pets
  const sql = `
    INSERT INTO pets (category_id, name, status)
    VALUES ("${category}", "${name}", "${status}");`;

  // Run query
  db.run(sql);

  //  Disconnect from database
  db.close();
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT);
