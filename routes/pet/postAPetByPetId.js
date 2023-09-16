const Joi = require("joi");

// Initialize Express for router instance
const express = require("express");
const router = express.Router();

// Initialize Prisma Client instance
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Validation schema for requests
const validateSchema = Joi.object({
  name: Joi.string().required(),
  status: Joi.string().required(),
});

// Middleware applied
router.use(express.json());

// Change a petName and petStatus  by petId
router.post("/:id", async (req, res) => {
  try {
    // Get request
    const id = req.params.id;
    const { name, status } = req.body;

    // Validate request data
    const { error } = validateSchema.validate(req.body);
    if (error) {
      const errorMessage = error.details[0].message;
      const formattedMessage = errorMessage.replace(/\"/g, "'");
      return res.status(405).json({
        code: 405,
        error: "Bad Request",
        message: `Invalid input: ${formattedMessage}`,
      });
    }
    console.log("id: ", id);
    // Check request's id
    const num = Number(id);
    if (isNaN(num)) {
      return res.status(400).send({
        code: 400,
        type: "Bad Request",
        message: "Invalid ID supplied",
      });
    }

    // Check requested data exists in the table
    const petCount = await prisma.pets.count({
      where: {
        id: Number(id),
      },
    });
    if (petCount === 0) {
      return res.status(404).send({
        code: 404,
        type: "Not Found",
        message: "Pet not found",
      });
    }

    await prisma.$transaction(async (prisma) => {
      const pet = await prisma.pets.update({
        where: {
          id: Number(id),
        },
        data: {
          name: name,
          status: status,
        },
        select: {
          id: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          name: true,
          petPhotos: {
            select: {
              photoUrl: true,
            },
          },
          petTags: {
            select: {
              tags: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          status: true,
        },
      });

      // formatted response
      const formattedPets = {
        id: pet.id,
        category: pet.category,
        name: pet.name,
        photoUrls: pet.petPhotos.map((photo) => photo.photoUrl),
        tags: pet.petTags.map((petTag) => ({
          id: petTag.tags.id,
          name: petTag.tags.name,
        })),
        status: pet.status,
      };
      return res.status(200).json(formattedPets);
    });
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
