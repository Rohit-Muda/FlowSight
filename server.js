import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { initSocket } from './socket.js';
import shipmentRoutes from './routes/shipments.js';
import hubRoutes from './routes/hubs.js';
import { startGPSSimulator } from './simulator/gpsSimulator.js';
import { startDisruptionSimulator } from './simulator/disruptionSimulator.js';
import { startDisruptionEngine } from './services/disruptionEngine.js';
import auctionRoutes from './routes/auction.js';

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = initSocket(server);

// Restrict CORS to known origins (localhost dev + Firebase production)
const allowedOrigins = [
  'http://localhost:3000',
  /\.web\.app$/,
  /\.firebaseapp\.com$/
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH']
}));
app.use(express.json());

app.use('/api/shipments', shipmentRoutes);
app.use('/api/hubs', hubRoutes);
app.use('/api/auctions', auctionRoutes);


app.get('/', (req, res) => {
  res.json({ message: 'Supply Chain API running' });
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`Client disconnected: ${socket.id}`));
});

startGPSSimulator(io);
startDisruptionSimulator(io);
startDisruptionEngine(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server on port ${PORT}`));