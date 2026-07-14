import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  let token;

  // Format: Authorization: Bearer <token>
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  // Throws if forged, tampered with, or expired.
  // errorHandler turns those two errors into a clean 401.
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // The token lasts 7 days. The account may have been deleted since.
  const user = await User.findById(decoded.id);

  if (!user) {
    return res.status(401).json({ message: 'Not authorized, user no longer exists' });
  }

  // Every private controller reads req.user._id to know whose data to touch.
  req.user = user;

  next();
};

export default protect;
