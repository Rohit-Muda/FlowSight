# 1. PROJECT OVERVIEW
**Project Name:** FlowSight
**Full Title:** Real-time Supply Chain Disruption Detection and Intelligent Rerouting System
**One Line Description:** A live logistics intelligence dashboard that detects supply chain disruptions before they cascade, scores risk across affected shipments, and recommends optimized reroutes — powered by AI-generated alerts.

**Key Numbers:**
•	10 live shipments tracked simultaneously
•	6 global hub nodes (major world ports)
•	3 second GPS update interval
•	30 second anomaly scan interval
•	Risk score range: 0 to 100
•	3 reroute options per disrupted hub

---

# 2. PROBLEM STATEMENT
Modern global supply chains manage millions of concurrent shipments across highly complex and volatile transportation networks. Critical transit disruptions — from sudden weather events to hidden operational bottlenecks — are chronically identified only after delivery timelines are already compromised.

**The Objective:** Design a scalable system capable of continuously analyzing multifaceted transit data to preemptively detect and flag potential supply chain disruptions. Formulate dynamic mechanisms that instantly execute or recommend highly optimized route adjustments before localized bottlenecks cascade into broader delays.

**Core Problems We Solve:**
1. **Reactive not Predictive:** Current systems alert managers after a delay occurs. By then, downstream shipments are already affected and rerouting windows are missed.
2. **Cascade Blindness:** A single port delay affects dozens of connected shipments. No existing affordable tool traces that ripple effect automatically.
3. **No Actionable Intelligence:** Raw alerts show congestion numbers but don't tell logistics managers what to do next or which shipments to prioritize.
4. **Cost Barrier:** Enterprise solutions like Resilinc and Kinaxis cost $500,000 to $5,000,000 per year. 95% of logistics companies cannot access them.

**Market Context:**
•	$184 billion annual disruption cost globally
•	80% of organizations experienced supply chain disruption in 2024
•	Major disruptions occur every 3.7 years on average
•	Average cost per disruption: $1.5 million per day

---

# 3. OUR SOLUTION
FlowSight solves this in 5 layers:

**Layer 1 — Continuous Monitoring:** GPS simulator sends shipment position updates every 3 seconds. Hub congestion levels update every 20 seconds. All data flows through Socket.io with no polling required.
**Layer 2 — Anomaly Detection:** Every 30 seconds the Disruption Engine scans all hubs. Any hub exceeding 70% congestion triggers immediate processing. Recovery is also detected and hubs auto-clear when congestion drops.
**Layer 3 — Cascade Detection:** When a hub is flagged, the system finds every shipment whose route passes through it using a MongoDB array query. One query returns all connected downstream shipments instantly.
**Layer 4 — Risk Scoring:** Each affected shipment receives a new risk score using a weighted formula combining real-time congestion, weather risk, and historical delay rates. Score range is 0 to 100.
**Layer 5 — Intelligent Response:** Gemini AI generates a plain-English 2-sentence alert. Three rerouting options are scored and ranked by reliability vs cost vs time. Everything appears on screen in under 2 seconds.

**What Makes Us Different:**
1.	**Ripple Score:** Not just "hub is disrupted" but a calculated impact score (0-100) for every downstream shipment. Managers know exactly which shipments to act on first.
2.	**AI Plain-English Alerts:** Gemini generates human-readable explanations per disruption. No dashboard reading required — the system tells you what happened and what to do.
3.	**Premium UI/UX:** Built with a modern Stitch design system featuring frosted glass (glassmorphism), cohesive color tokens (Electric Indigo, Emerald, Amber), and dynamic animations.
4.	**Live Demo Button:** "Simulate Disruption" triggers a real disruption event through the actual engine, not mocked. Every feature fires in front of judges in 3 seconds.

---

# 4. SYSTEM ARCHITECTURE
The system has 4 layers:

**Layer 1 — Data Sources:**
•	GPS Simulator (mock IoT sensor data)
•	Disruption Simulator (mock congestion spikes)
•	Weather risk function (based on hub coordinates)
•	Historical delay rates per hub (hardcoded baseline)
•	MongoDB Atlas (persistent storage)

**Layer 2 — Backend Processing:**
•	Node.js + Express REST API handles all HTTP requests
•	Socket.io maintains persistent WebSocket connections to all browser clients
•	Three independent interval processes run simultaneously: GPS every 3 seconds, disruption every 20 seconds, anomaly engine every 30 seconds

**Layer 3 — Intelligence Core:**
•	disruptionEngine.js runs the weighted risk formula and cascade detection
•	geminiService.js calls Gemini 1.5 Flash API with a structured prompt
•	Route scoring ranks alternates by reliability vs time vs cost
•	All logic runs server-side before any data reaches the frontend

