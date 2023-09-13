// require("dotenv").config();
// const express = require("express");
// const router = express.Router();
// const sqlite3 = require("sqlite3");

// // Connect to database
// const dbFile = "database.sqlite3";
// const dbConnect = () => {
//   // Create a new database connection
//   const db = new sqlite3.Database(dbFile);

//   // Enable foreign key constraints for this connection
//   db.run("PRAGMA foreign_keys=ON");

//   return db;
// };

// // Middleware applied
// router.use(express.json());

// // Change a pet's information by petId
// router.put("/", async (req, res) => {
//   // Get request
//   const id = req.body.id;
//   const category = req.body.category ? req.body.category : null;
//   const name = req.body.name ? req.body.name : "";
//   const photoUrls = req.body.photoUrls ? req.body.photoUrls : null;
//   const tags = req.body.tags ? req.body.tags : null;
//   const status = req.body.status ? req.body.status : "";

//   // Check datatype of id
//   let idError = false;
//   const num = Number(id);
//   if (isNaN(num)) {
//     return res
//       .status(400)
//       .json({ error: "Bad Request", message: "Invalid ID supplied" });
//     idError = true;
//   }

//   // Check datatype of other requests
//   let invalidType = false;
//   let invalidRequests = [];
//   if (typeof category.id !== "number" || typeof category.name !== "string") {
//     invalidType = true;
//     invalidRequests.push("category");
//   }
//   if (typeof name !== "string") {
//     invalidType = true;
//     invalidRequests.push("name");
//   }
//   if (!photoUrls.every((item) => typeof item === "string")) {
//     invalidType = true;
//     invalidRequests.push("photoUrl");
//   }

//   for (let tag of tags) {
//     if (typeof tag.id !== "number" || typeof tag.name !== "string") {
//       invalidType = true;
//       invalidRequests.push("tags");
//     }
//   }
//   if (typeof status !== "string") {
//     invalidType = true;
//     invalidRequests.push("status");
//   }
//   if (invalidType) {
//     return res
//       .status(405)
//       .json({ error: "Bad Request", message: invalidRequests });
//   }

//   if (!idError) {
//     const db = dbConnect();
//     // Check requested data exists in the table
//     let notFoundPet = false;
//     const selectRequestPet = `SELECT COUNT(*) count FROM pets WHERE id = ?;`;
//     const promise_checkRequestPet = await new Promise((resolve, reject) => {
//       db.get(selectRequestPet, [id], (err, pet) => {
//         if (pet.count === 0) {
//           notFoundPet = true;
//         }
//         resolve();
//       });
//     });

//     await promise_checkRequestPet;
//     if (notFoundPet) {
//       db.close();
//       return res
//         .status(404)
//         .json({ error: "Not Found", message: "Pet not found" });
//     }

//     // Check requested data exists in the table
//     let notFoundCategory = false;
//     const selectRequestCategory = `SELECT COUNT(*) count FROM categories WHERE id = ?;`;
//     const promise_checkRequestCategoryId = await new Promise(
//       (resolve, reject) => {
//         db.get(selectRequestCategory, [category.id], (err, pet) => {
//           if (pet.count === 0) {
//             notFoundCategory = true;
//           }
//           resolve();
//         });
//       },
//     );

//     await promise_checkRequestCategoryId;
//     if (notFoundCategory) {
//       db.close();
//       return res
//         .status(404)
//         .json({ error: "Not Found", message: "Category not found" });
//     }

//     // Update pets record by id
//     const promise_updatePets = await new Promise((resolve, reject) => {
//       // Create SQL
//       const updatePets = `
//               UPDATE pets
//               SET
//                 category_id = ${category.id} ,
//                 name = "${name}" ,
//                 status = "${status}"
//               WHERE id = ${id};`;

//       resolve(updatePets);
//     });

//     // Delete and update pet_tags by id
//     // Delete pet_tags
//     const promise_deleteTags = await new Promise((resolve, reject) => {
//       // Create SQL
//       const deletePetTags = `DELETE FROM pet_tags WHERE pet_id = ${id};`;
//       resolve(deletePetTags);
//     });

//     // Insert pet_tags
//     const promise_insertTags = new Promise((resolve, reject) => {
//       // Create SQL
//       let insertPetTags = "INSERT INTO pet_tags (pet_id, tag_id) VALUES";
//       tags.forEach((tag, index) => {
//         const valuesToPetTags = ` (${id}, ${tag.id})`;
//         insertPetTags += index === 0 ? valuesToPetTags : "," + valuesToPetTags;
//       });
//       insertPetTags += ";";

//       resolve(insertPetTags);
//     });

//     // Delete and update pet_photos by id
//     // Delete pet_photos
//     const promise_deletePetPhotos = await new Promise((resolve, reject) => {
//       // Create SQL
//       const deletePetPhotos = `DELETE FROM pet_photos WHERE pet_id = '${id}'`;
//       resolve(deletePetPhotos);
//     });

//     // Insert pet_photos
//     const promise_insertPetPhotos = new Promise((resolve, reject) => {
//       // Create SQL
//       let insertPetPhotos = "INSERT INTO pet_photos (pet_id, photo_url) VALUES";
//       photoUrls.forEach((photoUrl, index) => {
//         const valuesToPetPhotos = `(${id}, "${photoUrl}")`;
//         insertPetPhotos +=
//           index === 0 ? valuesToPetPhotos : "," + valuesToPetPhotos;
//       });
//       insertPetPhotos += ";";

//       resolve(insertPetPhotos);
//     });

//     // After all promises and respond
//     Promise.all([
//       promise_updatePets,
//       promise_deleteTags,
//       promise_insertTags,
//       promise_deletePetPhotos,
//       promise_insertPetPhotos,
//     ]).then((queries) => {
//       const runQuery = async (queries) =>
//         await new Promise(() => {
//           for (let query of queries) {
//             db.run(query);
//           }
//         });
//       runQuery(queries);

//       // Response
//       const responseObject = {
//         id: id,
//         category: category,
//         name: name,
//         photoUrls: photoUrls,
//         tags: tags,
//         status: status,
//       };

//       res.status(200).json(responseObject);
//       db.close();
//     });
//   }
// });

// module.exports = router;
