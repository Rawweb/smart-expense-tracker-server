import 'dotenv/config';

import app from './src/app.js';
import dns from 'dns';
import connectDB from './src/config/db.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const PORT = process.env.PORT || 5000;

await connectDB();
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} [${process.env.NODE_ENV}]`);
});

// Safety net for unhandled promise rejections. These are usually bugs in our code, not deliberate errors. Log them and exit, so we can fix the bug and redeploy.
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION, shutting down');
  console.error(err.name, err.message);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server');
  server.close(() => console.log('Process terminated'));
});
