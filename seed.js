import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Shipment from './models/Shipment.js';
import Hub from './models/Hub.js';

dotenv.config();

const hubs = [
  {
    hubId: 'HUB001', name: 'Mumbai Port',
    location: { lat: 18.9220, lng: 72.8347 }, type: 'port', congestionLevel: 25, isDisrupted: false,
    alternateRoutes: [
      { name: 'Via Chennai Port', extraTimeMins: 300, extraCostUSD: 200, reliabilityScore: 82 },
      { name: 'Via Nhava Sheva', extraTimeMins: 120, extraCostUSD: 80, reliabilityScore: 90 }
    ]
  },
  {
    hubId: 'HUB002', name: 'Dubai Port',
    location: { lat: 25.2048, lng: 55.2708 }, type: 'port', congestionLevel: 30, isDisrupted: false,
    alternateRoutes: [
      { name: 'Via Abu Dhabi', extraTimeMins: 180, extraCostUSD: 150, reliabilityScore: 88 },
      { name: 'Via Oman Port', extraTimeMins: 360, extraCostUSD: 250, reliabilityScore: 75 }
    ]
  },
  {
    hubId: 'HUB003', name: 'Rotterdam Port',
    location: { lat: 51.9225, lng: 4.4792 }, type: 'port', congestionLevel: 40, isDisrupted: false,
    alternateRoutes: [
      { name: 'Via Hamburg', extraTimeMins: 240, extraCostUSD: 300, reliabilityScore: 85 },
      { name: 'Via Antwerp', extraTimeMins: 120, extraCostUSD: 100, reliabilityScore: 92 }
    ]
  },
  {
    hubId: 'HUB004', name: 'Singapore Port',
    location: { lat: 1.3521, lng: 103.8198 }, type: 'port', congestionLevel: 20, isDisrupted: false,
    alternateRoutes: [
      { name: 'Via Port Klang', extraTimeMins: 200, extraCostUSD: 120, reliabilityScore: 87 }
    ]
  },
  {
    hubId: 'HUB005', name: 'Shanghai Port',
    location: { lat: 31.2304, lng: 121.4737 }, type: 'port', congestionLevel: 55, isDisrupted: false,
    alternateRoutes: [
      { name: 'Via Ningbo Port', extraTimeMins: 180, extraCostUSD: 160, reliabilityScore: 83 }
    ]
  },
  {
    hubId: 'HUB006', name: 'New York Port',
    location: { lat: 40.6840, lng: -74.0440 }, type: 'port', congestionLevel: 35, isDisrupted: false,
    alternateRoutes: [
      { name: 'Via Baltimore', extraTimeMins: 300, extraCostUSD: 220, reliabilityScore: 80 }
    ]
  }
];

const shipments = [
  { shipmentId: 'SHP001', origin: { city: 'Mumbai', country: 'India' }, destination: { city: 'Rotterdam', country: 'Netherlands' }, currentLocation: { lat: 18.9220, lng: 72.8347 }, carrier: 'Maersk', status: 'on-time', riskScore: 10, estimatedArrival: new Date(Date.now() + 7 * 86400000), transitHubs: ['Mumbai Port', 'Dubai Port', 'Rotterdam Port'] },
  { shipmentId: 'SHP002', origin: { city: 'Shanghai', country: 'China' }, destination: { city: 'New York', country: 'USA' }, currentLocation: { lat: 31.2304, lng: 121.4737 }, carrier: 'COSCO', status: 'on-time', riskScore: 15, estimatedArrival: new Date(Date.now() + 14 * 86400000), transitHubs: ['Shanghai Port', 'Singapore Port', 'New York Port'] },
  { shipmentId: 'SHP003', origin: { city: 'Dubai', country: 'UAE' }, destination: { city: 'Singapore', country: 'Singapore' }, currentLocation: { lat: 25.2048, lng: 55.2708 }, carrier: 'MSC', status: 'at-risk', riskScore: 65, estimatedArrival: new Date(Date.now() + 5 * 86400000), transitHubs: ['Dubai Port', 'Singapore Port'] },
  { shipmentId: 'SHP004', origin: { city: 'Rotterdam', country: 'Netherlands' }, destination: { city: 'Mumbai', country: 'India' }, currentLocation: { lat: 51.9225, lng: 4.4792 }, carrier: 'DHL', status: 'on-time', riskScore: 20, estimatedArrival: new Date(Date.now() + 10 * 86400000), transitHubs: ['Rotterdam Port', 'Dubai Port', 'Mumbai Port'] },
  { shipmentId: 'SHP005', origin: { city: 'Singapore', country: 'Singapore' }, destination: { city: 'Rotterdam', country: 'Netherlands' }, currentLocation: { lat: 1.3521, lng: 103.8198 }, carrier: 'Evergreen', status: 'delayed', riskScore: 85, estimatedArrival: new Date(Date.now() + 3 * 86400000), transitHubs: ['Singapore Port', 'Dubai Port', 'Rotterdam Port'] },
  { shipmentId: 'SHP006', origin: { city: 'New York', country: 'USA' }, destination: { city: 'Shanghai', country: 'China' }, currentLocation: { lat: 40.6840, lng: -74.0440 }, carrier: 'FedEx', status: 'on-time', riskScore: 5, estimatedArrival: new Date(Date.now() + 12 * 86400000), transitHubs: ['New York Port', 'Singapore Port', 'Shanghai Port'] },
  { shipmentId: 'SHP007', origin: { city: 'Mumbai', country: 'India' }, destination: { city: 'Singapore', country: 'Singapore' }, currentLocation: { lat: 12.9716, lng: 77.5946 }, carrier: 'Maersk', status: 'at-risk', riskScore: 55, estimatedArrival: new Date(Date.now() + 4 * 86400000), transitHubs: ['Mumbai Port', 'Singapore Port'] },
  { shipmentId: 'SHP008', origin: { city: 'Rotterdam', country: 'Netherlands' }, destination: { city: 'New York', country: 'USA' }, currentLocation: { lat: 51.9225, lng: 4.4792 }, carrier: 'MSC', status: 'on-time', riskScore: 12, estimatedArrival: new Date(Date.now() + 8 * 86400000), transitHubs: ['Rotterdam Port', 'New York Port'] },
  { shipmentId: 'SHP009', origin: { city: 'Shanghai', country: 'China' }, destination: { city: 'Dubai', country: 'UAE' }, currentLocation: { lat: 22.3193, lng: 114.1694 }, carrier: 'COSCO', status: 'on-time', riskScore: 18, estimatedArrival: new Date(Date.now() + 6 * 86400000), transitHubs: ['Shanghai Port', 'Singapore Port', 'Dubai Port'] },
  { shipmentId: 'SHP010', origin: { city: 'Dubai', country: 'UAE' }, destination: { city: 'Rotterdam', country: 'Netherlands' }, currentLocation: { lat: 23.4241, lng: 53.8478 }, carrier: 'DHL', status: 'at-risk', riskScore: 70, estimatedArrival: new Date(Date.now() + 2 * 86400000), transitHubs: ['Dubai Port', 'Rotterdam Port'] }
];

const seedDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected for seeding...');
  await Shipment.deleteMany({});
  await Hub.deleteMany({});
  await Hub.insertMany(hubs);
  await Shipment.insertMany(shipments);
  console.log('Database seeded successfully');
  process.exit(0);
};

seedDB().catch(err => { console.error(err); process.exit(1); });