**Layer 4 — Frontend Display:**
•	React single page app with 5 components
•	Navbar (live stats), ShipmentMap (Leaflet.js), Sidebar (risk-sorted list), AlertPanel (slide-in disruption card), Timeline (Recharts area chart)
•	All updates via Socket.io events — no polling, no page refresh

**Data Flow — Normal (every 3 seconds):** GPS fires → MongoDB updated → Socket emits shipment-update → React moves map marker
**Data Flow — Disruption:** Congestion spikes → Engine detects anomaly → Cascade finds affected shipments → Risk scores recalculated → Gemini generates alert text → DisruptionLog saved to MongoDB → Socket emits disruption-alert → AlertPanel slides in on frontend

---

# 5. COMPLETE FEATURES LIST
1.	**Live world map:** Dark CartoDB tile map with real-time moving shipment markers and hub markers (Leaflet.js).
2.	**Colored shipment markers:** Green = on-time, Orange = at-risk, Red = delayed. Custom glow effect per status.
3.	**Hub markers:** Purple = operational, Red = disrupted with pulsing ring effect.
4.	**Popup on click:** Click any marker to see ID, route, carrier, risk score, status badge.
5.	**Live navbar counters:** Total, On-Time, At-Risk, Delayed, Disrupted Hubs all update in real time.
6.	**Live connection badge:** Green pulsing "Live" or red "Offline" based on Socket.io connection state.
7.	**Simulate disruption button:** Triggers Mumbai Port disruption through real engine, not mocked.
8.	**Risk-sorted sidebar:** All 10 shipments sorted by risk score descending with colored progress bars.
9.	**Status badges:** Color-coded pill badges per shipment status with animated dot.
10.	**Disruption alert panel:** Slides in from right side showing hub name, conic-gradient risk dial, and Gemini AI context.
11.	**Affected shipments list:** Every shipment impacted by disruption with risk score and carrier.
12.	**Reroute & Auction panel:** Top alternate routes scored by reliability vs time vs cost with integrated bidding inputs.
13.	**AI alert text:** Real Gemini 1.5 Flash generated 2-sentence explanation per disruption.
14.	**Disruption timeline chart:** Recharts area chart of all disruption events. X axis is time, Y axis is congestion level, threshold line at 70%.
15.	**Timeline tooltip:** Hover any chart point to see hub name, congestion percentage, affected shipment count.
16.	**Auto recovery:** When congestion drops below 70%, hub marker automatically turns back to normal color.
17.	**Persistent history:** Every disruption saved to MongoDB DisruptionLog. Timeline reloads history on page refresh.

---

# 6. TECH STACK
**Frontend:**
•	React 18 — UI framework, component-based, state management
•	Leaflet.js + React-Leaflet — Interactive world map, custom markers, popups
•	Socket.io-client — WebSocket connection to receive live events from backend
•	Axios — HTTP requests to fetch initial data on app load
•	Recharts — Area chart for disruption timeline with custom tooltip
•	Vanilla CSS + Stitch Design System — Custom UI styling

**Backend:**
•	Node.js 22 LTS — JavaScript runtime
•	Express.js — REST API framework, handles all HTTP routes
•	Socket.io — WebSocket server, pushes real-time events to all connected clients
•	Mongoose — MongoDB ODM, defines schemas, runs database queries
•	@google/generative-ai — Gemini 1.5 Flash SDK for AI alert generation
•	dotenv — Loads environment variables securely

**Database and AI:**
•	MongoDB Atlas — Cloud database, stores shipments, hubs, disruption logs. Free M0 tier.
•	Google Gemini 1.5 Flash — Generates plain-English disruption alerts per event.

**Deployment:**
•	Google Cloud Run — Fully managed serverless execution environment for containerized applications.
•	Docker — Multi-stage containerization for both frontend (via Nginx) and backend.

**Language:** 100% JavaScript — MERN Stack (MongoDB, Express, React, Node.js). Same language across frontend and backend. ES Modules (import/export) used throughout.

---

# 7. ALGORITHMS AND FORMULAS
**Core Risk Scoring Formula:**
`rippleScore = (congestionLevel × 0.5) + (weatherRisk × 0.3) + (historicalDelayRate × 0.2)`
*Why:* Congestion gets 50% weight (strongest real-time signal), Weather gets 30% (predictive), Historical gets 20% (baseline).

**Shipment Risk Blend Formula:**
`newShipmentRisk = (existingRisk × 0.4) + (rippleScore × 0.6)`
*Why:* Hub's ripple score dominates (60%) because disruption is the immediate cause.

**Route Scoring Formula:**
`routeScore = (reliabilityScore × 0.6) - (extraTimeMins × 0.04)`
*Why:* Reliability weighted heavily (60%). Time penalty subtracts from score so longer detours rank lower.

