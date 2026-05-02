import { Router, type IRouter } from "express";
import healthRouter from "./health";
import venuesRouter from "./venues";
import dealsRouter from "./deals";
import bookingsRouter from "./bookings";
import usersRouter from "./users";
import ratingsRouter from "./ratings";
import standingDealsRouter from "./standingDeals";
import feedRouter from "./feed";

const router: IRouter = Router();

router.use(healthRouter);
router.use(venuesRouter);
router.use(dealsRouter);
router.use(bookingsRouter);
router.use(usersRouter);
router.use(ratingsRouter);
router.use(standingDealsRouter);
router.use(feedRouter);

export default router;
