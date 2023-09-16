// Initialize Express for router instance
const express = require("express");
const router = express.Router();

// Initialize Prisma Client instance
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Middleware applied
router.use(express.json());

// Search a pets by status
router.get("/findByStatus", async (req, res) => {
  try {
    // Get request
    const status = req.query.status;
    const statusArray = status.split(",");

    // Check request's status
    const availableValues = ["available", "pending", "sold"];
    const validateValues = statusArray.every((status) =>
      availableValues.includes(status),
    );

    if (status && !validateValues) {
      return res.status(400).json({
        code: 400,
        type: "Bad Request",
        message: "Invalid status value",
      });
    }

    // Search pet
    const pets = await prisma.pets.findMany({
      where: {
        status: {
          in: statusArray,
        },
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
    const formattedPets = pets.map((pet) => {
      return {
        id: pet.id,
        category: pet.category,
        name: pet.name,
        photoUrls: pet.petPhotos.map((photo) => photo.photo_url),
        tags: pet.petTags.map((petTag) => ({
          id: petTag.tags.id,
          name: petTag.tags.name,
        })),
        status: pet.status,
      };
    });
    return res.status(200).json(formattedPets);
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
