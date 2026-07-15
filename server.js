import 'dotenv/config';

import app from './src/app.js';
import dns from 'dns';
import connectDB from './src/config/db.js';
import { initSocket } from './src/config/socket.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const PORT = process.env.PORT || 5000;

// Connect before opening the port, so no request lands with no database.
await connectDB();

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} [${process.env.NODE_ENV}]`);
});

initSocket(server);