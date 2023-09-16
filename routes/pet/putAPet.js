const Joi = require("joi");

// Initialize Express for router instance
const express = require("express");
const router = express.Router();

// Initialize Prisma Client instance
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Validation schema for requests
const validateSchema = Joi.object({
  id: Joi.number().integer().required().strict(),
  category: {
    id: Joi.number().integer().required(),
    name: Joi.string().required(),
  },
  name: Joi.string().required(),
  photoUrls: Joi.array().items(Joi.string().uri()).required(),
  tags: Joi.array()
    .items(
      Joi.object({
        id: Joi.number().integer().required(),
        name: Joi.string().required(),
      }),
    )
    .required(),
  status: Joi.string().required(),
});

// Middleware applied
router.use(express.json());

// Change a pet's information by petId
router.put("/", async (req, res) => {
  try {
    // Validate request data
    const { error } = validateSchema.validate(req.body);
    if (error) {
      const errorMessage = error.details[0].message;
      const formattedMessage = errorMessage.replace(/\"/g, "'");
      return res.status(405).json({
        code: 405,
        error: "Bad Request",
        message: `Validation exception: ${formattedMessage}`,
      });
    }

    // Get request
    const { id, category, name, photoUrls, tags, status } = req.body;

    // Check request's "id" is already registered in pets
    const foundPetId = await prisma.pets.count({
      where: { id: Number(id) },
    });
    if (foundPetId === 0) {
      return res.status(400).json({
        code: 400,
        type: "Bad Request",
        message: "Pet ID not found",
      });
    }

    // Update Data
    const updatedData = await prisma.$transaction(async (prisma) => {
      // Update categories
      const updatedCategory = await prisma.categories.upsert({
        where: { name: category.name },
        create: { name: category.name },
        update: { name: category.name },
      });

      // Update pets
      const updatedPet = await prisma.pets.update({
        where: {
          id: Number(id),
        },
        data: {
          name: name,
          status: status,
        },
      });

      // Update tags and petTags
      let updatedTags = [];
      for (let tag of tags) {
        updatedTags[updatedTags.length] = await prisma.tags.upsert({
          where: { name: tag.name },
          create: { name: tag.name },
          update: { name: tag.name },
        });
      }

      // Update petTags
      for (let updatedTag of updatedTags) {
        await prisma.petTags.upsert({
          where: {
            petId_tagId: { petId: updatedPet.id, tagId: updatedTag.id },
          },
          create: { petId: updatedPet.id, tagId: updatedTag.id },
          update: {},
        });
      }

      // Change petPhotos
      let updatedPhotos = [];
      for (let photoUrl of photoUrls) {
        updatedPhotos[updatedPhotos.length] = await prisma.petPhotos.upsert({
          where: {
            petId_photoUrl: {
              petId: updatedPet.id,
              photoUrl: photoUrl,
            },
          },
          create: { petId: updatedPet.id, photoUrl: photoUrl },
          update: {},
        });
      }

      const petData = {
        pet: updatedPet,
        category: updatedCategory,
        tags: updatedTags,
        photoUrls: updatedPhotos.map((photos) => photos.photoUrl),
      };

      return petData;
    });

    // Formatted response
    const responseObject = {
      id: updatedData.pet.id,
      category: {
        id: updatedData.category.id,
        name: updatedData.category.name,
      },
      name: updatedData.pet.name,
      photoUrls: updatedData.photoUrls,
      tags: updatedData.tags,
      status: updatedData.pet.status,
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
