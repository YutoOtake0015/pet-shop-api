require("dotenv").config();
const express = require("express");
const app = express();

// "/pet"
const createInitialPet = require("./routes/pet/seeds/createInitialPet");
const getAllPets = require("./routes/pet/getAllPets");
const postAPet = require("./routes/pet/postAPet");
const getAPetByPetId = require("./routes/pet/getAPetByPetId");
const getAPetByTags = require("./routes/pet/getAPetByTags");
const getAPetByStatus = require("./routes/pet/getAPetByStatus");
const putAPet = require("./routes/pet/putAPet");
const postAPetByPetId = require("./routes/pet/postAPetByPetId");
const deleteAPetByPetId = require("./routes/pet/deleteAPetByPetId");

app.use("/pet", createInitialPet);
app.use("/pet", getAllPets);
app.use("/pet", postAPet);
app.use("/pet", putAPet);
app.use("/pet", getAPetByTags);
app.use("/pet", getAPetByStatus);
app.use("/pet", postAPetByPetId);
app.use("/pet", deleteAPetByPetId);
app.use("/pet", getAPetByPetId);

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
