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

// 1: ****************************************************************
// Get all pets
app.get("/pet", (req, res) => {
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
      pp.photo_url photoURL
    FROM pet_photos pp
    WHERE pp.pet_id = ? `;

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
      res.json(formattedResponse);
      db.close();
    });
  });
});

// 2: ****************************************************************
// Post a new pet
app.post("/pet", (req, res) => {
  const db = dbConnect();

  // Get request
  const id = req.body.id;
  const category = req.body.category ? req.body.category : null;
  const name = req.body.name ? req.body.name : "";
  const photoUrls = req.body.photoUrls ? req.body.photoUrls : null;
  const tags = req.body.tags ? req.body.tags : null;
  const status = req.body.status ? req.body.status : "";

  // Add information to pets
  const promise_insertPets = new Promise((resolve, reject) => {
    // Create SQL
    const insertPets = `
    INSERT INTO pets (category_id, name, status)
    VALUES ("${category.id}", "${name}", "${status}");`;

    resolve(insertPets);
  });

  // Add information to tags
  const promise_insertTags = new Promise((resolve, reject) => {
    // Create SQL
    let insertTags = "INSERT INTO tags (id, name) VALUES";
    tags.forEach((tag, index) => {
      const valuesToTags = `("${tag.id}", "${tag.name}")`;
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
      const valuesToPetTags = `("${id}", "${tag_id}")`;

      insertPetTags += index === 0 ? valuesToPetTags : "," + valuesToPetTags;
    });
    insertPetTags += ";";

    resolve(insertPetTags);
  });

  // Add information to categories
  const promise_insertCategories = new Promise((resolve, reject) => {
    // Create SQL
    let insertCategories = `INSERT INTO categories (id, name) VALUES ("${category.id}", "${category.name}")`;

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

  // After all promises, respond and close DB.
  Promise.all([
    promise_insertPets,
    promise_insertTags,
    promise_insertPetTags,
    promise_insertCategories,
    promise_insertPetPhotos,
  ]).then((queries) => {
    queries.forEach((query) => {
      db.run(query);
    });

    res.redirect("/pet");
    db.close();
  });
});

// 3: ****************************************************************
// Change a pet's information by petId
app.put("/pet", (req, res) => {
  const db = dbConnect();

  // Get request
  const id = req.body.id;
  const category = req.body.category ? req.body.category : null;
  const name = req.body.name ? req.body.name : "";
  const photoUrls = req.body.photoUrls ? req.body.photoUrls : null;
  const tags = req.body.tags ? req.body.tags : null;
  const status = req.body.status ? req.body.status : "";

  // Update pets record by id
  const promise_updatePets = new Promise((resolve, reject) => {
    // Create SQL
    const updatePets = `
    UPDATE pets
    SET 
      category_id = ${category.id} ,
      name = "${name}" ,
      status = "${status}" 
    WHERE id = ${id};`;

    resolve(updatePets);
  });

  // Delete and update pet_tags by id
  // Delete pet_tags
  const promise_deleteTags = new Promise((resolve, reject) => {
    // Create SQL
    const deletePetTags = `DELETE FROM pet_tags WHERE pet_id = ${id};`;
    resolve(deletePetTags);
  });

  // Insert pet_tags
  const promise_insertTags = new Promise((resolve, reject) => {
    // Create SQL
    let insertPetTags = "INSERT INTO pet_tags (pet_id, tag_id) VALUES";
    tags.forEach((tag, index) => {
      const valuesToPetTags = ` (${id}, ${tag.id})`;
      insertPetTags += index === 0 ? valuesToPetTags : "," + valuesToPetTags;
    });
    insertPetTags += ";";

    resolve(insertPetTags);
  });

  // Delete and update pet_photos by id
  // Delete pet_photos
  const promise_deletePetPhotos = new Promise((resolve, reject) => {
    // Create SQL
    const deletePetPhotos = `DELETE FROM pet_photos WHERE pet_id = '${id}'`;
    resolve(deletePetPhotos);
  });

  // Insert pet_photos
  const promise_insertPetPhotos = new Promise((resolve, reject) => {
    // Create SQL
    let insertPetPhotos = "INSERT INTO pet_photos (pet_id, photo_url) VALUES";
    photoUrls.forEach((photoUrl, index) => {
      const valuesToPetPhotos = `(${id}, "${photoUrl}")`;
      insertPetPhotos +=
        index === 0 ? valuesToPetPhotos : "," + valuesToPetPhotos;
    });
    insertPetPhotos += ";";

    resolve(insertPetPhotos);
  });

  // After all promises, respond and close DB.
  Promise.all([
    promise_updatePets,
    promise_deleteTags,
    promise_insertTags,
    promise_deletePetPhotos,
    promise_insertPetPhotos,
  ]).then((queries) => {
    queries.forEach((query) => {
      db.run(query);
    });

    res.redirect("/pet");
    db.close();
  });
});

// 4: ****************************************************************
// Search a pets by status
app.get("/pet/findByStatus", (req, res) => {
  const db = dbConnect();

  // Get request
  const status = req.query.status;

  // SELECT pets' information using status
  const selectPets = `
    SELECT
       p.id petID,
       p.category_id categoryID,
       c.name categoryName,
       p.name petName,
       p.status petStatus
    FROM pets p 
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = ?;`;

  // SELECT tags's information using pet_id
  const selectTags = `
    SELECT 
       t.id tagID,
       t.name tagName
    FROM tags t
    JOIN pet_tags pt ON pt.tag_id = t.id
    WHERE pt.pet_id = ? `;

  // SELECT pet_photos'information using pet_id
  const selectPetPhotos = `
    SELECT 
      pp.photo_url photoURL
    FROM pet_photos pp
    WHERE pp.pet_id = ? `;

  // Create base information
  db.all(selectPets, [status], (err, pets) => {
    const formattedResponse = pets.map((pet) => ({
      id: pet.petID,
      category: { id: pet.categoryID, name: pet.categoryName },
      name: pet.petName,
      tags: [],
      status: pet.petStatus,
      photoUrls: [],
    }));

    // Add tags to the response
    const promise_getTags = formattedResponse.map((pet) => {
      return new Promise((resolve, reject) => {
        db.all(selectTags, [pet.id], (err, tags) => {
          pet.tags = tags.map((tag) => ({ id: tag.tagID, name: tag.tagName }));
          resolve();
        });
      });
    });

    // Add photo_urls to the response
    const promises_getPhotUrl = formattedResponse.map((pet) => {
      return new Promise((resolve, reject) => {
        db.all(selectPetPhotos, [pet.id], (err, photos) => {
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

// 5: ****************************************************************
// Search a pets by tags
app.get("/pet/findByTags", (req, res) => {
  const db = dbConnect();

  // Get request body
  const tags = req.query.tags;
  const tagArray = tags.split(",");

  // Get the tag's ids from the request parameters
  const tagsPlaceholder = tagArray.map(() => "?").join(", ");
  const selectTags = `
    SELECT 
        DISTINCT id tagID,
        name tagName
    FROM tags
    WHERE name IN (${tagsPlaceholder});`;

  // Get pet_id from pet_tags using tag's id
  db.all(selectTags, tagArray, (err, tags) => {
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
          pp.photo_url photoURL
        FROM pet_photos pp
        WHERE pp.pet_id = ? `;

        const promises_getPhotUrls = formattedResponse.map((pet) => {
          return new Promise((resolve, reject) => {
            db.all(selectPetPhotos, [pet.id], (err, photos) => {
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

// 6: ****************************************************************
// Search a pet by petId
app.get("/pet/:id", (req, res) => {
  const db = dbConnect();
  const id = req.params.id;

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
    pp.photo_url photoURL
  FROM pet_photos pp
  WHERE pp.pet_id = ? `;

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
        formattedResponse.photoUrls = photos.map((photo) => photo.photoURL);
        resolve();
      });
    });

    // After all promises, respond and close DB.
    Promise.all([promises_getTags, promises_getPhotUrl]).then(() => {
      res.json(formattedResponse);
      db.close();
    });
  });
});

// 7: ****************************************************************
// Change a petName and petStatus  by petId
app.post("/pet/:id", (req, res) => {
  const db = dbConnect();

  // Get request
  const id = req.params.id;
  const name = req.body.name ? req.body.name : "";
  const status = req.body.status ? req.body.status : "";

  // Execute the SQL
  const changePet = `
    UPDATE pets SET name = ?, status = ?
    WHERE id = ? ;`;
  db.run(changePet, [name, status, id]);

  res.status(204).end();
  db.close();
});

// 8: ****************************************************************
// Delete a pet by petId
app.delete("/pet/:id", (req, res) => {
  const db = dbConnect();

  // Get request
  const id = req.params.id;

  // Execute the SQL
  const deletePet = `
    DELETE FROM pets 
    WHERE id = ? ;`;
  db.run(deletePet, [id]);

  res.status(204).end();
  db.close();
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT);
