import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Aedes from 'aedes';
import * as net from 'net';
import { PrismaService } from '../prisma/prisma.service';
import { DeviceStatus } from '@prisma/client';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private aedes: Aedes;
  private server: net.Server;
  private readonly MQTT_PORT = 1883;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.startBroker();
  }

  onModuleDestroy() {
    if (this.server) {
        this.server.close(() => {
        this.logger.log('MQTT Broker stopped.');
        });
    }
    if (this.aedes) {
        this.aedes.close();
    }
  }

  private startBroker() {
    try {
      this.aedes = new Aedes();
      this.server = net.createServer(this.aedes.handle);

      this.server.listen(this.MQTT_PORT, () => {
        this.logger.log(`MQTT Broker started on port ${this.MQTT_PORT}`);
      });

      this.handleClientEvents();
      this.handlePublishEvents();

    } catch (error) {
      this.logger.error('Failed to start MQTT Broker', error);
    }
  }

  private handleClientEvents() {
    this.aedes.on('clientReady', async (client: any) => {
      try {
        this.logger.log(`Client connected: ${client.id}`);

        // Update DeviceAgent status to ONLINE if client.id matches UUID
        await this.prisma.deviceAgent.updateMany({
          where: { uuid: client.id },
          data: {
            status: DeviceStatus.ONLINE,
            lastSeen: new Date()
          }
        });

      } catch (error) {
        this.logger.error(`Error handling client connection: ${client.id}`, error);
      }
    });

    this.aedes.on('clientDisconnect', async (client: any) => {
        if (!client) return;
      try {
        this.logger.log(`Client disconnected: ${client.id}`);

         // Update DeviceAgent status to OFFLINE
         await this.prisma.deviceAgent.updateMany({
          where: { uuid: client.id },
          data: {
            status: DeviceStatus.OFFLINE,
            lastSeen: new Date()
          }
        });
      } catch (error) {
        this.logger.error(`Error handling client disconnection: ${client.id}`, error);
      }
    });
  }

  private handlePublishEvents() {
    this.aedes.on('publish', async (packet: any, client: any) => {
      if (!client) return; // Ignore internal messages (e.g. $SYS)

      try {
        const topic = packet.topic;
        const payload = packet.payload.toString();

        // this.logger.debug(`Message received on ${topic}: ${payload}`);

        // Telemetry Data Format: topic = "sensors/{sensor_uuid}/data"
        if (topic.startsWith('sensors/') && topic.endsWith('/data')) {
            const parts = topic.split('/');
            if (parts.length >= 2) {
                await this.processTelemetry(parts[1], payload);
            }
        }
        // Inventory Weight Update: topic = "inventory/update/weight"
        else if (topic === 'inventory/update/weight') {
            const data = JSON.parse(payload);
            if (data.sensor_id) {
                // Treat sensor_id as the MQTT topic ID for lookup
                await this.processTelemetry(data.sensor_id, payload);
            }
        }

      } catch (error) {
        this.logger.error('Error processing published message', error);
      }
    });
  }

  private async processTelemetry(mqttTopicId: string, payloadStr: string) {
    try {
      const data = JSON.parse(payloadStr);
      // Expected payload: { "value": 24.5, "timestamp": "2023-10-27T10:00:00Z" }

      if (!data.value) return;

      // Find sensor by MQTT Topic
      const sensor = await this.prisma.ioT_Sensor.findUnique({
        where: { mqttTopic: mqttTopicId }
      });

      if (!sensor) {
        this.logger.warn(`Sensor not found for topic: ${mqttTopicId}`);
        return;
      }

      // Save to TelemetryData (TimescaleDB)
      await this.prisma.telemetryData.create({
        data: {
          sensorId: sensor.id,
          value: parseFloat(data.value),
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        }
      });

      this.logger.verbose(`Telemetry saved for sensor ${sensor.id}`);

    } catch (error) {
      this.logger.error(`Failed to parse/save telemetry for topic ${mqttTopicId}`, error);
    }
  }
}
