require("dotenv").config();
const express = require("express");
const router = express.Router();

// Initialize Prisma Client instance
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Middleware applied
router.use(express.json());

// Delete a pet by petId
router.delete("/:id", async (req, res) => {
  try {
    // Get request
    const id = req.params.id;

    // Check request's id
    let idError = false;
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

    const deletedPet = await prisma.pets.delete({
      where: {
        id: Number(id),
      },
    });

    res.status(200).send({ message: `Deleted petId: ${id}` });
  } catch (error) {
    return res.status(500).send({
      code: 500,
      type: "Internal Server Error",
      message: error.message,
    });
  }
});

module.exports = router;
