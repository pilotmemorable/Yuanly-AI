import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/http';
import { createReview, getExperienceReviews, getUserReviews } from '../controllers/reviewController';

const router = Router();

router.get('/experience/:experienceId', asyncHandler(getExperienceReviews));
router.get('/user/:userId', authenticate, asyncHandler(getUserReviews));
router.post('/', authenticate, asyncHandler(createReview));

export default router;
