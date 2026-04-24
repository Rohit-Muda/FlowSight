import express from 'express';
import Shipment from '../models/Shipment.js';
import Bid from '../models/Bid.js';
import { getIO } from '../socket.js';

const router = express.Router();

// GET all open auctions
router.get('/', async (req, res) => {
  try {
    const auctions = await Shipment.find({ 'auction.isOpen': true });
    res.json(auctions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST owner approves distress auction
router.post('/:shipmentId/open', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ shipmentId: req.params.shipmentId });
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    const AUCTIONABLE_TYPES = ['perishable', 'frozen'];
    if (!AUCTIONABLE_TYPES.includes(shipment.cargoType)) {
      return res.status(400).json({ message: 'Only perishable or frozen cargo can be auctioned' });
    }

    const minBid = Math.round(shipment.cargoValueUSD * 0.25);
    const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const updated = await Shipment.findOneAndUpdate(
      { shipmentId: req.params.shipmentId },
      {
        $set: {
          'auction.isOpen': true,
          'auction.type': shipment.daysStuckAtHub > 30 ? 'unclaimed' : 'distress',
          'auction.minBidUSD': minBid,
          'auction.currentBidUSD': minBid,
          'auction.ownerApproved': true,
          'auction.auctionDeadline': deadline
        }
      },
      { returnDocument: 'after' }
    );

    getIO().emit('auction-opened', {
      shipmentId: updated.shipmentId,
      cargoDescription: updated.cargoDescription,
      cargoType: updated.cargoType,
      minBidUSD: minBid,
      currentBidUSD: minBid,
      auctionDeadline: deadline,
      type: updated.auction.type,
      hub: updated.transitHubs?.at(-1) ?? null
    });

    res.json({ message: 'Auction opened', auction: updated.auction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST place a bid
router.post('/:shipmentId/bid', async (req, res) => {
  try {
    const { bidderName, bidderContact, amountUSD } = req.body;
    const shipment = await Shipment.findOne({ shipmentId: req.params.shipmentId });

    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    if (!shipment.auction.isOpen) return res.status(400).json({ message: 'No active auction' });
    if (amountUSD <= shipment.auction.currentBidUSD) {
      return res.status(400).json({ message: `Bid must exceed current bid of $${shipment.auction.currentBidUSD}` });
    }
    if (new Date() > shipment.auction.auctionDeadline) {
      return res.status(400).json({ message: 'Auction has expired' });
    }

    await Bid.create({
      shipmentId: req.params.shipmentId,
      bidderName,
      bidderContact,
      amountUSD,
      auctionType: shipment.auction.type,
      status: 'active'
    });

    const updated = await Shipment.findOneAndUpdate(
      { shipmentId: req.params.shipmentId },
      { $set: { 'auction.currentBidUSD': amountUSD, 'auction.currentBidder': bidderName } },
      { returnDocument: 'after' }
    );

    getIO().emit('bid-placed', {
      shipmentId: req.params.shipmentId,
      currentBidUSD: amountUSD,
      currentBidder: bidderName
    });

    res.json({ message: 'Bid placed successfully', currentBid: amountUSD });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET bids for a shipment
router.get('/:shipmentId/bids', async (req, res) => {
  try {
    const bids = await Bid.find({ shipmentId: req.params.shipmentId })
      .sort({ createdAt: -1 });
    res.json(bids);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET a single auction (shipment with open auction)
router.get('/:shipmentId', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ shipmentId: req.params.shipmentId });
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    if (!shipment.auction.isOpen) return res.status(404).json({ message: 'No active auction for this shipment' });
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST accept a bid and close the auction
router.post('/:shipmentId/accept-bid', async (req, res) => {
  try {
    const { bidId } = req.body;
    if (!bidId) return res.status(400).json({ message: 'bidId is required' });

    const shipment = await Shipment.findOne({ shipmentId: req.params.shipmentId });
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    if (!shipment.auction.isOpen) return res.status(400).json({ message: 'No active auction to accept' });

    const winningBid = await Bid.findById(bidId);
    if (!winningBid) return res.status(404).json({ message: 'Bid not found' });
    if (winningBid.shipmentId !== req.params.shipmentId) {
      return res.status(400).json({ message: 'Bid does not belong to this shipment' });
    }

    // Mark all other bids as outbid
    await Bid.updateMany(
      { shipmentId: req.params.shipmentId, _id: { $ne: bidId } },
      { $set: { status: 'outbid' } }
    );
    // Mark winning bid as won
    await Bid.findByIdAndUpdate(bidId, { $set: { status: 'won' } });

    // Close the auction on the shipment
    const updated = await Shipment.findOneAndUpdate(
      { shipmentId: req.params.shipmentId },
      {
        $set: {
          'auction.isOpen': false,
          'auction.currentBidder': winningBid.bidderName,
          'auction.currentBidUSD': winningBid.amountUSD
        }
      },
      { returnDocument: 'after' }
    );

    // Notify all clients the auction has resolved
    getIO().emit('auction-closed', {
      shipmentId: req.params.shipmentId,
      winner: winningBid.bidderName,
      winningBid: winningBid.amountUSD
    });

    res.json({
      message: 'Bid accepted. Auction closed.',
      winner: winningBid.bidderName,
      winningBid: winningBid.amountUSD,
      auction: updated.auction
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;