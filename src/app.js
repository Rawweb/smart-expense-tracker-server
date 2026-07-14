import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';


const app = express();

// Global middleware. These are applied to every request, in the order they are registered.
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json({ limit: '10kb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Test route to verify the server is running.
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'SpendWatch API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", authRoutes);
// Sprint 2: app.use("/api/incomes", incomeRoutes);
// Sprint 2: app.use("/api/expenses", expenseRoutes);
// Sprint 3: app.use("/api/budgets", budgetRoutes);
// Sprint 4: app.use("/api/notifications", notificationRoutes);

// ---------- Errors (must stay last) ----------
app.use(notFound); 
app.use(errorHandler);

export default app;
