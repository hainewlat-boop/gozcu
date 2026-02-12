package hub

import (
	"encoding/json"
	"log"
	"time"

	"backend-go/internal/models"

	"github.com/gofiber/contrib/websocket"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 512
)

// DeviceClient is a middleman between the websocket connection and the hub.
type DeviceClient struct {
	Hub *Hub

	// The websocket connection.
	Conn *websocket.Conn

	// Buffered channel of outbound messages.
	Send chan []byte

	// DeviceID associated with this connection
	DeviceID string
}

// readPump pumps messages from the websocket connection to the hub.
// The application runs readPump in a per-connection goroutine. The application
// ensures that there is at most one reader on a connection by executing all
// reads from this goroutine.
func (c *DeviceClient) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error { c.Conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })

	for {
		messageType, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		if messageType == websocket.TextMessage {
			var baseMsg models.BaseMessage
			if err := json.Unmarshal(message, &baseMsg); err != nil {
				log.Printf("Invalid JSON: %v", err)
				continue
			}

			switch baseMsg.Type {
			case models.TypeAuth:
				// Handle Auth
				var authPayload models.AuthPayload
				payloadBytes, _ := json.Marshal(baseMsg.Payload)
				json.Unmarshal(payloadBytes, &authPayload)

				// Update Client ID and Register
				c.DeviceID = authPayload.DeviceID
				c.Hub.Register <- c
				log.Printf("Authenticated device: %s (%s)", c.DeviceID, authPayload.Hostname)

				// Send Ack via channel
				ackMsg := models.BaseMessage{
					Type:    "auth_ack",
					Payload: "Authenticated",
				}
				ackBytes, _ := json.Marshal(ackMsg)
				c.Send <- ackBytes

			case models.TypeHeartbeat:
				// Send Ack via channel
				ackMsg := models.BaseMessage{
					Type:    "heartbeat_ack",
					Payload: time.Now().Unix(),
				}
				ackBytes, _ := json.Marshal(ackMsg)
				c.Send <- ackBytes

			case models.TypeTelemetry:
				// Process Telemetry
				// log.Printf("Telemetry from %s", c.DeviceID)

			case models.TypeScreenThumbnail:
				// Handle Screen Data
			}
		}
	}
}

// writePump pumps messages from the hub to the websocket connection.
// A goroutine running writePump is started for each connection. The
// application ensures that there is at most one writer to a connection by
// executing all writes from this goroutine.
func (c *DeviceClient) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The hub closed the channel.
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued chat messages to the current websocket message.
			n := len(c.Send)
			for i := 0; i < n; i++ {
				w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
