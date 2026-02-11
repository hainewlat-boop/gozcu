import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

interface RoomJoinPayload {
  agentUuid: string;
}

interface SignalPayload {
  target: string; // The UUID or Socket ID of the target
  sdp?: any;
  candidate?: any;
  type: 'offer' | 'answer' | 'candidate';
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/signaling',
})
export class SignalingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(SignalingGateway.name);

  @WebSocketServer()
  server: Server;

  // Map to track which agent is in which room (simplified)
  // In production, use Redis adapter for scaling
  private agentSocketMap = new Map<string, string>(); // agentUuid -> socketId

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Cleanup agent mapping if an agent disconnects
    // Loop map to find key by value (inefficient, but okay for prototype)
    for (const [uuid, socketId] of this.agentSocketMap.entries()) {
      if (socketId === client.id) {
        this.agentSocketMap.delete(uuid);
        break;
      }
    }
  }

  /**
   * Agents or Viewers join a room identified by the Agent's UUID.
   * - Agent joins 'agent:{uuid}'
   * - Viewer joins 'agent:{uuid}' to talk to that agent
   */
  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() payload: RoomJoinPayload,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const roomName = `agent:${payload.agentUuid}`;
      client.join(roomName);

      this.logger.log(`Client ${client.id} joined room ${roomName}`);
      client.emit('room_joined', { room: roomName });

      // Notify others in room
      client.to(roomName).emit('user_joined', { id: client.id });

    } catch (error: any) {
      this.logger.error(`Error joining room: ${error.message}`, error);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @MessageBody() payload: RoomJoinPayload,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const roomName = `agent:${payload.agentUuid}`;
      client.leave(roomName);
      this.logger.log(`Client ${client.id} left room ${roomName}`);
      client.to(roomName).emit('user_left', { id: client.id });
    } catch (error: any) {
      this.logger.error(`Error leaving room: ${error.message}`, error);
    }
  }

  /**
   * WebRTC Offer
   */
  @SubscribeMessage('offer')
  handleOffer(
    @MessageBody() payload: SignalPayload,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.logger.debug(`Relaying OFFER from ${client.id} to room agent:${payload.target}`);
      // Broadcast to the specific room (excluding sender)
      // If payload.target is the Agent UUID
      client.to(`agent:${payload.target}`).emit('offer', {
        sdp: payload.sdp,
        sender: client.id,
      });
    } catch (error: any) {
      this.logger.error(`Error relaying offer: ${error.message}`, error);
    }
  }

  /**
   * WebRTC Answer
   */
  @SubscribeMessage('answer')
  handleAnswer(
    @MessageBody() payload: SignalPayload,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.logger.debug(`Relaying ANSWER from ${client.id} to ${payload.target}`);
      // Payload target should be the specific Socket ID of the caller (Viewer)
      this.server.to(payload.target).emit('answer', {
        sdp: payload.sdp,
        sender: client.id,
      });
    } catch (error: any) {
      this.logger.error(`Error relaying answer: ${error.message}`, error);
    }
  }

  /**
   * WebRTC ICE Candidate
   */
  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @MessageBody() payload: SignalPayload,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.logger.debug(`Relaying ICE CANDIDATE from ${client.id} to ${payload.target}`);

      // Simple heuristic: if target looks like a UUID (long), it's a room.
      // If it looks like a socket ID (short, ~20 chars), it's a specific client.
      // Or relying on context. Here, we assume payload.target is UUID if offering to agent,
      // and SocketID if answering to viewer.

      // But for candidate exchange, we need to know who we are talking to.
      // Let's rely on room broadcast for Agent target, and direct message for Viewer target.

      const isSocketId = payload.target.length < 30; // socket.io ids are usually 20 chars

      if (isSocketId) {
           // Assume it's a Socket ID (Viewer)
           this.server.to(payload.target).emit('ice-candidate', {
            candidate: payload.candidate,
            sender: client.id,
          });
      } else {
          // Assume it's an Agent UUID, send to room
          client.to(`agent:${payload.target}`).emit('ice-candidate', {
            candidate: payload.candidate,
            sender: client.id,
          });
      }

    } catch (error: any) {
      this.logger.error(`Error relaying ICE candidate: ${error.message}`, error);
    }
  }
}
