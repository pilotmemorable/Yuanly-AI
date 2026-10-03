import { Router } from 'express';
import { optionalAuth } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/http';
import { exploreExperiences, getExperienceDetail, searchExperiences, getTrending } from '../controllers/experienceController';

const router = Router();

router.use(optionalAuth);

router.get('/explore', asyncHandler(exploreExperiences));
router.get('/trending', asyncHandler(getTrending));
router.get('/search', asyncHandler(searchExperiences));
router.get('/:id', asyncHandler(getExperienceDetail));

export default router;
