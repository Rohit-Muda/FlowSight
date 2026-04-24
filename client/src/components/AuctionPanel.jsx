import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API_BASE, SOCKET_URL } from '../config.js';

const socket = io(SOCKET_URL, { autoConnect: true });

export default function AuctionPanel({ shipments, onClose }) {
  const [auctions, setAuctions]       = useState([]);
  const [bids, setBids]               = useState({});
  const [acceptingBid, setAcceptingBid] = useState(null);
  const [bidForm, setBidForm]         = useState({ shipmentId: '', name: '', contact: '', amount: '' });
  const [message, setMessage]         = useState('');

  const perishableStuck = shipments.filter(s =>
    (s.cargoType === 'perishable' || s.cargoType === 'frozen') &&
    s.status !== 'on-time' &&
    !s.auction?.isOpen
  );

  const fetchBids = useCallback((shipmentId) => {
    axios.get(`${API_BASE}/auctions/${shipmentId}/bids`)
      .then(res => setBids(prev => ({ ...prev, [shipmentId]: res.data })))
      .catch(() => {});
  }, []);

  const fetchAuctions = useCallback(() => {
    axios.get(`${API_BASE}/auctions`)
      .then(res => {
        setAuctions(res.data);
        res.data.forEach(s => fetchBids(s.shipmentId));
      })
      .catch(() => {});
  }, [fetchBids]);

  useEffect(() => {
    fetchAuctions();
    const onAuctionOpened = () => fetchAuctions();
    const onBidPlaced     = (data) => { fetchAuctions(); if (data?.shipmentId) fetchBids(data.shipmentId); };
    const onAuctionClosed = (data) => {
      fetchAuctions();
      setMessage(`✓ Auction closed — Winner: ${data.winner} ($${data.winningBid?.toLocaleString()})`);
    };
    socket.on('auction-opened', onAuctionOpened);
    socket.on('bid-placed', onBidPlaced);
    socket.on('auction-closed', onAuctionClosed);
    return () => {
      socket.off('auction-opened', onAuctionOpened);
      socket.off('bid-placed', onBidPlaced);
      socket.off('auction-closed', onAuctionClosed);
    };
  }, [fetchAuctions]);

  const openAuction = async (shipmentId) => {
    try {
      await axios.post(`${API_BASE}/auctions/${shipmentId}/open`);
      fetchAuctions();
      setMessage('Auction opened successfully');
    } catch (err) { setMessage(err.response?.data?.message || 'Error opening auction'); }
  };

  const placeBid = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/auctions/${bidForm.shipmentId}/bid`, {
        bidderName: bidForm.name, bidderContact: bidForm.contact, amountUSD: Number(bidForm.amount)
      });
      setMessage(`Bid of $${bidForm.amount} placed successfully`);
      setBidForm({ shipmentId: '', name: '', contact: '', amount: '' });
      fetchAuctions();
    } catch (err) { setMessage(err.response?.data?.message || 'Bid failed'); }
  };

  const acceptBid = async (shipmentId, bidId, bidderName, amountUSD) => {
    setAcceptingBid(bidId);
    try {
      await axios.post(`${API_BASE}/auctions/${shipmentId}/accept-bid`, { bidId });
      setMessage(`✓ Bid accepted — ${bidderName} wins at $${amountUSD.toLocaleString()}`);
      fetchAuctions();
    } catch (err) { setMessage(err.response?.data?.message || 'Failed to accept bid'); }
    finally { setAcceptingBid(null); }
  };

  const hoursLeft = (deadline) => Math.max(0, Math.round((new Date(deadline) - new Date()) / 3600000));
  const isSuccess = message.includes('success') || message.includes('opened') || message.includes('✓');

  return (
    <div style={{
      position: 'fixed', top: '56px', right: 0, width: '420px',
      height: 'calc(100% - 56px)', zIndex: 300,
      background: 'rgba(10,13,26,0.97)',
      backdropFilter: 'blur(20px)',
      borderLeft: '1px solid rgba(255,185,95,0.2)',
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Inter", sans-serif',
      animation: 'slideInPanel 0.25s cubic-bezier(0.16,1,0.3,1)',
      boxShadow: '-4px 0 40px rgba(255,185,95,0.06)',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '16px 20px',
        background: 'rgba(255,185,95,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
            <span style={{ fontSize: '16px' }}>🏛️</span>
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ffb95f' }}>
              PORT AUCTION HOUSE
            </span>
          </div>
          <div style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '20px', fontWeight: 600, color: '#e4e1ed', marginBottom: '4px' }}>
            Distressed Cargo
          </div>
          <div style={{ fontSize: '11px', color: '#908fa0' }}>Perishables at risk · Unclaimed cargo</div>
        </div>
        <button onClick={onClose} style={{
          width: '30px', height: '30px', borderRadius: '6px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#908fa0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
        }}>✕</button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Eligible for Auction */}
        {perishableStuck.length > 0 && (
          <Section label="Eligible for Auction">
            {perishableStuck.map(s => (
              <div key={s.shipmentId} style={{
                padding: '12px', borderRadius: '8px', marginBottom: '8px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,185,95,0.15)',
                borderLeft: '3px solid rgba(255,185,95,0.5)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: '13px', fontWeight: 700, color: '#e4e1ed', letterSpacing: '0.02em' }}>
                      {s.shipmentId}
                    </div>
                    <div style={{ fontSize: '11px', color: '#908fa0', marginTop: '2px' }}>{s.cargoDescription || s.cargoType}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: '14px', fontWeight: 700, color: '#4edea3' }}>
                      ${s.cargoValueUSD?.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '10px', color: '#908fa0' }}>cargo value</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <Badge color="#f43f5e">Expires in {s.expiryHours}h</Badge>
                  <Badge color="#ffb95f">{s.daysStuckAtHub}d at port</Badge>
                  {s.noticesSent > 0 && <Badge color="#c0c1ff">{s.noticesSent} notices</Badge>}
                </div>
                <button onClick={() => openAuction(s.shipmentId)} style={{
                  width: '100%', padding: '8px', borderRadius: '6px',
                  fontFamily: '"Inter",sans-serif', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  background: 'rgba(255,185,95,0.1)', border: '1px solid rgba(255,185,95,0.3)', color: '#ffb95f',
                  transition: 'all 0.15s',
                }}>
                  Open Auction — Min bid ${Math.round((s.cargoValueUSD || 0) * 0.25).toLocaleString()}
                </button>
              </div>
            ))}
          </Section>
        )}

        {/* Live Auctions */}
        {auctions.length > 0 && (
          <Section label="Live Auctions">
            {auctions.map(s => {
              const hl = hoursLeft(s.auction?.auctionDeadline);
              const urgentColor = hl < 6 ? '#f43f5e' : '#ffb95f';
              return (
                <div key={s.shipmentId} style={{
                  padding: '12px', borderRadius: '8px', marginBottom: '8px',
                  background: 'rgba(99,102,241,0.04)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderLeft: '3px solid rgba(99,102,241,0.6)',
                }}>
                  {/* Lot header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div>
                      <div style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: '13px', fontWeight: 700, color: '#e4e1ed', letterSpacing: '0.02em' }}>
                        {s.shipmentId}
                      </div>
                      <div style={{ fontSize: '11px', color: '#908fa0', marginTop: '2px' }}>{s.cargoDescription}</div>
                      <div style={{ fontSize: '10px', color: '#464554', marginTop: '2px' }}>at {s.transitHubs?.at(-1)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: '20px', fontWeight: 700, color: '#4edea3', lineHeight: 1 }}>
                        ${s.auction?.currentBidUSD?.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '10px', color: '#908fa0', marginTop: '3px' }}>current bid</div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: urgentColor, marginTop: '3px' }}>
                        {hl}h left
                      </div>
                    </div>
                  </div>

                  {s.auction?.currentBidder && (
                    <div style={{ fontSize: '11px', color: '#908fa0', marginBottom: '8px' }}>
                      Leading: <span style={{ color: '#c0c1ff', fontWeight: 600 }}>{s.auction.currentBidder}</span>
                    </div>
                  )}

                  <button
                    onClick={() => setBidForm(prev => ({ ...prev, shipmentId: s.shipmentId, amount: s.auction.currentBidUSD + 100 }))}
                    style={{
                      width: '100%', padding: '7px', borderRadius: '6px', marginBottom: '8px',
                      fontFamily: '"Inter",sans-serif', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      background: 'rgba(192,193,255,0.08)', border: '1px solid rgba(192,193,255,0.2)', color: '#c0c1ff',
                    }}>
                    Place Bid
                  </button>

                  {/* Bids list */}
                  {(bids[s.shipmentId] || []).length > 0 && (
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#464554', marginBottom: '6px' }}>
                        Bids ({(bids[s.shipmentId] || []).length})
                      </div>
                      {(bids[s.shipmentId] || []).map(bid => (
                        <div key={bid._id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '7px 10px', borderRadius: '6px', marginBottom: '4px',
                          background: bid.status === 'won' ? 'rgba(78,222,163,0.06)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${bid.status === 'won' ? 'rgba(78,222,163,0.2)' : 'rgba(255,255,255,0.05)'}`,
                        }}>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#e4e1ed' }}>{bid.bidderName}</div>
                            <div style={{ fontSize: '10px', color: '#908fa0' }}>{bid.bidderContact}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: '14px', fontWeight: 700, color: '#4edea3' }}>
                              ${bid.amountUSD.toLocaleString()}
                            </span>
                            {bid.status === 'won' ? (
                              <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: 'rgba(78,222,163,0.12)', color: '#4edea3' }}>WON</span>
                            ) : bid.status === 'outbid' ? (
                              <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 600, background: 'rgba(144,143,160,0.12)', color: '#908fa0' }}>OUTBID</span>
                            ) : (
                              <button
                                onClick={() => acceptBid(s.shipmentId, bid._id, bid.bidderName, bid.amountUSD)}
                                disabled={acceptingBid === bid._id}
                                style={{
                                  padding: '3px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 600,
                                  background: 'rgba(78,222,163,0.1)', border: '1px solid rgba(78,222,163,0.3)', color: '#4edea3',
                                  cursor: 'pointer', fontFamily: '"Inter",sans-serif',
                                  opacity: acceptingBid === bid._id ? 0.6 : 1,
                                }}>
                                {acceptingBid === bid._id ? 'Accepting…' : 'Accept'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </Section>
        )}

        {/* Bid Form */}
        {bidForm.shipmentId && (
          <Section label={`Bidding on ${bidForm.shipmentId}`}>
            <div style={{
              padding: '14px', borderRadius: '8px',
              background: 'rgba(192,193,255,0.04)',
              border: '1px solid rgba(192,193,255,0.15)',
            }}>
              {['name', 'contact', 'amount'].map(field => (
                <input
                  key={field}
                  type={field === 'amount' ? 'number' : 'text'}
                  placeholder={field === 'name' ? 'Your name' : field === 'contact' ? 'Email or phone' : 'Bid amount (USD)'}
                  value={bidForm[field]}
                  onChange={e => setBidForm(p => ({ ...p, [field]: e.target.value }))}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    marginBottom: '8px', padding: '9px 12px', borderRadius: '6px',
                    background: '#0d0d15', border: '1px solid rgba(255,255,255,0.08)',
                    color: '#e4e1ed', fontFamily: '"Inter",sans-serif', fontSize: '12px',
                    outline: 'none',
                  }}
                />
              ))}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={placeBid} style={{
                  flex: 1, padding: '8px', borderRadius: '6px',
                  fontFamily: '"Inter",sans-serif', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', color: '#c0c1ff',
                }}>Submit Bid</button>
                <button onClick={() => setBidForm({ shipmentId: '', name: '', contact: '', amount: '' })} style={{
                  padding: '8px 14px', borderRadius: '6px',
                  fontFamily: '"Inter",sans-serif', fontSize: '12px', cursor: 'pointer',
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#908fa0',
                }}>Cancel</button>
              </div>
            </div>
          </Section>
        )}

        {/* Status message */}
        {message && (
          <div style={{
            padding: '10px 14px', borderRadius: '6px', fontSize: '12px',
            background: isSuccess ? 'rgba(78,222,163,0.08)' : 'rgba(244,63,94,0.08)',
            border: `1px solid ${isSuccess ? 'rgba(78,222,163,0.2)' : 'rgba(244,63,94,0.2)'}`,
            color: isSuccess ? '#4edea3' : '#f43f5e',
            fontWeight: 500,
          }}>{message}</div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes slideInPanel { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#464554', marginBottom: '8px' }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function Badge({ color, children }) {
  return (
    <span style={{
      padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 600,
      background: `${color}18`, color, border: `1px solid ${color}30`,
    }}>{children}</span>
  );
}