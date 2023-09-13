require("dotenv").config();
const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// data
const pets = require("./data/pets");
const categories = require("./data/categories");
const tags = require("./data/tags");
const petTags = require("./data/petTags");
const petPhotos = require("./data/petPhotos");

// Middleware applied
router.use(express.json());

// Create initial data
router.post("/createDummy", async (req, res) => {
  await prisma.$transaction(async (prisma) => {
    // Categories
    await prisma.categories.createMany({
      data: categories,
    });

    // Pets
    await prisma.pets.createMany({
      data: pets,
    });

    // Tags
    await prisma.tags.createMany({
      data: tags,
    });

    //  PetTags
    await prisma.petTags.createMany({
      data: petTags,
    });

    // PetPhotos
    await prisma.petPhotos.createMany({
      data: petPhotos,
    });

    return res.status(200).json({ message: "Create pet data" });
  });
});

module.exports = router;
