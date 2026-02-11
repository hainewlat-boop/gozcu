import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [MqttService, PrismaService],
  exports: [MqttService],
})
export class IoTCoreModule {}
