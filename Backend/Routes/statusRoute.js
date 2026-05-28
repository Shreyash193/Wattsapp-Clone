const express = require("express");
const statusController = require("../Controllers/statusController");
const authMiddleware = require("../Middleware/authMiddleware");
const { multerMiddleware } = require("../config/cloudinaryConfig");

const router = express.Router();

router.post("/", authMiddleware, multerMiddleware, statusController.createStatus);
router.get("/", authMiddleware, statusController.getstatus);
router.post("/:statusId/view", authMiddleware, statusController.viewStatus);
router.delete("/:statusId", authMiddleware, statusController.deleteStatus);

module.exports = router;
