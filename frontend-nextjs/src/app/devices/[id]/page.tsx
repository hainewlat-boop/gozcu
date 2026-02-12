'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '../../../hooks/useSocket';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Monitor, Cpu, Server, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface TelemetryPoint {
  time: string;
  value: number;
}

interface DeviceProps {
  params: {
    id: string; // Device UUID
  };
}

export default function DeviceDetailsPage({ params }: DeviceProps) {
  const { id: deviceId } = params;
  const socket = useSocket();
  const [isConnected, setIsConnected] = useState(false);
  const [telemetryData, setTelemetryData] = useState<TelemetryPoint[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // WebRTC Refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Mock Device Data
  const device = {
    name: 'KIOSK-042',
    ip: '192.168.10.42',
    status: 'online',
    serial: 'SN-99887766',
    user: 'John Doe (IT)',
    warranty: '2025-12-31',
  };

  // Join Room on Socket Connect
  useEffect(() => {
    if (!socket) return;

    socket.emit('join_room', { agentUuid: deviceId });

    socket.on('room_joined', (data) => {
      console.log('Joined room:', data.room);
      setIsConnected(true);
    });

    // Listen for WebRTC Signaling
    socket.on('offer', async (data) => {
      console.log('Received Offer from Agent:', data.sender);
      await handleOffer(data.sdp, data.sender);
    });

    socket.on('ice-candidate', async (data) => {
       if (peerConnectionRef.current) {
         try {
           await peerConnectionRef.current.addIceCandidate(data.candidate);
         } catch (e) {
           console.error('Error adding received ice candidate', e);
         }
       }
    });

    // Mock Telemetry Listener (In real app, listen to 'telemetry_update' event)
    const interval = setInterval(() => {
      // Simulate incoming data via socket
      const newVal = Math.random() * 20 + 40; // 40-60 range
      const timestamp = new Date().toLocaleTimeString();

      setTelemetryData(prev => {
        const newData = [...prev, { time: timestamp, value: newVal }];
        if (newData.length > 20) newData.shift(); // Keep last 20 points
        return newData;
      });
    }, 2000);

    return () => {
      socket.off('room_joined');
      socket.off('offer');
      socket.off('ice-candidate');
      clearInterval(interval);
    };
  }, [socket, deviceId]);

  // WebRTC Logic
  const startStream = async () => {
    if (!socket) return;
    setIsStreaming(true);

    // In a Viewer-Initiated scenario, we might send a "request_stream" command first.
    // Or we can create an Offer (Viewer -> Agent). Let's assume Viewer Offers.

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          target: deviceId,
          candidate: event.candidate,
          type: 'candidate'
        });
      }
    };

    pc.ontrack = (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
      }
    };

    // Add Transceiver to receive video
    pc.addTransceiver('video', { direction: 'recvonly' });

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('offer', {
        target: deviceId,
        sdp: offer,
        type: 'offer'
      });
      console.log('Sent Offer to Agent');
    } catch (err) {
      console.error('Error creating offer:', err);
      setIsStreaming(false);
    }
  };

  const handleOffer = async (sdp: RTCSessionDescriptionInit, senderId: string) => {
      // If agent sends offer (Agent-Initiated)
      // Implementation depends on direction. For now assuming Viewer initiates or Agent initiates.
      // This function is just a placeholder for the reverse direction logic.
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      {/* HEADER */}
      <header className="bg-white p-4 rounded-lg shadow-sm mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Monitor className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{device.name}</h1>
            <p className="text-sm text-gray-500 font-mono">{device.ip}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${device.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {device.status === 'online' ? <Wifi className="w-4 h-4"/> : <WifiOff className="w-4 h-4"/>}
                {device.status.toUpperCase()}
            </div>
            <div className="text-xs text-gray-400">
                Last Seen: Just now
            </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6 h-[600px]">
        {/* LEFT PANEL: INVENTORY */}
        <div className="col-span-3 bg-white p-6 rounded-lg shadow-sm h-full flex flex-col gap-6">
            <h2 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                <Server className="w-5 h-5"/> Inventory Info
            </h2>
            <div className="space-y-4 text-sm">
                <div>
                    <label className="block text-gray-500">Serial Number</label>
                    <div className="font-mono bg-gray-50 p-2 rounded">{device.serial}</div>
                </div>
                <div>
                    <label className="block text-gray-500">Assigned User</label>
                    <div className="font-medium">{device.user}</div>
                </div>
                <div>
                    <label className="block text-gray-500">Warranty End</label>
                    <div className="font-medium text-orange-600">{device.warranty}</div>
                </div>
                <div>
                    <label className="block text-gray-500">Agent Version</label>
                    <div className="font-mono">v1.2.4 (Rust)</div>
                </div>
            </div>
        </div>

        {/* MIDDLE PANEL: REMOTE DESKTOP */}
        <div className="col-span-6 bg-black rounded-lg shadow-sm overflow-hidden relative flex flex-col">
            <div className="absolute top-4 left-4 z-10 bg-black/50 text-white px-2 py-1 rounded text-xs">
                Remote Desktop {isStreaming ? '(LIVE)' : '(OFFLINE)'}
            </div>

            <div className="flex-1 flex items-center justify-center bg-gray-900">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                />
                {!isStreaming && (
                    <div className="absolute flex flex-col items-center gap-4">
                        <Monitor className="w-16 h-16 text-gray-600" />
                        <button
                            onClick={startStream}
                            disabled={!isConnected}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isConnected ? 'BAĞLAN (Connect)' : 'Connecting to Signaling...'}
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* RIGHT PANEL: TELEMETRY */}
        <div className="col-span-3 bg-white p-6 rounded-lg shadow-sm h-full flex flex-col">
             <h2 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5"/> Live Metrics
            </h2>

            <div className="flex-1 min-h-0">
                <h3 className="text-sm text-gray-500 mb-2">CPU Temperature (°C)</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={telemetryData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                            <XAxis dataKey="time" hide />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#ef4444"
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-6">
                    <h3 className="text-sm text-gray-500 mb-2">Shelf Weight (kg)</h3>
                    <div className="text-3xl font-bold text-gray-800 font-mono">
                        45.5 <span className="text-lg font-normal text-gray-500">kg</span>
                    </div>
                </div>
            </div>

            <div className="mt-auto pt-4 border-t text-xs text-gray-400 flex justify-between">
                <span>Updated: Just now</span>
                <RefreshCw className="w-3 h-3 animate-spin"/>
            </div>
        </div>
      </div>
    </div>
  );
}
