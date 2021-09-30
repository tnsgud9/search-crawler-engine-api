import express from "express";
import schoolController from "./school.controller";
import search from "./search.constoller";

const router = express.Router();

router.use("/schools", schoolController);
router.use("/search", search);

export default router;
