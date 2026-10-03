import { Router } from 'express';
import { exploreExperiences, getExperienceDetail, searchExperiences, getTrending } from '../controllers/experienceController';

const router = Router();

// All experience routes are public (auth handled optionally in controllers)
router.get('/explore', exploreExperiences);
router.get('/trending', getTrending);
router.get('/search', searchExperiences);
router.get('/:id', getExperienceDetail);

export default router;