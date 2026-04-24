import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import Navbar from './components/Navbar';
import ShipmentMap from './components/ShipmentMap';
import Sidebar from './components/Sidebar';
import AlertPanel from './components/AlertPanel';
import Timeline from './components/Timeline';
import './index.css';
import AuctionPanel from './components/AuctionPanel';

import { API_BASE, SOCKET_URL } from './config';

// Socket created once at module level — persists across React StrictMode double-invocations
const socket = io(SOCKET_URL, { autoConnect: true });
const API = API_BASE;

export default function App() {
  const [shipments, setShipments] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [connected, setConnected] = useState(false);
  const [disruptionLogs, setDisruptionLogs] = useState([]);
  const [showAuction, setShowAuction] = useState(false);
  // Toast state for simulate-disruption feedback
  const [toast, setToast] = useState(null); // { type: 'error'|'warning', message: string }

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, h, logs] = await Promise.all([
          axios.get(`${API}/shipments`),
          axios.get(`${API}/hubs`),
          axios.get(`${API}/hubs/logs/recent`)
        ]);
        setShipments(s.data);
        setHubs(h.data);
        setDisruptionLogs(logs.data);
      } catch (err) {
        console.error('Fetch error:', err.message);
      }
    };
    fetchData();
  }, []);

  // Socket listeners — use named handler references so .off() correctly
  // removes only these specific handlers (not ALL listeners for the event).
  // This prevents the listener leak that occurs in React 18/19 StrictMode
  // where effects run twice and double-register anonymous handlers.
  useEffect(() => {
    const onConnect    = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onShipmentUpdate = (data) => {
      setShipments(prev =>
        prev.map(s => s.shipmentId === data.shipmentId ? { ...s, ...data } : s)
      );
    };

    const onHubUpdate = (data) => {
      setHubs(prev =>
        prev.map(h => h.hubId === data.hubId ? { ...h, ...data } : h)
      );
    };
    
    const onDisruptionAlert = (data) => {
      setActiveAlert(data);
      setDisruptionLogs(prev => [{
        hubId: data.hubId,
        hubName: data.hubName,
        congestionLevel: data.congestionLevel,
        totalAffected: data.totalAffected,
        aiMessage: data.aiMessage,
        createdAt: data.timestamp
      }, ...prev].slice(0, 20));
    };

    const onAuctionOpened = (data) => {
      console.log('Auction opened:', data.shipmentId);
    };

    socket.on('connect',           onConnect);
    socket.on('disconnect',        onDisconnect);
    socket.on('shipment-update',   onShipmentUpdate);
    socket.on('hub-update',        onHubUpdate);
    socket.on('disruption-alert',  onDisruptionAlert);
    socket.on('auction-opened',    onAuctionOpened);
    // Cleanup: pass the exact same handler reference so only THIS effect's
    // listeners are removed, not any other component's listeners
    return () => {
      socket.off('connect',          onConnect);
      socket.off('disconnect',       onDisconnect);
      socket.off('shipment-update',  onShipmentUpdate);
      socket.off('hub-update',       onHubUpdate);
      socket.off('disruption-alert', onDisruptionAlert);
      socket.off('auction-opened',   onAuctionOpened);
    };
  }, []);

  const showToast = (type, message, durationMs = 5000) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), durationMs);
  };

  const handleSimulate = async () => {
    try {
      await axios.post(`${API}/hubs/HUB001/simulate-disruption`);
    } catch (err) {
      // Determine a user-friendly message
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        showToast('error', '⚠️ Backend unreachable — ensure the server is running on port 5000.');
      } else if (err.response?.status === 429) {
        // Rate-limit cooldown from the backend
        const msg = err.response?.data?.message || 'Simulation on cooldown. Try again shortly.';
        showToast('warning', `⏱ ${msg}`);
      } else {
        showToast('error', `Simulation failed: ${err.response?.data?.message || err.message}`);
      }
      console.error('Simulate disruption error:', err.message);
    }
  };

  const stats = {
    total:     shipments.length,
    onTime:    shipments.filter(s => s.status === 'on-time').length,
    atRisk:    shipments.filter(s => s.status === 'at-risk').length,
    delayed:   shipments.filter(s => s.status === 'delayed').length,
    disrupted: hubs.filter(h => h.isDisrupted).length
  };

  return (
    <div className="app">
      <Navbar stats={stats} connected={connected} onSimulate={handleSimulate} onAuction={() => setShowAuction(true)} />
      <div className="main-layout">
        <div className="map-and-timeline">
          <ShipmentMap shipments={shipments} hubs={hubs} />
          <Timeline logs={disruptionLogs} />
        </div>
        <Sidebar shipments={shipments} />
      </div>
      {activeAlert && (
        <AlertPanel
          alert={activeAlert}
          hubs={hubs}
          onClose={() => setActiveAlert(null)}
        />
      )}
      {showAuction && (
        <AuctionPanel
          shipments={shipments}
          onClose={() => setShowAuction(false)}
        />
      )}
      {toast && (
        <div className={`app-toast app-toast--${toast.type}`} role="alert">
          {toast.message}
          <button className="app-toast__close" onClick={() => setToast(null)} aria-label="Dismiss">✕</button>
        </div>
      )}
    </div>
  );
}