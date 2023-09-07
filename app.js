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

// 2: ****************************************************************
// Post a new pet
app.post("/pet", async (req, res) => {
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

// 3: ****************************************************************
// Change a pet's information by petId
app.put("/pet", async (req, res) => {
  // Get request
  const id = req.body.id;
  const category = req.body.category ? req.body.category : null;
  const name = req.body.name ? req.body.name : "";
  const photoUrls = req.body.photoUrls ? req.body.photoUrls : null;
  const tags = req.body.tags ? req.body.tags : null;
  const status = req.body.status ? req.body.status : "";

  // Check datatype of id
  let idError = false;
  const num = Number(id);
  if (isNaN(num)) {
    return res
      .status(400)
      .json({ error: "Bad Request", message: "Invalid ID supplied" });
    idError = true;
  }

  // Check datatype of other requests
  let invalidType = false;
  let invalidRequests = [];
  if (typeof category.id !== "number" || typeof category.name !== "string") {
    invalidType = true;
    invalidRequests.push("category");
  }
  if (typeof name !== "string") {
    invalidType = true;
    invalidRequests.push("name");
  }
  if (!photoUrls.every((item) => typeof item === "string")) {
    invalidType = true;
    invalidRequests.push("photoUrl");
  }

  for (let tag of tags) {
    if (typeof tag.id !== "number" || typeof tag.name !== "string") {
      invalidType = true;
      invalidRequests.push("tags");
    }
  }
  if (typeof status !== "string") {
    invalidType = true;
    invalidRequests.push("status");
  }
  if (invalidType) {
    return res
      .status(405)
      .json({ error: "Bad Request", message: invalidRequests });
  }

  if (!idError) {
    const db = dbConnect();
    // Check requested data exists in the table
    let notFound = false;
    const selectRequestPet = `SELECT COUNT(*) count FROM pets WHERE id = ?;`;
    const promise_checkRequest = await new Promise((resolve, reject) => {
      db.get(selectRequestPet, [id], (err, pet) => {
        if (pet.count === 0) {
          notFound = true;
        }
        resolve();
      });
    });

    await promise_checkRequest;
    if (notFound) {
      res.status(404).json({ error: "Not Found", message: "Pet not found" });
      db.close();
    } else {
      // Update pets record by id
      const promise_updatePets = await new Promise((resolve, reject) => {
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
      const promise_deleteTags = await new Promise((resolve, reject) => {
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
          insertPetTags +=
            index === 0 ? valuesToPetTags : "," + valuesToPetTags;
        });
        insertPetTags += ";";

        resolve(insertPetTags);
      });

      // Delete and update pet_photos by id
      // Delete pet_photos
      const promise_deletePetPhotos = await new Promise((resolve, reject) => {
        // Create SQL
        const deletePetPhotos = `DELETE FROM pet_photos WHERE pet_id = '${id}'`;
        resolve(deletePetPhotos);
      });

      // Insert pet_photos
      const promise_insertPetPhotos = new Promise((resolve, reject) => {
        // Create SQL
        let insertPetPhotos =
          "INSERT INTO pet_photos (pet_id, photo_url) VALUES";
        photoUrls.forEach((photoUrl, index) => {
          const valuesToPetPhotos = `(${id}, "${photoUrl}")`;
          insertPetPhotos +=
            index === 0 ? valuesToPetPhotos : "," + valuesToPetPhotos;
        });
        insertPetPhotos += ";";

        resolve(insertPetPhotos);
      });

      // After all promises and respond
      Promise.all([
        promise_updatePets,
        promise_deleteTags,
        promise_insertTags,
        promise_deletePetPhotos,
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
        db.close();
      });
    }
  }
});

// 4: ****************************************************************
// Search a pets by status
app.get("/pet/findByStatus", (req, res) => {
  const db = dbConnect();

  // Get request
  const status = req.query.status;

  // Check request's status
  let errorFlag = false;
  const availableValues = ["available", "pending", "sold"];
  if (status && !availableValues.includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
    errorFlag = true;
  }

  if (errorFlag) {
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
      photo_url photoURL
    FROM pet_photos 
    WHERE pet_id = ? `;

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
            pet.tags = tags.map((tag) => ({
              id: tag.tagID,
              name: tag.tagName,
            }));
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
        res.status(200).json(formattedResponse);
      });
    });
  }
  db.close();
});

// 5: ****************************************************************
// Search a pets by tags
app.get("/pet/findByTags", (req, res) => {
  const db = dbConnect();

  // Get request
  const tags = req.query.tags;
  const tagsArray = tags.split(",");

  // Check request's tags
  let tagsCount = 0;
  let foundInValidTag = false;
  let errorFlag = false;
  const selectTagName = `SELECT COUNT(*) count FROM tags WHERE tags.name = ?;`;
  for (let tagName of tagsArray) {
    db.get(selectTagName, [tagName], (err, tag) => {
      if (tag.count === 0) {
        foundInValidTag = true;
      }
      tagsCount++;

      if (foundInValidTag && tagsCount === tagsArray.length) {
        return res.status(400).json({ error: "Invalid tag value" });
        errorFlag = true;
      }
    });
  }

  if (errorFlag) {
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

// 6: ****************************************************************
// Search a pet by petId
app.get("/pet/:id", (req, res) => {
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

// 7: ****************************************************************
// Change a petName and petStatus  by petId
app.post("/pet/:id", (req, res) => {
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

// 8: ****************************************************************
// Delete a pet by petId
app.delete("/pet/:id", async (req, res) => {
  // Get request
  const id = req.params.id;

  // Check request's id
  let idError = false;
  const num = Number(id);
  if (isNaN(num)) {
    return res.status(400).json({ error: "Invalid ID supplied" });
    idError = true;
  }

  if (!idError) {
    const db = dbConnect();
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

    await promise_checkRequest.then(() => {
      if (foundPet) {
        return res.status(404).json({ error: "Pet not found" });
      } else {
        // Execute the SQL
        const deletePet = `DELETE FROM pets WHERE id = ? ;`;
        db.run(deletePet, [id]);

        res.status(200).json({ message: `Deleted petId: ${id}` });
      }
    });
    db.close();
  }
});

// Middleware to respond
app.use("/pet/:id", (req, res) => {
  return res.status(405).json({ error: "Invalid input!!" });
});
app.use("/pet", (req, res) => {
  return res.status(405).json({ error: "Invalid input" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT);
