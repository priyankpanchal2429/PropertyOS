import { Router } from 'express';
import authRoutes from './auth.js';
import dashboardRoutes from './dashboard.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
