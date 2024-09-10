import express from "express";
import { getMembers } from "../controllers/member.controller.js";

const router = express.Router();

// Query
router.get("/", getMembers);

export default router;
