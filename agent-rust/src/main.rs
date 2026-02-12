use std::time::Duration;
use std::thread;
use std::sync::{Arc, Mutex};

use rumqttc::{MqttOptions, AsyncClient, QoS, Event, Packet};
use serde::{Serialize, Deserialize};
use sysinfo::{System, SystemExt, CpuExt};
use scrap::{Capturer, Display};
use tokio::task;
use tokio::time;
use uuid::Uuid;
use log::{info, error, debug};
use std::io::ErrorKind::WouldBlock;

// Constants
const MQTT_BROKER_HOST: &str = "localhost";
const MQTT_BROKER_PORT: u16 = 1883;
const TELEMETRY_INTERVAL: u64 = 5; // seconds
const SCREEN_FPS: u64 = 30;

// Data Structures

#[derive(Serialize, Deserialize, Debug)]
struct AgentSpecs {
    uuid: String,
    os_name: String,
    cpu_cores: usize,
    total_memory: u64, // MB
}

#[derive(Serialize, Deserialize, Debug)]
struct CpuTelemetry {
    value: f32,
    timestamp: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();
    info!("Starting Rust Agent...");

    // Generate Agent UUID (Persist this in production)
    let agent_uuid = Uuid::new_v4().to_string();
    info!("Agent UUID: {}", agent_uuid);

    // 1. Initialize System Info
    let mut sys = System::new_all();
    sys.refresh_all();

    // MQTT Setup
    let mut mqttoptions = MqttOptions::new(agent_uuid.clone(), MQTT_BROKER_HOST, MQTT_BROKER_PORT);
    mqttoptions.set_keep_alive(Duration::from_secs(5));

    let (client, mut eventloop) = AsyncClient::new(mqttoptions, 10);

    // 2. Publish "Online" + Specs
    let specs = AgentSpecs {
        uuid: agent_uuid.clone(),
        os_name: sys.name().unwrap_or("Unknown".to_string()),
        cpu_cores: sys.cpus().len(),
        total_memory: sys.total_memory() / 1024 / 1024, // Convert bytes to MB
    };

    let specs_payload = serde_json::to_string(&specs)?;

    // Publish specs (Topic: agent/{uuid}/specs)
    client.publish(format!("agent/{}/specs", agent_uuid), QoS::AtLeastOnce, false, specs_payload).await?;
    info!("Published Agent Specs");

    // 3. Telemetry Loop (CPU)
    let telemetry_client = client.clone();
    let telemetry_uuid = agent_uuid.clone();

    task::spawn(async move {
        let mut sys = System::new_all();
        let mut interval = time::interval(Duration::from_secs(TELEMETRY_INTERVAL));

        loop {
            interval.tick().await;
            sys.refresh_cpu(); // Refresh CPU usage

            // Calculate average CPU usage across all cores
            let cpus = sys.cpus();
            let avg_usage: f32 = cpus.iter().map(|c| c.cpu_usage()).sum::<f32>() / cpus.len() as f32;

            let telemetry = CpuTelemetry {
                value: avg_usage,
                timestamp: chrono::Utc::now().to_rfc3339(),
            };

            if let Ok(payload) = serde_json::to_string(&telemetry) {
                // Topic: sensors/{agent_uuid}_cpu/data  (Using agent uuid as part of sensor topic for now)
                // In production, sensors are separate entities, but here we treat agent CPU as a sensor.
                let topic = format!("sensors/{}_cpu/data", telemetry_uuid);

                if let Err(e) = telemetry_client.publish(topic, QoS::AtLeastOnce, false, payload).await {
                    error!("Failed to publish telemetry: {:?}", e);
                } else {
                    debug!("Published CPU telemetry: {:.2}%", avg_usage);
                }
            }
        }
    });

    // 4. Screen Capture Loop (30 FPS)
    // Running in a separate blocking thread because 'scrap' is blocking/OS-dependent
    thread::spawn(move || {
        capture_screen_loop();
    });

    // Event Loop for MQTT (Keep connection alive)
    while let Ok(notification) = eventloop.poll().await {
        // debug!("Received = {:?}", notification);
        match notification {
             Event::Incoming(Packet::ConnAck(_)) => {
                 info!("Connected to MQTT Broker");
             }
             _ => {}
        }
    }

    Ok(())
}

fn capture_screen_loop() {
    info!("Starting Screen Capture Loop at {} FPS...", SCREEN_FPS);

    // Setup Capturer
    // Note: 'scrap' might fail if no display is attached (headless server)
    let display = match Display::primary() {
        Ok(d) => d,
        Err(e) => {
            error!("No primary display found: {:?}", e);
            return;
        }
    };

    let mut capturer = match Capturer::new(display) {
        Ok(c) => c,
        Err(e) => {
            error!("Failed to initialize capturer: {:?}", e);
            return;
        }
    };

    let frame_duration = Duration::from_micros(1_000_000 / SCREEN_FPS);

    loop {
        let start = std::time::Instant::now();

        // Capture Frame
        match capturer.frame() {
            Ok(frame) => {
                // 'frame' is a raw buffer (BGRA or RGBA usually)
                // In a real WebRTC scenario, we would encode this (H.264/VP8) here.
                // For now, we just acknowledge we got the data.
                let len = frame.len();
                // debug!("Captured frame: {} bytes", len);
            }
            Err(error) => {
                if error.kind() == WouldBlock {
                    // Keep spinning.
                    thread::sleep(Duration::from_millis(1));
                    continue;
                } else {
                    error!("Capture error: {}", error);
                    thread::sleep(Duration::from_secs(1)); // Backoff
                    // Re-initialize capturer could be needed here
                }
            }
        }

        // Maintain FPS
        let elapsed = start.elapsed();
        if elapsed < frame_duration {
            thread::sleep(frame_duration - elapsed);
        }
    }
}
