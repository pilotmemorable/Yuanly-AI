import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { createReview, getExperienceReviews, getUserReviews } from '../controllers/reviewController';

const router = Router();

// Public routes
router.get('/experience/:experienceId', getExperienceReviews);
router.get('/user/:userId', getUserReviews);

// Protected routes
router.post('/', authenticate, createReview);

export default router;