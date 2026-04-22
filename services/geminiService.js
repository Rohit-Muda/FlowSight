import { GoogleGenAI } from '@google/genai';

// Lazy initialization — defer client construction until first use,
// so dotenv has already loaded GEMINI_API_KEY by the time this runs
let ai = null;
const getAI = () => {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
};

export const generateDisruptionAlert = async (hubName, congestionLevel, affectedShipments, rippleScore) => {
  try {
    const shipmentList = affectedShipments
      .map(s => `${s.shipmentId} (${s.origin?.city} to ${s.destination?.city}, carrier: ${s.carrier})`)
      .join('; ');

    const prompt = `You are a supply chain risk analyst AI assistant. 
Generate exactly 2 sentences for a logistics manager alert. Be specific, professional and urgent.

Data:
- Hub: ${hubName}
- Current congestion: ${congestionLevel}% (threshold is 70%)
- Overall ripple risk score: ${rippleScore}/100
- Affected shipments (${affectedShipments.length} total): ${shipmentList}

First sentence: describe what is happening at the hub and severity level.
Second sentence: state the recommended immediate action for the logistics manager.
Do not use bullet points, markdown, or line breaks. Write plain sentences only.`;

    const response = await getAI().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const text = response.text.trim();
    console.log(`Gemini alert generated for ${hubName}`);
    return text;

  } catch (error) {
    console.error('Gemini API error:', error.message);
    // Robust fallback — always returns a meaningful alert even if API fails
    return `${hubName} is experiencing critical congestion at ${congestionLevel}%, with a ripple risk score of ${rippleScore}/100 across ${affectedShipments.length} active shipment(s). Immediate rerouting is recommended — review alternate route options and contact carriers for the affected shipments.`;
  }
};