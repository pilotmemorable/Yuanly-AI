import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { handleVoiceInteraction, handleTranslation, handleVoiceMessage, getRecommendations } from '../controllers/aiController';

const router = Router();

// Auth required for AI routes
router.post('/interact', authenticate, handleVoiceInteraction);
router.post('/translate', handleTranslation);
router.post('/voice', authenticate, handleVoiceMessage);
router.get('/recommend', authenticate, getRecommendations);

export default router;