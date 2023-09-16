// Initialize Express for router instance
const express = require("express");
const router = express.Router();

// Initialize Prisma Client instance
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Middleware applied
router.use(express.json());

// Post a new pet
router.post("/", async (req, res) => {
  try {
    // Get request
    const { id, category, name, photoUrls, tags, status } = req.body;

    // Check request's "id" is already registered in pets
    const foundPetId = await prisma.pets.count({
      where: { id },
    });
    if (foundPetId) {
      return res.status(400).json({
        code: 400,
        type: "Bad Request",
        message: "id is already in use",
      });
    }

    const insertedData = await prisma.$transaction(async (prisma) => {
      // Create category
      const insertedCategory = await prisma.categories.upsert({
        where: { name: category.name },
        create: { name: category.name },
        update: { name: category.name },
      });

      // Create pet
      const insertedPet = await prisma.pets.create({
        data: {
          name,
          categoryId: insertedCategory.id,
          status,
        },
      });

      // Create tags
      let insertedTags = [];
      for (let tag of tags) {
        insertedTags[insertedTags.length] = await prisma.tags.upsert({
          where: { name: tag.name },
          create: { name: tag.name },
          update: { name: tag.name },
        });
      }

      //  PetTags
      for (let insertedTag of insertedTags) {
        await prisma.petTags.create({
          data: {
            petId: insertedPet.id,
            tagId: insertedTag.id,
          },
        });
      }

      // PetPhotos
      for (let photoUrl of photoUrls) {
        await prisma.petPhotos.create({
          data: {
            petId: insertedPet.id,
            photoUrl,
          },
        });
      }

      // Return data
      const petData = {
        pet: insertedPet,
        category: insertedCategory,
        photoUrls,
        tags: insertedTags,
      };

      return petData;
    });

    // Formatted response
    const responseObject = {
      id: insertedData.pet.id,
      category: {
        id: insertedData.category.id,
        name: insertedData.category.name,
      },
      name: insertedData.pet.name,
      photoUrls: insertedData.photoUrls,
      tags: insertedData.tags.map((tag) => ({ id: tag.id, name: tag.name })),
      status: insertedData.pet.status,
    };

    res.status(200).json(responseObject);
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({
      code: 500,
      type: "Internal Server Error",
      message: error.message,
    });
  }
});

module.exports = router;
