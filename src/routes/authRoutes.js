import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import protect from '../middleware/protect.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// protect runs first. If it sends 401, getMe never runs.
router.get('/me', protect, getMe);

export default router;
