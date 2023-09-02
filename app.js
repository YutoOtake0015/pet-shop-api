require("dotenv").config();
const express = require("express");
const app = express();
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
app.use(express.json());

// Get all pets
app.get("/pet", (req, res) => {
  const db = dbConnect();

  // Base information
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

    // Add photo_urls to the response
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

      // Disconnect from database
      db.close();
    });
  });
});

// Post a pet
app.post("/pet", (req, res) => {
  const db = dbConnect();

  // Get request body
  const id = req.body.id;
  const category = req.body.category ? req.body.category : null;
  const name = req.body.name ? req.body.name : "";
  const photoUrls = req.body.photoUrls ? req.body.photoUrls : null;
  const tags = req.body.tags ? req.body.tags : null;
  const status = req.body.status ? req.body.status : "";

  const promise_addPets = new Promise((resolve, reject) => {
    // Add pets
    const sql_addPets = `
    INSERT INTO pets (category_id, name, status)
    VALUES ("${category.id}", "${name}", "${status}");`;

    resolve(sql_addPets);
  });

  const promise_addTags = new Promise((resolve, reject) => {
    // Add tags
    let sql_addTags = "INSERT INTO tags (id, name) VALUES";
    tags.forEach((tag, index) => {
      const tag_id = tag.id;
      const tag_name = tag.name;
      const sql_right_addTags = `("${tag_id}", "${tag_name}")`;

      sql_addTags += index === 0 ? sql_right_addTags : "," + sql_right_addTags;
    });

    resolve(sql_addTags);
  });

  // Add pet_tags
  const promise_addPetTags = new Promise((resolve, reject) => {
    // Add tags
    let sql_addPetTags = "INSERT INTO pet_tags (pet_id, tag_id) VALUES";
    tags.forEach((tag, index) => {
      const tag_id = tag.id;
      const sql_right_addPetTags = `("${id}", "${tag_id}")`;

      sql_addPetTags +=
        index === 0 ? sql_right_addPetTags : "," + sql_right_addPetTags;
    });

    resolve(sql_addPetTags);
  });

  // Add categories
  const promise_addCategories = new Promise((resolve, reject) => {
    // Add tags
    let sql_addCategories = "INSERT INTO categories (id, name) VALUES";
    const category_id = category.id;
    const category_name = category.name;
    const sql_right_addCategories = `("${category_id}", "${category_name}")`;

    sql_addCategories += sql_right_addCategories;

    resolve(sql_addCategories);
  });

  // Add pet_photos
  const promise_addPetPhotos = new Promise((resolve, reject) => {
    // Add tags
    let sql_addPetPhotos = "INSERT INTO pet_photos (pet_id, photo_url) VALUES";
    photoUrls.forEach((photoUrl, index) => {
      const sql_right_addPetPhotos = `("${id}", "${photoUrl}")`;

      sql_addPetPhotos +=
        index === 0 ? sql_right_addPetPhotos : "," + sql_right_addPetPhotos;
    });
    resolve(sql_addPetPhotos);
  });

  Promise.all([
    promise_addPets,
    promise_addTags,
    promise_addPetTags,
    promise_addCategories,
    promise_addPetPhotos,
  ]).then((queries) => {
    queries.forEach((query) => {
      db.run(query);
    });

    // Disconnect from database
    res.redirect("/pet");
    db.close();
  });
});

// Search a pets by status
app.get("/pet/findByStatus", (req, res) => {
  const db = dbConnect();

  // Get request body
  const status = req.query.status;

  // Base information
  const sql_getPets = `
    SELECT
       p.id petID,
       p.category_id categoryID,
       c.name categoryName,
       p.name petName,
       p.status petStatus
    FROM pets p 
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE status = ?;`;

  // Tags
  const sql_getTags = `
    SELECT 
       t.id tagID,
       t.name tagName
    FROM tags t
    JOIN pet_tags pt ON pt.tag_id = t.id
    WHERE pt.pet_id = ? `;

  // Phot Urls
  const sql_getPetPhotos = `
    SELECT 
      pp.photo_url photoURL
    FROM pet_photos pp
    WHERE pp.pet_id = ? `;

  // Create base information
  db.all(sql_getPets, [status], (err, rows) => {
    const formattedResponse = rows.map((row) => ({
      id: row.petID,
      category: { id: row.categoryID, name: row.categoryName },
      name: row.petName,
      tags: [],
      status: row.petStatus,
      photoUrls: [],
    }));

    // Add tags to the response
    const promise_getTags = formattedResponse.map((pet) => {
      return new Promise((resolve, reject) => {
        db.all(sql_getTags, [pet.id], (err, tags) => {
          pet.tags = tags.map((tag) => ({ id: tag.tagID, name: tag.tagName }));
          resolve();
        });
      });
    });

    // Add photo_urls to the response
    const promises_getPhotUrl = formattedResponse.map((pet) => {
      return new Promise((resolve, reject) => {
        db.all(sql_getPetPhotos, [pet.id], (err, photos) => {
          pet.photoUrls = photos.map((photo) => photo.photoURL);
          resolve();
        });
      });
    });

    // After all promises, respond and close DB.
    Promise.all([...promise_getTags, ...promises_getPhotUrl]).then(() => {
      res.json(formattedResponse);

      // Disconnect from database
      db.close();
    });
  });
});

