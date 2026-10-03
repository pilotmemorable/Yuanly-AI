import { Router } from 'express';
import { optionalAuth } from '../middleware/authMiddleware';
import { handleVoiceInteraction, handleTranslation, handleVoiceMessage, getRecommendations } from '../controllers/aiController';

const router = Router();

router.use(optionalAuth);

router.post('/interact', handleVoiceInteraction);
router.post('/translate', handleTranslation);
router.post('/voice', handleVoiceMessage);
router.get('/recommend', getRecommendations);

export default router;
