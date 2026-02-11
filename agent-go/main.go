package main

import (
	"encoding/json"
	"log"
	"net/url"
	"os"
	"os/signal"
	"runtime"
	"time"

	"agent-go/internal/collector"
	"agent-go/internal/models"

	"github.com/gorilla/websocket"
)

const (
	AgentVersion = "1.0.0"
	ServerHost   = "localhost:3000"
)

func main() {
	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt)

	u := url.URL{Scheme: "ws", Host: ServerHost, Path: "/ws"}
	log.Printf("Connecting to %s", u.String())

	// TLS Configuration (Skeleton for mTLS)
	// cert, err := tls.LoadX509KeyPair("client.crt", "client.key")
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
	// 	RootCAs:      caCertPool,
	// }
	// dialer := websocket.Dialer{TLSClientConfig: tlsConfig}

	// For dev without TLS
	dialer := websocket.DefaultDialer

	c, _, err := dialer.Dial(u.String(), nil)
	if err != nil {
		log.Fatal("dial:", err)
	}
	defer c.Close()

	done := make(chan struct{})

	// Handle Incoming Messages
	go func() {
		defer close(done)
		for {
			_, message, err := c.ReadMessage()
			if err != nil {
				log.Println("read:", err)
				return
			}
			log.Printf("recv: %s", message)
		}
	}()

	// Simulate Device ID
	deviceID := "dev-" + time.Now().Format("20060102150405")
	hostname, _ := os.Hostname()

	// Send Auth
	authPayload := models.AuthPayload{
		DeviceID:     deviceID,
		Token:        "secret-token",
		Hostname:     hostname,
		OS:           runtime.GOOS,
		AgentVersion: AgentVersion,
	}
	send(c, models.TypeAuth, authPayload)

	// Tickers
	heartbeatTicker := time.NewTicker(30 * time.Second)
	defer heartbeatTicker.Stop()

	telemetryTicker := time.NewTicker(10 * time.Second)
	defer telemetryTicker.Stop()

	for {
		select {
		case <-done:
			return
		case <-heartbeatTicker.C:
			// Send Heartbeat
			send(c, models.TypeHeartbeat, map[string]interface{}{"ts": time.Now().Unix()})

		case <-telemetryTicker.C:
			// Send Telemetry
			stats := collector.GetSystemStats()
			telemetry := models.TelemetryPayload{
				DeviceID: deviceID,
				CPU:      stats.CPUUsage,
				RAM:      stats.MemoryUsage,
				Disk:     stats.DiskUsage,
			}
			send(c, models.TypeTelemetry, telemetry)

		case <-interrupt:
			log.Println("interrupt")

			// Cleanly close the connection by sending a close message and then
			// waiting (with timeout) for the server to close the connection.
			err := c.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
			if err != nil {
				log.Println("write close:", err)
				return
			}
			select {
			case <-done:
			case <-time.After(time.Second):
			}
			return
		}
	}
}

func send(c *websocket.Conn, msgType string, payload interface{}) {
	msg := models.BaseMessage{
		Type:    msgType,
		Payload: payload,
	}
	bytes, _ := json.Marshal(msg)
	err := c.WriteMessage(websocket.TextMessage, bytes)
	if err != nil {
		log.Println("write:", err)
	}
}
