// Initialize Express for router instance
const express = require("express");
const router = express.Router();

// Initialize Prisma Client instance
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Middleware applied
router.use(express.json());
// Search a pet by petId
router.get("/:id", async (req, res) => {
  try {
    // Get request
    const id = req.params.id;

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

    const pet = await prisma.pets.findUnique({
      where: {
        id: Number(id),
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
  } catch (error) {
    console.error(error.message, error);
    return res.status(500).send({
      code: 500,
      type: "Internal Server Error",
      message: error.message,
    });
  }
});

module.exports = router;
