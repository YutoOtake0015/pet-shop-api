require("dotenv").config();
const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// data
const pets = require("./data/pets");
const categories = require("./data/categories");
const tags = require("./data/tags");
const pet_tags = require("./data/pet_tags");
const pet_photos = require("./data/pet_photos");

// Middleware applied
router.use(express.json());

// Create initial data
router.post("/createSeeds", async (req, res) => {
  await prisma.$transaction(async (prisma) => {
    // categories
    for (let category of categories) {
      await prisma.categories.upsert({
        where: { id: category.id },
        update: {},
        create: category,
      });
    }

    // pets
    for (let pet of pets) {
      await prisma.pets.upsert({
        where: { id: pet.id },
        update: {},
        create: pet,
      });
    }

    // tags
    for (let tag of tags) {
      await prisma.tags.upsert({
        where: { id: tag.id },
        update: {},
        create: tag,
      });
    }

    // pet_tags
    for (let pet_tag of pet_tags) {
      await prisma.Pet_Tags.upsert({
        where: {
          pet_id_tag_id: { pet_id: pet_tag.pet_id, tag_id: pet_tag.tag_id },
        },
        update: {},
        create: pet_tag,
      });
    }

    // pet_photos
    for (let pet_photo of pet_photos) {
      await prisma.Pet_Photos.upsert({
        where: {
          pet_id_photo_url: {
            pet_id: pet_photo.pet_id,
            photo_url: pet_photo.photo_url,
          },
        },
        update: {},
        create: pet_photo,
      });
    }

    return res.status(200).json({ message: "Create pet data" });
  });
});

module.exports = router;
