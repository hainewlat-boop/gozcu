import { Module } from '@nestjs/common';
import { IoTCoreModule } from './iot/iot.module';
import { SignalingGateway } from './signaling/signaling.gateway';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [IoTCoreModule],
  providers: [SignalingGateway, PrismaService],
})
export class AppModule {}
