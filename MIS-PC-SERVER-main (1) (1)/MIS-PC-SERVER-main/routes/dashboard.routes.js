import express from "express";
import {
  getDashboardOverview,
  getHourlyProduction,
} from "../controller/dashboard/dashboard.controller.js";

const router = express.Router();

router.get("/overview", getDashboardOverview);
router.get("/hourly-production", getHourlyProduction);

export default router;
