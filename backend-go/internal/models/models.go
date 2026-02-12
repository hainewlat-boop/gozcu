package models

// WebSocket Message Types
const (
	TypeAuth            = "auth"
	TypeHeartbeat       = "heartbeat"
	TypeCommand         = "command"
	TypeTelemetry       = "telemetry"
	TypeScreenThumbnail = "screen_thumbnail"
	TypeDeviceUpdate    = "device_update"
)

// BaseMessage structure for all WebSocket communication
type BaseMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

// Device represents a connected agent
type Device struct {
	ID           string   `json:"id"`
	Hostname     string   `json:"hostname"`
	IPAddress    string   `json:"ip_address"`
	OS           string   `json:"os"`
	Status       string   `json:"status"` // online, offline
	LastSeen     string   `json:"last_seen"`
	AgentVersion string   `json:"agent_version"`
	Tags         []string `json:"tags"`
}

// TelemetryPayload
type TelemetryPayload struct {
	DeviceID string  `json:"device_id"`
	CPU      float64 `json:"cpu"`
	RAM      float64 `json:"ram"`
	Disk     float64 `json:"disk"`
}

// AuthPayload
type AuthPayload struct {
	DeviceID     string `json:"device_id"`
	Token        string `json:"token"`
	Hostname     string `json:"hostname"`
	OS           string `json:"os"`
	AgentVersion string `json:"agent_version"`
}

// CommandPayload
type CommandPayload struct {
	CommandID string   `json:"command_id"`
	Command   string   `json:"command"`
	Args      []string `json:"args"`
}
