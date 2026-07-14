// Every unexpected error in the app ends up here.
const errorHandler = (err, req, res, next) => {
  console.error('ERROR:', err.message);

  // Broken JSON in the request body. express.json() threw before any controller ran.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }

  // Mongoose schema validation failed. Collect every message, not just the first.
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join('. ') });
  }

  // A unique index rejected a duplicate. This is how `unique: true` reports itself.
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ message: `That ${field} is already in use` });
  }

  // An id in the URL was not a valid MongoDB ObjectId.
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path}` });
  }

  // Token was forged, tampered with, or signed with a different secret.
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }

  // Token was valid but has expired.
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Session expired, please log in again' });
  }

  // Anything else is a bug. Log the full trace for us, tell the client nothing.
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on our end' });
};

export default errorHandler;
