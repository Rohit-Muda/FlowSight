import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Shipment from './models/Shipment.js';
import Hub from './models/Hub.js';
import Bid from './models/Bid.js';

dotenv.config();

// ── 6 Hubs — each with exactly 3 alternate routes as per spec ──
const hubs = [
  {
    hubId: 'HUB001', name: 'Mumbai Port',
    location: { lat: 18.9220, lng: 72.8347 }, type: 'port',
    congestionLevel: 22, isDisrupted: false,
    alternateRoutes: [
      { name: 'Via Chennai Port',   extraTimeMins: 300, extraCostUSD: 200, reliabilityScore: 82 },
      { name: 'Via Nhava Sheva',    extraTimeMins: 120, extraCostUSD: 80,  reliabilityScore: 90 },
      { name: 'Via Mundra Port',    extraTimeMins: 480, extraCostUSD: 310, reliabilityScore: 78 }
    ]
  },
  {
    hubId: 'HUB002', name: 'Dubai Port',
    location: { lat: 25.2048, lng: 55.2708 }, type: 'port',
    congestionLevel: 68, isDisrupted: false,
    alternateRoutes: [
      { name: 'Via Abu Dhabi Port', extraTimeMins: 180, extraCostUSD: 150, reliabilityScore: 88 },
      { name: 'Via Oman Port',      extraTimeMins: 360, extraCostUSD: 250, reliabilityScore: 75 },
      { name: 'Via Bahrain Port',   extraTimeMins: 240, extraCostUSD: 190, reliabilityScore: 80 }
    ]
  },
  {
    hubId: 'HUB003', name: 'Rotterdam Port',
    location: { lat: 51.9225, lng: 4.4792 }, type: 'port',
    congestionLevel: 85, isDisrupted: true,
    alternateRoutes: [
      { name: 'Via Hamburg Port',     extraTimeMins: 240, extraCostUSD: 300, reliabilityScore: 85 },
      { name: 'Via Antwerp Port',     extraTimeMins: 120, extraCostUSD: 100, reliabilityScore: 92 },
      { name: 'Via Felixstowe Port',  extraTimeMins: 300, extraCostUSD: 220, reliabilityScore: 79 }
    ]
  },
  {
    hubId: 'HUB004', name: 'Singapore Port',
    location: { lat: 1.3521, lng: 103.8198 }, type: 'port',
    congestionLevel: 18, isDisrupted: false,
    alternateRoutes: [
      { name: 'Via Port Klang',          extraTimeMins: 200, extraCostUSD: 120, reliabilityScore: 87 },
      { name: 'Via Tanjung Pelepas',     extraTimeMins: 160, extraCostUSD: 95,  reliabilityScore: 84 },
      { name: 'Via Laem Chabang',        extraTimeMins: 360, extraCostUSD: 230, reliabilityScore: 76 }
    ]
  },
  {
    hubId: 'HUB005', name: 'Shanghai Port',
    location: { lat: 31.2304, lng: 121.4737 }, type: 'port',
    congestionLevel: 55, isDisrupted: false,
    alternateRoutes: [
      { name: 'Via Ningbo Port',  extraTimeMins: 180, extraCostUSD: 160, reliabilityScore: 83 },
      { name: 'Via Tianjin Port', extraTimeMins: 420, extraCostUSD: 280, reliabilityScore: 74 },
      { name: 'Via Qingdao Port', extraTimeMins: 300, extraCostUSD: 200, reliabilityScore: 80 }
    ]
  },
  {
    hubId: 'HUB006', name: 'New York Port',
    location: { lat: 40.6840, lng: -74.0440 }, type: 'port',
    congestionLevel: 30, isDisrupted: false,
    alternateRoutes: [
      { name: 'Via Baltimore Port',     extraTimeMins: 300, extraCostUSD: 220, reliabilityScore: 80 },
      { name: 'Via Boston Port',        extraTimeMins: 360, extraCostUSD: 260, reliabilityScore: 77 },
      { name: 'Via Philadelphia Port',  extraTimeMins: 180, extraCostUSD: 140, reliabilityScore: 85 }
    ]
  }
];

const now = Date.now();
const day = 86400000;

