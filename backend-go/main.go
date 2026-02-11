package main

import (
	"log"

	"backend-go/internal/hub"
	"backend-go/internal/models"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
)

func main() {
	app := fiber.New()

	// Initialize Hub
	wsHub := hub.NewHub()
	go wsHub.Run()

	// Middleware to upgrade connection to WebSocket
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	// WebSocket Endpoint
	app.Get("/ws", websocket.New(func(c *websocket.Conn) {
		// Handle connection
		log.Println("New WebSocket connection attempt")
		wsHub.HandleWebSocket(c)
	}))

	// API Routes
	api := app.Group("/api/v1")

	// List Connected Devices
	api.Get("/devices", func(c *fiber.Ctx) error {
		var deviceList []models.Device

		// In a real app, query database. Here, query in-memory hub.
		wsHub.ClientsMux.RLock()
		defer wsHub.ClientsMux.RUnlock()

		for id, client := range wsHub.Clients {
			// Mock device info based on connection
			deviceList = append(deviceList, models.Device{
				ID:       id,
				Status:   "online",
				Hostname: client.DeviceID, // Simplified
			})
		}

		return c.JSON(deviceList)
	})

	// Health Check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	// TLS Configuration (Skeleton for mTLS)
	// cert, err := tls.LoadX509KeyPair("server.crt", "server.key")
	// if err != nil {
	// 	log.Fatal(err)
	// }
	// caCert, err := os.ReadFile("ca.crt")
	// if err != nil {
	// 	log.Fatal(err)
	// }
	// caCertPool := x509.NewCertPool()
	// caCertPool.AppendCertsFromPEM(caCert)
	//
	// tlsConfig := &tls.Config{
	// 	Certificates: []tls.Certificate{cert},
	// 	ClientCAs:    caCertPool,
	// 	ClientAuth:   tls.RequireAndVerifyClientCert,
	// }
	//
	// listener, err := tls.Listen("tcp", ":3443", tlsConfig)
	// if err != nil {
	// 	log.Fatal(err)
	// }
	// app.Listener(listener)

	log.Println("Server starting on :3000 (HTTP)")
	log.Fatal(app.Listen(":3000"))
}
