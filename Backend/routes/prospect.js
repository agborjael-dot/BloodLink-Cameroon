const express = require("express");
const {
  createProspect,
  getAllProspects,
  updateProspect,
  deleteProspect,
  getOneProspect,
} = require("../controllers/prospect");
const { rateLimitPublicProspectSubmissions } = require("../middlewares/rateLimitProspect");
const { validateProspectCreate } = require("../middlewares/validateProspect");
const { verifyTurnstile } = require("../middlewares/verifyTurnstile");
const { verifyTokenAndAuthorization } = require("../middlewares/verifyToken");
const router = express.Router();

// ADD PROSPECT
router.post(
  "/",
  rateLimitPublicProspectSubmissions,
  verifyTurnstile,
  validateProspectCreate,
  createProspect
);

//GET ALL PROSPECTS
router.get("/", verifyTokenAndAuthorization, getAllProspects);

// UPDATE PROSPECT
router.put("/:id", verifyTokenAndAuthorization, updateProspect);

// DELETE PROSPECT
router.delete("/:id", verifyTokenAndAuthorization, deleteProspect);

// GET ONE PROSPECT
router.get("/find/:id", verifyTokenAndAuthorization, getOneProspect);

module.exports = router;
