import { Router } from 'express';
import { login, refresh, logout, getMe } from '../controllers/authController.js';
import { loginValidator } from '../validators/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { requireAuth } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/security.js';

const router = Router();

router.post('/login', authRateLimiter, loginValidator, validateRequest, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

export default router;
