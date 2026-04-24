1. PROJECT OVERVIEW
   Project Name: FlowSight
   Full Title: Real-time Supply Chain Disruption Detection and Intelligent Rerouting System
   One Line Description: A live logistics intelligence dashboard that detects supply chain disruptions before they cascade, scores risk across affected shipments, and recommends optimized reroutes — powered by AI-generated alerts.
   Key Numbers:
   • 10 live shipments tracked simultaneously
   • 6 global hub nodes (major world ports)
   • 3 second GPS update interval
   • 30 second anomaly scan interval
   • Risk score range: 0 to 100
   • 3 reroute options per disrupted hub

---

2. PROBLEM STATEMENT
   Modern global supply chains manage millions of concurrent shipments across highly complex and volatile transportation networks. Critical transit disruptions — from sudden weather events to hidden operational bottlenecks — are chronically identified only after delivery timelines are already compromised.
   The Objective: Design a scalable system capable of continuously analyzing multifaceted transit data to preemptively detect and flag potential supply chain disruptions. Formulate dynamic mechanisms that instantly execute or recommend highly optimized route adjustments before localized bottlenecks cascade into broader delays.
   Core Problems We Solve:
   Problem 1 — Reactive not Predictive: Current systems alert managers after a delay occurs. By then, downstream shipments are already affected and rerouting windows are missed.
   Problem 2 — Cascade Blindness: A single port delay affects dozens of connected shipments. No existing affordable tool traces that ripple effect automatically.
   Problem 3 — No Actionable Intelligence: Raw alerts show congestion numbers but don't tell logistics managers what to do next or which shipments to prioritize.
   Problem 4 — Cost Barrier: Enterprise solutions like Resilinc and Kinaxis cost $500,000 to $5,000,000 per year. 95% of logistics companies cannot access them.
   Market Context:
   • $184 billion annual disruption cost globally
   • 80% of organizations experienced supply chain disruption in 2024
   • Major disruptions occur every 3.7 years on average
   • Average cost per disruption: $1.5 million per day

---

3. OUR SOLUTION
   Flow Sight solves this in 5 layers:
   Layer 1 — Continuous Monitoring: GPS simulator sends shipment position updates every 3 seconds. Hub congestion levels update every 20 seconds. All data flows through Socket.io with no polling required.
   Layer 2 — Anomaly Detection: Every 30 seconds the Disruption Engine scans all hubs. Any hub exceeding 70% congestion triggers immediate processing. Recovery is also detected and hubs auto-clear when congestion drops.
   Layer 3 — Cascade Detection: When a hub is flagged, the system finds every shipment whose route passes through it using a MongoDB array query. One query returns all connected downstream shipments instantly.
   Layer 4 — Risk Scoring: Each affected shipment receives a new risk score using a weighted formula combining real-time congestion, weather risk, and historical delay rates. Score range is 0 to 100.
   Layer 5 — Intelligent Response: Gemini AI generates a plain-English 2-sentence alert. Three rerouting options are scored and ranked by reliability vs cost vs time. Everything appears on screen in under 2 seconds.
   What Makes Us Different:
1. Ripple Score — Not just "hub is disrupted" but a calculated impact score (0-100) for every downstream shipment. Managers know exactly which shipments to act on first.
1. AI Plain-English Alerts — Gemini generates human-readable explanations per disruption. No dashboard reading required — the system tells you what happened and what to do.
1. Open and Accessible — Built on open MERN stack. Any developer can understand, deploy, and extend it. No vendor lock-in. No annual subscription fee.
1. Live Demo Button — "Simulate Disruption" triggers a real disruption event through the actual engine, not mocked. Every feature fires in front of judges in 3 seconds.

---

