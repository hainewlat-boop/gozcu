# Development Guide - Remote Operations Platform

This guide covers the setup and development workflow for the Remote Operations Platform (ROP).

## Project Structure

- `backend-go/`: The central server (Golang + Fiber).
- `agent-go/`: The client software running on devices (Golang).
- `REMOTE_OPS_DESIGN.md`: Architectural design document.
- `REMOTE_OPS_SPECS.json`: API and Protocol specifications.

## Prerequisites

- Go 1.21+
- Node.js 18+ (for UI)
- Docker (optional, for database)

## Running the Backend

The backend server manages WebSocket connections and exposes the REST API.

1. Navigate to the backend directory:
   ```bash
   cd backend-go
   ```

2. Run the server:
   ```bash
   go run main.go
   ```

   The server will start on `http://localhost:3000`.
   - WebSocket: `ws://localhost:3000/ws`
   - API: `http://localhost:3000/api/v1/devices`

## Running the Agent

The agent simulates a device connecting to the platform.

1. Open a new terminal.
2. Navigate to the agent directory:
   ```bash
   cd agent-go
   ```

3. Run the agent:
   ```bash
   go run main.go
   ```

   You should see logs indicating a successful WebSocket connection and periodic heartbeat/telemetry transmission.

## Development Recommendations

### 1. Code Quality & Linting
- Use **golangci-lint** for static analysis.
  ```bash
  golangci-lint run
  ```
- Follow the **Standard Go Project Layout**.

### 2. Hot Reload
- Use **Air** for live reloading during backend development.
  ```bash
  # Install Air
  go install github.com/cosmtrek/air@latest
  # Run
  air
  ```

### 3. Testing
- Use **testify** for assertions.
  ```go
  import "github.com/stretchr/testify/assert"
  ```
- Write table-driven tests for logic components (e.g., Command parsing).

### 4. Database Integration
- The current implementation uses in-memory storage.
- For production, integrate **PostgreSQL** with **pgx** driver.
- Use **golang-migrate** for schema migrations.

### 5. Security (Zero Trust)
- Implement **mTLS** using `crypto/tls`.
- Generate client certificates for each agent during enrollment.
- Validate `CommonName` or `SAN` against the device inventory.

### 6. WebRTC Streaming (Next Steps)
- Integrate **Pion WebRTC** (`github.com/pion/webrtc/v3`) for screen streaming.
- The agent will act as a WebRTC peer.
- The backend will act as a Signaling Server (exchanging SDP via WebSocket).

### 7. Frontend Integration
- The existing `vite-react-typescript-starter` can be adapted.
- Use `useEffect` to establish a WebSocket connection to the backend.
- Use `recharts` for visualizing telemetry data.

## CI/CD Pipeline Suggestion

1. **Lint & Test**: Run on every push.
2. **Build**:
   - `backend`: Build Docker image.
   - `agent`: Cross-compile for Windows (`GOOS=windows`) and Linux (`GOOS=linux`).
3. **Release**: Push binaries to a secure artifact storage (e.g., MinIO within the VLAN).

## Troubleshooting

- **Connection Refused**: Ensure the backend is running before the agent.
- **WebSocket Errors**: Check firewall rules if running on different machines.
