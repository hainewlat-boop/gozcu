package models

// WebSocket Message Types
const (
	TypeAuth            = "auth"
	TypeHeartbeat       = "heartbeat"
	TypeCommand         = "command"
	TypeTelemetry       = "telemetry"
	TypeScreenThumbnail = "screen_thumbnail"
)

// BaseMessage structure for all WebSocket communication
type BaseMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

// AuthPayload
type AuthPayload struct {
	DeviceID     string `json:"device_id"`
	Token        string `json:"token"`
	Hostname     string `json:"hostname"`
	OS           string `json:"os"`
	AgentVersion string `json:"agent_version"`
}

// TelemetryPayload
type TelemetryPayload struct {
	DeviceID string  `json:"device_id"`
	CPU      float64 `json:"cpu"`
	RAM      float64 `json:"ram"`
	Disk     float64 `json:"disk"`
}