4. SYSTEM ARCHITECTURE
   The system has 4 layers:
   Layer 1 — Data Sources:
   • GPS Simulator (mock IoT sensor data)
   • Disruption Simulator (mock congestion spikes)
   • Weather risk function (based on hub coordinates)
   • Historical delay rates per hub (hardcoded baseline)
   • MongoDB Atlas (persistent storage)
   Layer 2 — Backend Processing:
   • Node.js + Express REST API handles all HTTP requests
   • Socket.io maintains persistent WebSocket connections to all browser clients
   • Three independent interval processes run simultaneously: GPS every 3 seconds, disruption every 20 seconds, anomaly engine every 30 seconds
   Layer 3 — Intelligence Core:
   • disruptionEngine.js runs the weighted risk formula and cascade detection
   • geminiService.js calls Gemini 1.5 Flash API with a structured prompt
   • Route scoring ranks alternates by reliability vs time vs cost
   • All logic runs server-side before any data reaches the frontend
   Layer 4 — Frontend Display:
   • React single page app with 5 components
   • Navbar (live stats), ShipmentMap (Leaflet.js), Sidebar (risk-sorted list), AlertPanel (slide-in disruption card), Timeline (Recharts area chart)
   • All updates via Socket.io events — no polling, no page refresh
   Data Flow — Normal (every 3 seconds): GPS fires → MongoDB updated → Socket emits shipment-update → React moves map marker
   Data Flow — Disruption: Congestion spikes → Engine detects anomaly → Cascade finds affected shipments → Risk scores recalculated → Gemini generates alert text → DisruptionLog saved to MongoDB → Socket emits disruption-alert → AlertPanel slides in on frontend
   Socket Events:
   Event: shipment-update | Direction: Server to Client | Trigger: Every 3 seconds per shipment | Payload: shipmentId, currentLocation, status, riskScore
   Event: hub-update | Direction: Server to Client | Trigger: Every congestion change | Payload: hubId, name, congestionLevel, isDisrupted
   Event: disruption-alert | Direction: Server to Client | Trigger: When congestion exceeds 70% | Payload: hubId, hubName, congestionLevel, rippleScore, affectedShipments, aiMessage, timestamp

---

5. COMPLETE FEATURES LIST
1. Live world map — Dark CartoDB tile map with real-time moving shipment markers and hub markers (Leaflet.js)
1. Colored shipment markers — Green = on-time, Orange = at-risk, Red = delayed. Custom glow effect per status
1. Hub markers — Purple = operational, Red = disrupted with pulsing ring effect
1. Popup on click — Click any marker to see ID, route, carrier, risk score, status badge
1. Live navbar counters — Total, On-Time, At-Risk, Delayed, Disrupted Hubs all update in real time
1. Live connection badge — Green pulsing "Live" or red "Offline" based on Socket.io connection state
1. Simulate disruption button — Triggers Mumbai Port disruption through real engine, not mocked
1. Risk-sorted sidebar — All 10 shipments sorted by risk score descending with colored progress bars
1. Status badges — Color-coded pill badges per shipment status with animated dot
1. Disruption alert panel — Slides in from right side showing hub name, congestion bar, ripple score bar
1. Affected shipments list — Every shipment impacted by disruption with risk score and carrier
1. Reroute options — Top 3 alternate routes scored by reliability vs time vs cost with color tags
1. AI alert text — Real Gemini 1.5 Flash generated 2-sentence explanation per disruption
1. Disruption timeline chart — Recharts area chart of all disruption events. X axis is time, Y axis is congestion level, threshold line at 70%
1. Timeline tooltip — Hover any chart point to see hub name, congestion percentage, affected shipment count
1. Auto recovery — When congestion drops below 70%, hub marker automatically turns back to normal color
1. Persistent history — Every disruption saved to MongoDB DisruptionLog. Timeline reloads history on page refresh

---

6. TECH STACK
   Frontend:
   • React 18 — UI framework, component-based, state management
   • Leaflet.js + React-Leaflet — Interactive world map, custom markers, popups
   • Socket.io-client — WebSocket connection to receive live events from backend
   • Axios — HTTP requests to fetch initial data on app load
   • Recharts — Area chart for disruption timeline with custom tooltip
   Backend:
   • Node.js 20 LTS — JavaScript runtime
   • Express.js — REST API framework, handles all HTTP routes
   • Socket.io — WebSocket server, pushes real-time events to all connected clients
   • Mongoose — MongoDB ODM, defines schemas, runs database queries
   • @google/generative-ai — Gemini 1.5 Flash SDK for AI alert generation
   • dotenv — Loads environment variables securely
   Database and AI:
   • MongoDB Atlas — Cloud database, stores shipments, hubs, disruption logs. Free M0 tier.
   • Google Gemini 1.5 Flash — Generates plain-English disruption alerts per event
   Deployment:
   • Firebase Hosting — Serves React frontend globally. Part of Google Cloud Platform. Free tier.
   • Railway — Hosts Node.js backend. Auto-deploys from GitHub. Free tier.
   Language: 100% JavaScript — MERN Stack (MongoDB, Express, React, Node.js). Same language across frontend and backend. ES Modules (import/export) used throughout.