// Search a pets by tags
app.get("/pet/findByTags", (req, res) => {
  const db = dbConnect();

  // Get request body
  const tags = req.query.tags;
  const tagArray = tags.split(",");

  // Get the tag's ids from the request parameters
  const tagsPlaceholder = tagArray.map(() => "?").join(", ");
  const sql_getTags = `
    SELECT 
        DISTINCT id tagID,
        name tagName
    FROM tags
    WHERE name IN (${tagsPlaceholder});`;

  db.all(sql_getTags, tagArray, (err, tags) => {
    const tag_ids = tags.map((tag) => tag.tagID);

    // Get pet_id from pet_tags using tag's id
    const tagIdsOfPetTags = tag_ids.map(() => "?").join(", ");
    const sql_getPetIds = `
      SELECT
          DISTINCT pt.pet_id petId
      FROM pet_tags pt
      JOIN tags t ON t.id = pt.tag_id
      WHERE pt.tag_id IN (${tagIdsOfPetTags})
      ORDER BY petId;`;

    db.all(sql_getPetIds, tag_ids, (err, petIds) => {
      // Create base information
      const petIdsOfPetTags = petIds.map(() => "?").join(", ");
      const sql_getPets = `
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

      const pet_ids = Object.values(petIds);
      const getPetIdArray = () => {
        let petIdArray = [];
        for (let obj of petIds) {
          petIdArray.push(obj.petId);
        }
        return petIdArray;
      };

      db.all(sql_getPets, getPetIdArray(), (err, pets) => {
        const formattedResponse = pets.map((pet) => ({
          id: pet.petID,
          category: { id: pet.categoryID, name: pet.categoryName },
          name: pet.petName,
          tags: [],
          status: pet.petStatus,
          photoUrls: [],
        }));

        // Add tags to the response
        const sql_getTags = `
        SELECT 
        DISTINCT t.id tagID,
           t.name tagName
        FROM tags t
        JOIN pet_tags pt ON pt.tag_id = t.id
        WHERE pt.pet_id = ? `;

        const promise_getTags = formattedResponse.map((pet) => {
          return new Promise((resolve, reject) => {
            db.all(sql_getTags, [pet.id], (err, tags) => {
              pet.tags = tags.map((tag) => ({
                id: tag.tagID,
                name: tag.tagName,
              }));
              resolve();
            });
          });
        });

        // Add photo_urls to the response
        const sql_getPetPhotos = `
        SELECT 
          pp.photo_url photoURL
        FROM pet_photos pp
        WHERE pp.pet_id = ? `;

        const promises_getPhotUrls = formattedResponse.map((pet) => {
          return new Promise((resolve, reject) => {
            db.all(sql_getPetPhotos, [pet.id], (err, photos) => {
              pet.photoUrls = photos.map((photo) => photo.photoURL);
              resolve();
            });
          });
        });

        // After all promises, respond and close DB.
        Promise.all([...promise_getTags, ...promises_getPhotUrls]).then(() => {
          res.json(formattedResponse);

          // Disconnect from database
          db.close();
        });
      });
    });
  });
});

// Search a pet by petId
app.get("/pet/:id", (req, res) => {
  const db = dbConnect();
  const id = req.params.id;

  //   Base information
  const sql = `
    SELECT
       p.id petID,
       p.category_id categoryID,
       c.name categoryName,
       p.name petName,
       p.status petStatus
    FROM pets p 
    JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?;`;

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
  db.get(sql, [id], (err, row) => {
    const formattedResponse = {
      id: row.petID,
      category: { id: row.categoryID, name: row.categoryName },
      name: row.petName,
      status: row.petStatus,
    };

    const promises_getTags = new Promise((resolve, reject) => {
      db.all(sqlTags, [formattedResponse.id], (err, tags) => {
        formattedResponse.tags = tags.map((tag) => ({
          id: tag.tagID,
          name: tag.tagName,
        }));
        resolve();
      });
    });

    const promises_getPhotUrl = new Promise((resolve, reject) => {
      db.all(sqlPhots, [formattedResponse.id], (err, photos) => {
        formattedResponse.photoUrls = photos.map((photo) => photo.photoURL);
        resolve();
      });
    });

    // After all promises, respond and close DB.
    Promise.all([promises_getTags, promises_getPhotUrl]).then(() => {
      res.json(formattedResponse);

      //  Disconnect from database
      db.close();
    });
  });
});

// Change a pet by petId
app.post("/pet/:id", (req, res) => {
  const db = dbConnect();

  // Get request
  const id = req.params.id;
  const name = req.body.name ? req.body.name : "";
  const status = req.body.status ? req.body.status : "";

  const sql_changePet = `
    UPDATE pets SET name = ?, status = ?
    WHERE id = ? ;`;

  db.run(sql_changePet, [name, status, id]);

  res.status(204).end();
  // Disconnect from database
  db.close();
});

// Delete a pet by petId
app.delete("/pet/:id", (req, res) => {
  const db = dbConnect();

  // Get parameter
  const id = req.params.id;

  const sql_deletePet = `
    DELETE FROM pets 
    WHERE id = ? ;`;

  db.run(sql_deletePet, [id]);

  res.status(204).end();
  // Disconnect from database
  db.close();
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT);
