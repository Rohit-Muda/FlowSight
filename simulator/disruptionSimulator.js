import Hub from '../models/Hub.js';
import { processDisruption } from '../services/disruptionEngine.js';

export const startDisruptionSimulator = (io) => {
  console.log('Disruption Simulator started');

  setInterval(async () => {
    try {
      const hubs = await Hub.find();
      const randomHub = hubs[Math.floor(Math.random() * hubs.length)];

      const spike = Math.random() > 0.5;
      const newCongestion = spike
        ? Math.floor(Math.random() * 30) + 70
        : Math.floor(Math.random() * 40) + 15;

      const isDisrupted = newCongestion > 70;

      const updatedHub = await Hub.findOneAndUpdate(
        { hubId: randomHub.hubId },
        { $set: { congestionLevel: newCongestion, isDisrupted } },
        { new: true }
      );

      io.emit('hub-update', {
        hubId: updatedHub.hubId,
        name: updatedHub.name,
        congestionLevel: newCongestion,
        isDisrupted
      });

      if (isDisrupted) {
        await processDisruption(updatedHub);
      }

    } catch (error) {
      console.error('Disruption simulator error:', error.message);
    }
  }, 20000);
};