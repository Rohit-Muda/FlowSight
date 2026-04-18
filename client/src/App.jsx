import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import Navbar from './components/Navbar';
import ShipmentMap from './components/ShipmentMap';
import Sidebar from './components/Sidebar';
import AlertPanel from './components/AlertPanel';
import Timeline from './components/Timeline';
import './index.css';

const socket = io('http://localhost:5000');
const API = 'http://localhost:5000/api';

export default function App() {
  const [shipments, setShipments] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [connected, setConnected] = useState(false);
  const [disruptionLogs, setDisruptionLogs] = useState([]);

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

  // Socket listeners
  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('shipment-update', (data) => {
      setShipments(prev =>
        prev.map(s => s.shipmentId === data.shipmentId ? { ...s, ...data } : s)
      );
    });

    socket.on('hub-update', (data) => {
      setHubs(prev =>
        prev.map(h => h.hubId === data.hubId ? { ...h, ...data } : h)
      );
    });

    socket.on('disruption-alert', (data) => {
      setActiveAlert(data);
      setDisruptionLogs(prev => [{
        hubId: data.hubId,
        hubName: data.hubName,
        congestionLevel: data.congestionLevel,
        totalAffected: data.totalAffected,
        aiMessage: data.aiMessage,
        createdAt: data.timestamp
      }, ...prev].slice(0, 20));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('shipment-update');
      socket.off('hub-update');
      socket.off('disruption-alert');
    };
  }, []);

  const handleSimulate = async () => {
    try {
      await axios.post(`${API}/hubs/HUB001/simulate-disruption`);
    } catch (err) {
      console.error('Simulate error:', err.message);
    }
  };

  const stats = {
    total: shipments.length,
    onTime: shipments.filter(s => s.status === 'on-time').length,
    atRisk: shipments.filter(s => s.status === 'at-risk').length,
    delayed: shipments.filter(s => s.status === 'delayed').length,
    disrupted: hubs.filter(h => h.isDisrupted).length
  };

  return (
    <div className="app">
      <Navbar stats={stats} connected={connected} onSimulate={handleSimulate} />
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
    </div>
  );
}