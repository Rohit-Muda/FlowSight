import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API_BASE, SOCKET_URL } from '../config.js';

// Reuse the same socket singleton that App.jsx created at module level.
// We reference it here by creating a connection to the same URL —
// socket.io-client deduplicates connections to the same origin automatically.
const socket = io(SOCKET_URL, { autoConnect: true });

export default function AuctionPanel({ shipments, onClose }) {
  const [auctions, setAuctions] = useState([]);
  const [bids, setBids] = useState({});           // { [shipmentId]: Bid[] }
  const [acceptingBid, setAcceptingBid] = useState(null); // bidId being accepted
  const [bidForm, setBidForm] = useState({ shipmentId: '', name: '', contact: '', amount: '' });
  const [message, setMessage] = useState('');

  const perishableStuck = shipments.filter(s =>
    (s.cargoType === 'perishable' || s.cargoType === 'frozen') &&
    s.status !== 'on-time' &&
    !s.auction?.isOpen
  );

  // fetchBids is stable — no external deps beyond the API constant
  const fetchBids = useCallback((shipmentId) => {
    axios.get(`${API_BASE}/auctions/${shipmentId}/bids`)
      .then(res => setBids(prev => ({ ...prev, [shipmentId]: res.data })))
      .catch(() => {});
  }, []);

  // fetchAuctions depends on fetchBids (stable via useCallback)
  const fetchAuctions = useCallback(() => {
    axios.get(`${API_BASE}/auctions`)
      .then(res => {
        setAuctions(res.data);
        // Fetch bids for each open auction
        res.data.forEach(s => fetchBids(s.shipmentId));
      })
      .catch(() => {});
  }, [fetchBids]);

  // Initial fetch + real-time socket listeners for auction-opened, bid-placed, auction-closed
  useEffect(() => {
    fetchAuctions();

    const onAuctionOpened = () => fetchAuctions();
    const onBidPlaced     = (data) => {
      fetchAuctions();
      if (data?.shipmentId) fetchBids(data.shipmentId);
    };
    const onAuctionClosed = (data) => {
      fetchAuctions();
      setMessage(`✓ Auction closed — Winner: ${data.winner} ($${data.winningBid?.toLocaleString()})`);
    };

    socket.on('auction-opened', onAuctionOpened);
    socket.on('bid-placed',     onBidPlaced);
    socket.on('auction-closed', onAuctionClosed);

    return () => {
      socket.off('auction-opened', onAuctionOpened);
      socket.off('bid-placed',     onBidPlaced);
      socket.off('auction-closed', onAuctionClosed);
    };
  }, [fetchAuctions]);

  const openAuction = async (shipmentId) => {
    try {
      await axios.post(`${API_BASE}/auctions/${shipmentId}/open`);
      fetchAuctions();
      setMessage('Auction opened successfully');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error opening auction');
    }
  };

  const placeBid = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/auctions/${bidForm.shipmentId}/bid`, {
        bidderName:    bidForm.name,
        bidderContact: bidForm.contact,
        amountUSD:     Number(bidForm.amount)
      });
      setMessage(`Bid of $${bidForm.amount} placed successfully`);
      setBidForm({ shipmentId: '', name: '', contact: '', amount: '' });
      fetchAuctions();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Bid failed');
    }
  };

  const acceptBid = async (shipmentId, bidId, bidderName, amountUSD) => {
    setAcceptingBid(bidId);
    try {
      await axios.post(`${API_BASE}/auctions/${shipmentId}/accept-bid`, { bidId });
      setMessage(`✓ Bid accepted — ${bidderName} wins at $${amountUSD.toLocaleString()}`);
      fetchAuctions();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to accept bid');
    } finally {
      setAcceptingBid(null);
    }
  };

  const hoursLeft = (deadline) => {
    const diff = new Date(deadline) - new Date();
    return Math.max(0, Math.round(diff / 3600000));
  };

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, width: '420px', height: '100%',
      background: 'rgba(13,17,32,0.98)', borderLeft: '0.5px solid rgba(245,158,11,0.3)',
      zIndex: 300, display: 'flex', flexDirection: 'column',
      animation: 'slideIn 0.25s ease'
    }}>
      <div style={{
        padding: '16px', borderBottom: '0.5px solid rgba(255,255,255,0.06)',
        background: 'rgba(245,158,11,0.08)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
      }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
            Port Auction House
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>
            Distressed Cargo
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            Perishables at risk · Unclaimed cargo
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.12)',
          borderRadius: '6px', color: '#64748b', cursor: 'pointer', padding: '4px 8px',
          fontFamily: 'inherit', fontSize: '14px'
        }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>

        {/* Eligible for auction */}
        {perishableStuck.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', marginBottom: '8px' }}>
              Eligible for Auction
            </div>
            {perishableStuck.map(s => (
              <div key={s.shipmentId} style={{
                background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(245,158,11,0.2)',
                borderRadius: '8px', padding: '12px', marginBottom: '6px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>{s.shipmentId}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{s.cargoDescription || s.cargoType}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#22c55e' }}>${s.cargoValueUSD?.toLocaleString()}</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>cargo value</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '10px', background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontWeight: 500 }}>
                    Expires in {s.expiryHours}h
                  </span>
                  <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '10px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontWeight: 500 }}>
                    {s.daysStuckAtHub} days at port
                  </span>
                  {s.noticesSent > 0 && (
                    <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '10px', background: 'rgba(99,102,241,0.12)', color: '#818cf8', fontWeight: 500 }}>
                      {s.noticesSent} notices sent
                    </span>
                  )}
                </div>
                <button
                  onClick={() => openAuction(s.shipmentId)}
                  style={{
                    width: '100%', padding: '7px', borderRadius: '6px',
                    background: 'rgba(245,158,11,0.15)', border: '0.5px solid rgba(245,158,11,0.4)',
                    color: '#f59e0b', fontWeight: 600, fontSize: '12px', cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  Open Auction — Min bid ${Math.round((s.cargoValueUSD || 0) * 0.25).toLocaleString()}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Active auctions */}
        {auctions.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', marginBottom: '8px' }}>
              Live Auctions
            </div>
            {auctions.map(s => (
              <div key={s.shipmentId} style={{
                background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(99,102,241,0.3)',
                borderRadius: '8px', padding: '12px', marginBottom: '6px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>{s.shipmentId}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{s.cargoDescription}</div>
                    <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>
                      at {s.transitHubs?.at(-1)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#22c55e' }}>
                      ${s.auction?.currentBidUSD?.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>current bid</div>
                    <div style={{ fontSize: '10px', color: '#f59e0b', marginTop: '2px' }}>
                      {hoursLeft(s.auction?.auctionDeadline)}h left
                    </div>
                  </div>
                </div>

                {s.auction?.currentBidder && (
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                    Leading: <span style={{ color: '#818cf8' }}>{s.auction.currentBidder}</span>
                  </div>
                )}

                <button
                  onClick={() => setBidForm(prev => ({ ...prev, shipmentId: s.shipmentId, amount: s.auction.currentBidUSD + 100 }))}
                  style={{
                    width: '100%', padding: '7px', borderRadius: '6px',
                    background: 'rgba(99,102,241,0.15)', border: '0.5px solid rgba(99,102,241,0.4)',
                    color: '#818cf8', fontWeight: 600, fontSize: '12px', cursor: 'pointer',
                    fontFamily: 'inherit', marginBottom: '6px'
                  }}
                >
                  Place Bid
                </button>

                {/* Bids list with Accept button */}
                {(bids[s.shipmentId] || []).length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: '6px' }}>
                      Bids ({(bids[s.shipmentId] || []).length})
                    </div>
                    {(bids[s.shipmentId] || []).map(bid => (
                      <div key={bid._id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '6px 10px', borderRadius: '6px', marginBottom: '4px',
                        background: bid.status === 'won' ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.02)',
                        border: `0.5px solid ${bid.status === 'won' ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.06)'}`
                      }}>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#e2e8f0' }}>{bid.bidderName}</div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>{bid.bidderContact}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#22c55e' }}>
                            ${bid.amountUSD.toLocaleString()}
                          </div>
                          {bid.status === 'won' ? (
                            <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '10px', background: 'rgba(34,197,94,0.12)', color: '#22c55e', fontWeight: 600 }}>WON</span>
                          ) : bid.status === 'outbid' ? (
                            <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '10px', background: 'rgba(100,116,139,0.12)', color: '#64748b', fontWeight: 600 }}>OUTBID</span>
                          ) : (
                            <button
                              onClick={() => acceptBid(s.shipmentId, bid._id, bid.bidderName, bid.amountUSD)}
                              disabled={acceptingBid === bid._id}
                              style={{
                                padding: '3px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 600,
                                background: 'rgba(34,197,94,0.15)', border: '0.5px solid rgba(34,197,94,0.4)',
                                color: '#22c55e', cursor: 'pointer', fontFamily: 'inherit',
                                opacity: acceptingBid === bid._id ? 0.6 : 1
                              }}
                            >
                              {acceptingBid === bid._id ? 'Accepting…' : 'Accept Bid'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Bid form */}
        {bidForm.shipmentId && (
          <div style={{
            background: 'rgba(99,102,241,0.06)', border: '0.5px solid rgba(99,102,241,0.2)',
            borderRadius: '8px', padding: '14px', marginBottom: '12px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#818cf8', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Bidding on {bidForm.shipmentId}
            </div>
            <input
              placeholder="Your name"
              value={bidForm.name}
              onChange={e => setBidForm(p => ({ ...p, name: e.target.value }))}
              style={{ width: '100%', marginBottom: '6px', padding: '8px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontFamily: 'inherit', fontSize: '12px' }}
            />
            <input
              placeholder="Contact (email or phone)"
              value={bidForm.contact}
              onChange={e => setBidForm(p => ({ ...p, contact: e.target.value }))}
              style={{ width: '100%', marginBottom: '6px', padding: '8px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontFamily: 'inherit', fontSize: '12px' }}
            />
            <input
              type="number"
              placeholder="Bid amount in USD"
              value={bidForm.amount}
              onChange={e => setBidForm(p => ({ ...p, amount: e.target.value }))}
              style={{ width: '100%', marginBottom: '10px', padding: '8px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontFamily: 'inherit', fontSize: '12px' }}
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={placeBid} style={{
                flex: 1, padding: '8px', borderRadius: '6px',
                background: 'rgba(99,102,241,0.2)', border: '0.5px solid rgba(99,102,241,0.5)',
                color: '#818cf8', fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit'
              }}>Submit Bid</button>
              <button onClick={() => setBidForm({ shipmentId: '', name: '', contact: '', amount: '' })} style={{
                padding: '8px 12px', borderRadius: '6px',
                background: 'transparent', border: '0.5px solid rgba(255,255,255,0.1)',
                color: '#64748b', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit'
              }}>Cancel</button>
            </div>
          </div>
        )}

        {message && (
          <div style={{
            padding: '10px 12px', borderRadius: '6px', fontSize: '12px',
            background: message.includes('success') || message.includes('opened') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            color: message.includes('success') || message.includes('opened') ? '#22c55e' : '#ef4444',
            border: `0.5px solid ${message.includes('success') || message.includes('opened') ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`
          }}>
            {message}
          </div>
        )}

      </div>
    </div>
  );
}