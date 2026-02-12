package hub

import (
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/gofiber/contrib/websocket"
)

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	// Registered clients map[DeviceID]*DeviceClient
	Clients    map[string]*DeviceClient
	ClientsMux sync.RWMutex

	// Inbound messages from the clients
	Broadcast chan []byte

	// Register requests from the clients
	Register chan *DeviceClient

	// Unregister requests from clients
	Unregister chan *DeviceClient
}

func NewHub() *Hub {
	return &Hub{
		Broadcast:  make(chan []byte),
		Register:   make(chan *DeviceClient),
		Unregister: make(chan *DeviceClient),
		Clients:    make(map[string]*DeviceClient),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.ClientsMux.Lock()
			h.Clients[client.DeviceID] = client
			h.ClientsMux.Unlock()
			log.Printf("Device registered: %s", client.DeviceID)

		case client := <-h.Unregister:
			h.ClientsMux.Lock()
			if _, ok := h.Clients[client.DeviceID]; ok {
				delete(h.Clients, client.DeviceID)
				close(client.Send)
				log.Printf("Device unregistered: %s", client.DeviceID)
			}
			h.ClientsMux.Unlock()

		case message := <-h.Broadcast:
			h.ClientsMux.RLock()
			for _, client := range h.Clients {
				select {
				case client.Send <- message:
				default:
					// Channel is full, assume client is dead or slow.
					// We can't delete here because we hold RLock.
					// We rely on the writePump to detect error and trigger unregister.
				}
			}
			h.ClientsMux.RUnlock()
		}
	}
}

// HandleWebSocket manages the websocket connection lifecycle
func (h *Hub) HandleWebSocket(c *websocket.Conn) {
	// Create a temporary ID
	tempID := fmt.Sprintf("temp-%d", time.Now().UnixNano())

	client := &DeviceClient{
		Hub:      h,
		Conn:     c,
		Send:     make(chan []byte, 256),
		DeviceID: tempID,
	}

	// Start write pump in a goroutine
	go client.WritePump()

	// Start read pump (blocking)
	client.ReadPump()
}