**Cascade Detection Logic:** Each shipment stores a `transitHubs` array. When a hub is disrupted, MongoDB queries all shipments containing that hub's name. A simplified Breadth-First Search finding all nodes connected to the disrupted node.

**Anomaly Detection Threshold:** Any hub above 70% congestion is classified as disrupted.

**Historical Delay Rates Per Hub:**
•	Mumbai Port: 35% (moderate)
•	Dubai Port: 28% (low-moderate)
•	Rotterdam Port: 45% (high)
•	Singapore Port: 20% (lowest)
•	Shanghai Port: 60% (highest)
•	New York Port: 38% (moderate-high)

---

# 8. DATABASE MODELS
**(Unchanged - Core schemas for Shipment, Hub, DisruptionLog, and Seed Data)**
*See original documentation for full model fields.*

---

# 9. API ENDPOINTS
•	`GET /` — Health check
•	`GET /api/shipments` — Fetch all shipments
•	`GET /api/shipments/:shipmentId` — Fetch single shipment by ID
•	`PATCH /api/shipments/:shipmentId` — Update shipment field
•	`GET /api/hubs` — Fetch all hubs
•	`GET /api/hubs/logs/recent` — Last 20 disruption logs from MongoDB
•	`GET /api/hubs/:hubId/reroute` — Get scored reroute options
•	`PATCH /api/hubs/:hubId` — Update hub field
•	`POST /api/hubs/:hubId/simulate-disruption` — Trigger demo disruption through real engine

---

# 10. USER FLOW
*(Unchanged - Follows the exact steps 1 through 10 as described originally).*

---

# 11. FILE AND FOLDER STRUCTURE
**Backend (`/`)**
•	`config/`, `models/`, `routes/`, `simulator/`, `services/`
•	`server.js`, `socket.js`, `seed.js`
•	`Dockerfile` — Container configuration for Node.js API
•	`.gitignore` — Excludes sensitive files and logs

**Frontend (`/client`)**
•	`src/components/` — React UI components (Navbar, AlertPanel, AuctionPanel, etc.)
•	`src/index.css` — Global Stitch design tokens and styles
•	`src/config.js` — Cloud Run API base URL mappings
•	`Dockerfile` — Multi-stage build (Node build -> Nginx serving)
•	`nginx.conf` — Custom server rules for React routing on port 8080

---

# 12. DEPLOYMENT
FlowSight utilizes a modern, serverless container architecture hosted entirely on **Google Cloud Platform (GCP)** via **Cloud Run**. 

1. **Backend Infrastructure:**
   - Containerized using Docker (`node:22-alpine` image).
   - Deployed as a Cloud Run service (`flowsight-backend`).
   - Automatically injects secrets (`MONGO_URI`, `GEMINI_API_KEY`) via Cloud Run Environment Variables.
   - Session Affinity is explicitly enabled to support reliable Socket.io WebSockets falling back to polling over the cloud.

2. **Frontend Infrastructure:**
   - Containerized using a multi-stage Docker build.
   - **Stage 1:** Compiles the React application into static files.
   - **Stage 2:** Uses an `nginx:alpine` image to serve the build artifacts.
   - A custom `nginx.conf` routes all traffic to `index.html` to support React Router SPA fallback and runs on the Cloud Run required port `8080`.
   - Deployed as a distinct Cloud Run service (`flowsight-frontend`).

3. **Security & Access:**
   - Services are deployed in the `asia-south1` region.
   - Explicit Cross-Origin Resource Sharing (CORS) is configured on both the Express API (`server.js`) and Socket.io (`socket.js`) to securely bridge the frontend and backend instances over HTTPS.

---

# 13. FUTURE SCOPE
**Phase 2 — Smart Layer:**
•	Real Weather API integration (OpenWeatherMap).
•	Time-based anomaly detection compared to historical averages.
•	Machine Learning scoring model (Isolation Forest algorithm).

**Phase 3 — Differentiation Features:**
•	What-If Simulation Mode.
•	Cost vs Time vs Risk Slider.
•	Historical Replay Mode.
•	Real Carrier API Integration (MarineTraffic API).
•	Multi-User Support.

**Phase 4 — Scale:**
•	Replace Socket.io with Apache Kafka.
•	Replace MongoDB with Neo4j Graph Database.

---

# 14. COMPETITIVE ANALYSIS
**Existing enterprise solutions:**
• Resilinc (Costs $500K-$5M/year)
• Kinaxis Maestro (Complex setup)
• SAP/Microsoft Control Towers (Requires existing infra)

**FlowSight Advantage:**
•	Built on open-source MERN stack — any developer can deploy it
•	Zero licensing cost — all free tier services
•	Demo-ready in 3 seconds
•	Explainable AI — risk formula is transparent
•	Target audience: 95% of logistics companies that cannot afford enterprise tools
