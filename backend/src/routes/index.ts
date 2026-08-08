import { Router } from 'express';
import { login, getMe } from '../controllers/authController';
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, reorderMenuItems } from '../controllers/menuController';
import { createOrder, getPendingOrders, updateOrderStatus } from '../controllers/orderController';
import { getHistory, getOrderById, deleteOrder, exportHistoryCSV } from '../controllers/historyController';
import { getDashboardMetrics } from '../controllers/dashboardController';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { triggerArchive, getArchives, exportArchiveFile, restoreArchive } from '../controllers/archiveController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Auth Public
router.post('/auth/login', login);
router.get('/auth/me', authenticateToken, getMe);

// Menu Management
router.get('/menu', authenticateToken, getMenuItems);
router.post('/menu', authenticateToken, createMenuItem);
router.put('/menu/reorder', authenticateToken, reorderMenuItems);
router.put('/menu/:id', authenticateToken, updateMenuItem);
router.delete('/menu/:id', authenticateToken, deleteMenuItem);

// Billing & Orders
router.post('/orders', authenticateToken, createOrder);
router.get('/orders/pending', authenticateToken, getPendingOrders);
router.patch('/orders/:id', authenticateToken, updateOrderStatus);

// History
router.get('/history', authenticateToken, getHistory);
router.get('/history/export', authenticateToken, exportHistoryCSV);
router.get('/history/:id', authenticateToken, getOrderById);
router.delete('/history/:id', authenticateToken, deleteOrder);

// Dashboard Analytics
router.get('/dashboard', authenticateToken, getDashboardMetrics);

// Shop Settings
router.get('/settings', authenticateToken, getSettings);
router.put('/settings', authenticateToken, updateSettings);

// Data Archiving & Backup
router.post('/archive/trigger', authenticateToken, triggerArchive);
router.get('/archive', authenticateToken, getArchives);
router.get('/archive/:id/export', authenticateToken, exportArchiveFile);
router.post('/archive/:id/restore', authenticateToken, restoreArchive);

export default router;