---

7. ALGORITHMS AND FORMULAS
   Core Risk Scoring Formula:
   rippleScore = (congestionLevel × 0.5) + (weatherRisk × 0.3) + (historicalDelayRate × 0.2)
   Why these weights:
   • Congestion gets 50% weight — strongest real-time signal, directly measurable
   • Weather gets 30% weight — best predictive signal, forecasts future delays
   • Historical rate gets 20% weight — baseline, some hubs are structurally slower
   Shipment Risk Blend Formula:
   newShipmentRisk = (existingRisk × 0.4) + (rippleScore × 0.6)
   Why: The hub's ripple score dominates (60%) because the disruption is the immediate cause. Previous risk contributes (40%) because a shipment already late is more vulnerable.
   Route Scoring Formula:
   routeScore = (reliabilityScore × 0.6) - (extraTimeMins × 0.04)
   Why: Reliability weighted heavily (60%) — a route that arrives 95% of the time is better than one slightly faster but unreliable. Time penalty subtracts from score so longer detours rank lower.
   Cascade Detection Logic: Each shipment stores a transitHubs array — for example ["Mumbai Port", "Dubai Port", "Rotterdam Port"]. When a hub is disrupted, MongoDB queries all shipments where the transitHubs array contains that hub's name. One query returns all connected shipments instantly. This is a simplified Breadth-First Search — find all nodes connected to the disrupted node.
   Anomaly Detection Threshold: Any hub above 70% congestion is classified as disrupted. Below 70% = operational. This threshold line is also drawn on the Timeline chart as a visual reference.
   Status Classification:
   • Risk Score 0 to 39 = on-time (Green marker)
   • Risk Score 40 to 69 = at-risk (Orange marker)
   • Risk Score 70 to 100 = delayed (Red marker)
   Historical Delay Rates Per Hub:
   • Mumbai Port — 35% (moderate, monsoon season disruptions)
   • Dubai Port — 28% (low-moderate, efficient operations)
   • Rotterdam Port — 45% (high, Europe's busiest port)
   • Singapore Port — 20% (lowest, world's most efficient port)
   • Shanghai Port — 60% (highest, volume overload and lockdown history)
   • New York Port — 38% (moderate-high, labor strikes and seasonal issues)

---

8. DATABASE MODELS
   Shipment Model Fields:
   • shipmentId (String, unique) — Primary identifier e.g. SHP001
   • origin (Object: city, country) — Where shipment started
   • destination (Object: city, country) — Where shipment is going
   • currentLocation (Object: lat, lng) — Live GPS position, updates every 3 seconds
   • carrier (String) — Shipping company e.g. Maersk, DHL, COSCO
   • status (Enum: on-time / at-risk / delayed) — Current state, drives marker color
   • riskScore (Number 0-100) — Calculated disruption risk
   • estimatedArrival (Date) — Expected delivery time
   • transitHubs (Array of Strings) — Hub names this route passes through, used for cascade detection
   • createdAt / updatedAt (Date, auto) — Mongoose timestamps
   Hub Model Fields:
   • hubId (String, unique) — Primary identifier e.g. HUB001
   • name (String) — Port name e.g. Mumbai Port
   • location (Object: lat, lng) — Fixed GPS coordinates for map marker
   • type (Enum: port / airport / warehouse / customs) — Hub classification
   • congestionLevel (Number 0-100) — Current congestion, drives disruption detection
   • isDisrupted (Boolean) — True when congestion exceeds 70%
   • alternateRoutes (Array of objects) — Each has name, extraTimeMins, extraCostUSD, reliabilityScore
   DisruptionLog Model Fields:
   • hubId (String) — Which hub triggered the disruption
   • hubName (String) — Human readable hub name
   • congestionLevel (Number) — Congestion snapshot at time of alert
   • affectedShipments (Array of objects) — Full snapshot of each affected shipment with computed riskScore
   • totalAffected (Number) — Quick count of affected shipments
   • aiMessage (String) — Gemini-generated plain-English explanation
   • resolved (Boolean) — Whether disruption has cleared
   • createdAt (Date, auto) — Timestamp, used as X axis on timeline chart
   Seed Data — 10 Shipments:
   • SHP001: Mumbai → Rotterdam, Maersk, on-time, hubs: Mumbai Port, Dubai Port, Rotterdam Port
   • SHP002: Shanghai → New York, COSCO, on-time, hubs: Shanghai Port, Singapore Port, New York Port
   • SHP003: Dubai → Singapore, MSC, at-risk, hubs: Dubai Port, Singapore Port
   • SHP004: Rotterdam → Mumbai, DHL, on-time, hubs: Rotterdam Port, Dubai Port, Mumbai Port
   • SHP005: Singapore → Rotterdam, Evergreen, delayed, hubs: Singapore Port, Dubai Port, Rotterdam Port
   • SHP006: New York → Shanghai, FedEx, on-time, hubs: New York Port, Singapore Port, Shanghai Port
   • SHP007: Mumbai → Singapore, Maersk, at-risk, hubs: Mumbai Port, Singapore Port
   • SHP008: Rotterdam → New York, MSC, on-time, hubs: Rotterdam Port, New York Port
   • SHP009: Shanghai → Dubai, COSCO, on-time, hubs: Shanghai Port, Singapore Port, Dubai Port
   • SHP010: Dubai → Rotterdam, DHL, at-risk, hubs: Dubai Port, Rotterdam Port
   6 Hubs:
   • HUB001: Mumbai Port (18.9220, 72.8347)
   • HUB002: Dubai Port (25.2048, 55.2708)
   • HUB003: Rotterdam Port (51.9225, 4.4792)
   • HUB004: Singapore Port (1.3521, 103.8198)
   • HUB005: Shanghai Port (31.2304, 121.4737)
   • HUB006: New York Port (40.6840, -74.0440)

---

9. API ENDPOINTS
   GET / — Health check, returns API status GET /api/shipments — Fetch all 10 shipments GET /api/shipments/:shipmentId — Fetch single shipment by ID PATCH /api/shipments/:shipmentId — Update any shipment field GET /api/hubs — Fetch all 6 hubs GET /api/hubs/logs/recent — Last 20 disruption logs from MongoDB GET /api/hubs/:hubId/reroute — Get scored reroute options for a hub PATCH /api/hubs/:hubId — Update any hub field POST /api/hubs/:hubId/simulate-disruption — Trigger demo disruption through real engine

---

10. USER FLOW
    Step 1 — Open Dashboard: User opens the app URL. React fetches all shipments, hubs, and recent disruption logs simultaneously. Map renders with dark CartoDB tiles.
    Step 2 — See Live Map: 10 colored shipment dots appear on the world map. 6 hub circles appear at port locations. Green pulsing dot in navbar confirms live Socket.io connection.
    Step 3 — Watch Shipments Move: Every 3 seconds, shipment markers shift slightly on the map. This is the GPS simulator running in the backend.
    Step 4 — Click a Marker: Popup appears showing Shipment ID, carrier, origin to destination, risk score as a large color-coded number, current status badge.
    Step 5 — Read Sidebar: Right panel shows all 10 shipments sorted by highest risk first. Each card has status badge, route, carrier, and colored progress bar showing risk score.
    Step 6 — Disruption Fires: Either the simulator randomly spikes a hub every 20 seconds OR user clicks "Simulate Disruption". Hub marker turns red on map. Navbar disrupted hub count increments.
    Step 7 — Alert Panel Slides In: Right-side panel animates in showing hub name, timestamp, congestion bar at current level, ripple risk score bar, list of all affected shipments with individual risk scores.
    Step 8 — Read Reroute Options: Three alternate routes shown with color tags — extra time in hours (amber), extra cost in USD (red), reliability percentage (green). Manager picks the best tradeoff.
    Step 9 — Read AI Alert: Gemini-generated 2-sentence explanation tells exactly what happened and what immediate action to take. Written for a logistics manager, not an engineer.
    Step 10 — Check Timeline: Bottom chart shows the disruption event as a new peak on the area chart. Hovering shows hub name, congestion percentage, affected shipment count. History persists across page refreshes.

---

11. FILE AND FOLDER STRUCTURE
    supply-chain-app/ (backend root)
    • config/db.js — MongoDB connection logic
    • models/Shipment.js — Shipment data schema
    • models/Hub.js — Hub data schema
    • models/DisruptionLog.js — Disruption history schema
    • routes/shipments.js — GET and PATCH shipment API routes
    • routes/hubs.js — Hub API routes including reroute and simulate
    • simulator/gpsSimulator.js — Moves all shipments every 3 seconds
    • simulator/disruptionSimulator.js — Randomly spikes hub congestion every 20 seconds
    • services/disruptionEngine.js — Risk scoring, cascade detection, anomaly detection
    • services/geminiService.js — Gemini API call and alert generation
    • server.js — Express + Socket.io entry point
    • socket.js — Socket.io singleton pattern
    • seed.js — Seeds 10 shipments and 6 hubs into MongoDB
    • nodemon.json — Nodemon configuration for ES modules
    • package.json — type module enabled, all dependencies
    • .env — MONGO_URI, PORT, GEMINI_API_KEY (never pushed to GitHub)
    • .gitignore — Excludes node_modules and .env
    supply-chain-app/client/ (frontend root)
    • src/components/Navbar.jsx — Brand, live stats, simulate button
    • src/components/ShipmentMap.jsx — Leaflet map, custom markers, popups
    • src/components/Sidebar.jsx — Shipment list sorted by risk score
    • src/components/AlertPanel.jsx — Slide-in alert, reroutes, AI section
    • src/components/Timeline.jsx — Recharts disruption history chart
    • src/App.jsx — Root component, socket connection, global state
    • src/index.js — React DOM entry point
    • src/index.css — Full dark design system, all component styles
    • src/config.js — API base URL switching between local and production
    • public/index.html — HTML shell

---

12. DEPLOYMENT

---

13. FUTURE SCOPE
    Phase 2 — Smart Layer:
    • Real Weather API integration — Replace simulated weather risk with live OpenWeatherMap API calls per hub coordinate
    • Time-based anomaly detection — Compare current congestion against historical average for that hub at that specific time of day and week
    • Better scoring model — Replace weighted formula with a trained ML model using Isolation Forest algorithm on historical disruption data
    Phase 3 — Differentiation Features:
    • What-If Simulation Mode — User selects any hub, sets a hypothetical congestion level, system shows impact without triggering real disruption
    • Cost vs Time vs Risk Slider — Adjust priority weighting and reroute options rerank dynamically
    • Historical Replay Mode — Scrub through past disruption events like a video timeline for post-mortem analysis
    • Real Carrier API Integration — Connect to MarineTraffic API for actual vessel tracking data
    • Multi-User Support — Authentication layer so different companies see only their own shipments
    Phase 4 — Scale:
    • Replace Socket.io with Apache Kafka — For 10,000+ concurrent shipments, Kafka handles millions of events per second with guaranteed delivery
    • Replace MongoDB with Neo4j Graph Database — Model transit hub relationships as a true graph for native cascade detection queries

---

14. COMPETITIVE ANALYSIS
    Existing enterprise solutions and why Flow Sight is different:
    Resilinc — Gartner Magic Quadrant Leader 2025. Monitors 100M+ sources. Costs $500K-$5M/year. Not accessible to small/mid companies.
    Kinaxis Maestro — AI supply chain planning platform. Enterprise pricing. Complex setup requiring dedicated IT teams.
    SAP/Microsoft AI Control Towers — Large enterprise only. Requires existing SAP/Microsoft infrastructure.
    Flow Sight Advantage:
    • Built on open-source MERN stack — any developer can deploy it
    • Zero licensing cost — all free tier services
    • Built in 8 days by one developer — proves accessibility
    • Demo-ready in 3 seconds — simulate button shows full flow instantly
    • Explainable AI — risk formula is transparent, not a black box
    • Target audience: 95% of logistics companies that cannot afford enterprise tools
