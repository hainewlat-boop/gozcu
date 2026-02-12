# Development Guide - Remote Operations Platform

This guide covers the setup and development workflow for the Remote Operations Platform (ROP).

## Project Structure

- `backend-go/`: MVP Backend (Golang + Fiber + WebSocket).
- `agent-go/`: MVP Agent (Golang).
- `backend-nestjs/`: Production Backend (NestJS + Prisma + MQTT + Socket.io).
- `agent-rust/`: Production Agent (Rust + MQTT + Screen Capture).
- `iot-esp32/`: IoT Firmware (C++ / Arduino).
- `REMOTE_OPS_DESIGN.md`: Architectural design document.
- `REMOTE_OPS_SPECS.json`: API and Protocol specifications.

## Stack Selection

- **MVP (Prototype):** Use `backend-go` and `agent-go` for a quick WebSocket-based test.
- **Production (Phase 1-4):** Use `backend-nestjs`, `agent-rust`, and `iot-esp32`.

---

## 1. Running the Production Backend (NestJS)

The NestJS backend provides the MQTT Broker (Port 1883) and Signaling Gateway (Socket.io).

### Prerequisites
- Node.js 18+
- PostgreSQL (TimeScaleDB enabled recommended)
- Redis (Optional for scaling)

### Setup
1. Navigate to the directory:
   ```bash
   cd backend-nestjs
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment:
   Create a `.env` file with your database connection string:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/remote_ops_db?schema=public"
   ```

4. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

5. Run Migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

6. Start the Server:
   ```bash
   npm run start:dev
   ```

   - API/Socket.io: `http://localhost:3000`
   - MQTT Broker: `tcp://localhost:1883`

---

## 2. Running the Production Agent (Rust)

The Rust agent connects to the NestJS backend via MQTT to send telemetry and screen capture data.

### Prerequisites
- Rust (Cargo)
- System libraries for screen capture (e.g., `libxcb`, `libx11` on Linux)

### Setup
1. Navigate to the directory:
   ```bash
   cd agent-rust
   ```

2. Run the Agent:
   ```bash
   cargo run
   ```

   The agent will:
   - Connect to MQTT `localhost:1883`.
   - Publish specs to `agent/{uuid}/specs`.
   - Publish CPU usage every 5s to `sensors/{uuid}_cpu/data`.
   - Start a screen capture loop (logs only for now).

---

## 3. Running the IoT Firmware (ESP32)

### Prerequisites
- PlatformIO (VSCode Extension or CLI)

### Setup
1. Navigate to `iot-esp32`.
2. Update `src/main.cpp`:
   - Set `WIFI_SSID` and `WIFI_PASSWORD`.
   - Set `MQTT_SERVER` to your backend IP.
3. Build and Upload:
   ```bash
   pio run -t upload
   ```
4. Monitor Serial Output:
   ```bash
   pio device monitor
   ```

---

## 4. Running the MVP (Go Stack) - Legacy/Alternative

If you prefer the simpler Go stack:

1. **Backend:**
   ```bash
   cd backend-go
   go run main.go
   ```

2. **Agent:**
   ```bash
   cd agent-go
   go run main.go
   ```

## Troubleshooting

- **Rust Compilation Errors:** Ensure you have `pkg-config` and X11 development headers installed on Linux (`sudo apt install libxcb-shape0-dev libxcb-xfixes0-dev`).
- **MQTT Connection Refused:** Ensure the NestJS backend is running and port 1883 is open.
- **Database Errors:** Check `DATABASE_URL` in `backend-nestjs/.env`.