// ── 10 Shipments — matching spec exactly ──
const shipments = [
  {
    shipmentId: 'SHP001',
    origin: { city: 'Mumbai', country: 'India' },
    destination: { city: 'Rotterdam', country: 'Netherlands' },
    currentLocation: { lat: 12.5, lng: 53.2 },   // Arabian Sea / Gulf of Aden
    carrier: 'Maersk', status: 'on-time', riskScore: 15,
    estimatedArrival: new Date(now + 12 * day),
    transitHubs: ['Mumbai Port', 'Dubai Port', 'Rotterdam Port']
  },
  {
    shipmentId: 'SHP002',
    origin: { city: 'Shanghai', country: 'China' },
    destination: { city: 'New York', country: 'USA' },
    currentLocation: { lat: 22.3, lng: 140.5 },  // Pacific Ocean
    carrier: 'COSCO', status: 'on-time', riskScore: 12,
    estimatedArrival: new Date(now + 18 * day),
    transitHubs: ['Shanghai Port', 'Singapore Port', 'New York Port']
  },
  {
    shipmentId: 'SHP003',
    origin: { city: 'Dubai', country: 'UAE' },
    destination: { city: 'Singapore', country: 'Singapore' },
    currentLocation: { lat: 10.2, lng: 76.8 },   // Indian Ocean
    carrier: 'MSC', status: 'at-risk', riskScore: 52,
    estimatedArrival: new Date(now + 6 * day),
    transitHubs: ['Dubai Port', 'Singapore Port']
  },
  {
    shipmentId: 'SHP004',
    origin: { city: 'Rotterdam', country: 'Netherlands' },
    destination: { city: 'Mumbai', country: 'India' },
    currentLocation: { lat: 30.4, lng: 32.1 },   // Suez Canal area
    carrier: 'DHL', status: 'on-time', riskScore: 20,
    estimatedArrival: new Date(now + 10 * day),
    transitHubs: ['Rotterdam Port', 'Dubai Port', 'Mumbai Port']
  },
  {
    shipmentId: 'SHP005',
    origin: { city: 'Dubai', country: 'UAE' },
    destination: { city: 'Rotterdam', country: 'Netherlands' },
    currentLocation: { lat: 25.2048, lng: 55.2708 },
    carrier: 'MSC', status: 'at-risk', riskScore: 52,
    estimatedArrival: new Date(now + 4 * day),
    transitHubs: ['Dubai Port', 'Rotterdam Port'],
    cargoType: 'perishable',
    cargoDescription: 'Fresh Alphonso Mangoes — 12 metric tons',
    cargoValueUSD: 48000,
    expiryHours: 72,
    daysStuckAtHub: 2,
    noticesSent: 1
  },
  {
    shipmentId: 'SHP006',
    origin: { city: 'New York', country: 'USA' },
    destination: { city: 'Shanghai', country: 'China' },
    currentLocation: { lat: 35.5, lng: -60.3 },  // Atlantic Ocean
    carrier: 'FedEx', status: 'on-time', riskScore: 18,
    estimatedArrival: new Date(now + 20 * day),
    transitHubs: ['New York Port', 'Singapore Port', 'Shanghai Port']
  },
  {
    shipmentId: 'SHP007',
    origin: { city: 'Mumbai', country: 'India' },
    destination: { city: 'Singapore', country: 'Singapore' },
    currentLocation: { lat: 8.5, lng: 80.2 },    // Sri Lanka area
    carrier: 'Maersk', status: 'at-risk', riskScore: 58,
    estimatedArrival: new Date(now + 4 * day),
    transitHubs: ['Mumbai Port', 'Singapore Port']
  },
  {
    shipmentId: 'SHP008',
    origin: { city: 'Rotterdam', country: 'Netherlands' },
    destination: { city: 'Mumbai', country: 'India' },
    currentLocation: { lat: 51.9225, lng: 4.4792 },
    carrier: 'DHL', status: 'delayed', riskScore: 78,
    estimatedArrival: new Date(now + 1 * day),
    transitHubs: ['Rotterdam Port', 'Dubai Port', 'Mumbai Port'],
    cargoType: 'frozen',
    cargoDescription: 'Frozen Atlantic Salmon — 8 metric tons',
    cargoValueUSD: 62000,
    expiryHours: 48,
    daysStuckAtHub: 3,
    noticesSent: 2
  },

  {
    shipmentId: 'SHP009',
    origin: { city: 'Shanghai', country: 'China' },
    destination: { city: 'Dubai', country: 'UAE' },
    currentLocation: { lat: 5.2, lng: 100.4 },   // Strait of Malacca
    carrier: 'COSCO', status: 'on-time', riskScore: 22,
    estimatedArrival: new Date(now + 9 * day),
    transitHubs: ['Shanghai Port', 'Singapore Port', 'Dubai Port']
  },
  {
    shipmentId: 'SHP010',
    origin: { city: 'Singapore', country: 'Singapore' },
    destination: { city: 'Rotterdam', country: 'Netherlands' },
    currentLocation: { lat: 1.3521, lng: 103.8198 },
    carrier: 'COSCO', status: 'delayed', riskScore: 91,
    estimatedArrival: new Date(now + 1 * day),
    transitHubs: ['Singapore Port', 'Dubai Port', 'Rotterdam Port'],
    cargoType: 'perishable',
    cargoDescription: 'Durian Fruit Export — 5 metric tons',
    cargoValueUSD: 31000,
    expiryHours: 96,
    daysStuckAtHub: 32,
    noticesSent: 4
  }
];

const seedDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected for seeding...');
  await Shipment.deleteMany({});
  await Hub.deleteMany({});
  await Bid.deleteMany({});
  await Hub.insertMany(hubs);
  console.log('6 hubs inserted — each with 3 alternate routes');
  await Shipment.insertMany(shipments);
  console.log('10 shipments inserted — matching spec (4 on-time, 3 at-risk, 3 delayed)');
  console.log('Seeded successfully');
  process.exit(0);
};

seedDB().catch(err => { console.error(err); process.exit(1); });