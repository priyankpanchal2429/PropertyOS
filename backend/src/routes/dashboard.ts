import { Router, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();

router.get('/stats', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    status: 'success',
    data: {
      stats: {
        totalStaff: 42,
        attendanceToday: 38,
        pendingPayroll: 12500,
        inventoryItems: 385,
        occupancyRate: 82,
        revenueToday: 5400,
      },
      recentActivity: [
        { id: 1, type: 'checkin', message: 'Room 104 checked in by Front Desk', time: '10 mins ago' },
        { id: 2, type: 'maintenance', message: 'Room 212 shower leak reported', time: '25 mins ago' },
        { id: 3, type: 'payroll', message: 'Payroll approved for period ending Jun 30', time: '1 hr ago' },
        { id: 4, type: 'inventory', message: 'Linens restocked in supply closet B', time: '3 hrs ago' },
      ],
    },
  });
});

export default router;
