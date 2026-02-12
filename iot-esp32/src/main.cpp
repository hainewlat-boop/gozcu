#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <HX711.h>

// --- Configuration ---
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Backend MQTT Broker (IP Address)
#define MQTT_SERVER "192.168.1.100" // Replace with actual backend IP
#define MQTT_PORT 1883
#define MQTT_CLIENT_ID "ESP32_LoadCell_01"

// MQTT Topics
#define TOPIC_WEIGHT_UPDATE "inventory/update/weight"

// HX711 Pinout
#define LOADCELL_DOUT_PIN 21
#define LOADCELL_SCK_PIN  22

// Simulation Mode (Set to false for real hardware)
#define SIMULATION_MODE true

// Global Objects
WiFiClient espClient;
PubSubClient client(espClient);
HX711 scale;

// Variables
long lastMsg = 0;
float calibration_factor = -7050.0; // Simulated factor

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");

    // Attempt to connect
    if (client.connect(MQTT_CLIENT_ID)) {
      Serial.println("connected");

      // Publish "Online" status
      client.publish("inventory/status", "{\"sensor_id\": \"" MQTT_CLIENT_ID "\", \"status\": \"online\"}");

    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);

  setup_wifi();
  client.setServer(MQTT_SERVER, MQTT_PORT);

  if (!SIMULATION_MODE) {
    Serial.println("Initializing HX711...");
    scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
    scale.set_scale(calibration_factor);
    scale.tare(); // Reset the scale to 0
  } else {
    Serial.println("Starting in SIMULATION MODE");
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  long now = millis();

  // Publish every 2 seconds
  if (now - lastMsg > 2000) {
    lastMsg = now;

    float weight = 0.0;

    if (SIMULATION_MODE) {
      // Simulate weight fluctuation around 45.5 kg
      // Random float between -0.5 and +0.5
      float noise = ((float)random(-50, 50)) / 100.0;
      weight = 45.5 + noise;
    } else {
      if (scale.is_ready()) {
        weight = scale.get_units(10); // Average of 10 readings
      } else {
        Serial.println("HX711 not found.");
      }
    }

    // Prepare JSON Payload
    // { "sensor_id": "esp32_01", "weight": 45.5, "unit": "kg" }
    StaticJsonDocument<200> doc;
    doc["sensor_id"] = MQTT_CLIENT_ID;
    doc["weight"] = weight;
    doc["unit"] = "kg";
    doc["timestamp"] = millis(); // Simple uptime timestamp

    char buffer[256];
    serializeJson(doc, buffer);

    Serial.print("Publishing: ");
    Serial.println(buffer);

    client.publish(TOPIC_WEIGHT_UPDATE, buffer);
  }
}
