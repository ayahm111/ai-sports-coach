"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CameraOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { PoseData } from "@/lib/types";

interface WebcamFeedProps {
  onPoseDetected: (pose: PoseData) => void;
  isActive: boolean;
}

export default function WebcamFeed({ onPoseDetected, isActive }: WebcamFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState("");
  const [useMockData, setUseMockData] = useState(false);

  const generateMockPose = useCallback((): PoseData => {
    const time = Date.now() / 1000;
    return {
      landmarks: [
        { x: 0.5, y: 0.1, z: 0, visibility: 1, name: "nose" },
        { x: 0.45 + Math.sin(time) * 0.02, y: 0.3, z: 0, visibility: 1, name: "left_shoulder" },
        { x: 0.55 - Math.sin(time) * 0.02, y: 0.3, z: 0, visibility: 1, name: "right_shoulder" },
        { x: 0.4 + Math.sin(time * 1.5) * 0.05, y: 0.5, z: 0, visibility: 1, name: "left_elbow" },
        { x: 0.6 - Math.sin(time * 1.5) * 0.05, y: 0.5, z: 0, visibility: 1, name: "right_elbow" },
        { x: 0.35 + Math.sin(time * 2) * 0.08, y: 0.7, z: 0, visibility: 1, name: "left_wrist" },
        { x: 0.65 - Math.sin(time * 2) * 0.08, y: 0.7, z: 0, visibility: 1, name: "right_wrist" },
        { x: 0.45, y: 0.6, z: 0, visibility: 1, name: "left_hip" },
        { x: 0.55, y: 0.6, z: 0, visibility: 1, name: "right_hip" },
        { x: 0.45, y: 0.8 + Math.sin(time * 0.8) * 0.03, z: 0, visibility: 1, name: "left_knee" },
        { x: 0.55, y: 0.8 + Math.sin(time * 0.8) * 0.03, z: 0, visibility: 1, name: "right_knee" },
        { x: 0.45, y: 1.0, z: 0, visibility: 1, name: "left_ankle" },
        { x: 0.55, y: 1.0, z: 0, visibility: 1, name: "right_ankle" },
      ],
      timestamp: Date.now(),
    };
  }, []);

  const drawPose = useCallback((landmarks: any[]) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw pose connections
    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 2;
    const connections = [
      [0, 1], [0, 2], [1, 3], [3, 5], [2, 4], [4, 6],
      [1, 2], [1, 7], [2, 8], [7, 8], [7, 9], [9, 11], [8, 10], [10, 12]
    ];

    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];
      if (startPoint && endPoint && startPoint.visibility > 0.5 && endPoint.visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x * canvasRef.current!.width, startPoint.y * canvasRef.current!.height);
        ctx.lineTo(endPoint.x * canvasRef.current!.width, endPoint.y * canvasRef.current!.height);
        ctx.stroke();
      }
    });

    // Draw landmarks
    ctx.fillStyle = "#FF0000";
    landmarks.forEach((landmark) => {
      if (landmark.visibility > 0.5) {
        ctx.beginPath();
        ctx.arc(
          landmark.x * canvasRef.current!.width,
          landmark.y * canvasRef.current!.height,
          4, 0, 2 * Math.PI
        );
        ctx.fill();
      }
    });
  }, []);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError("");
      setUseMockData(false); // Reset mock data when trying to start camera

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          videoRef.current!.onloadedmetadata = resolve;
        });

        if (canvasRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
        }

        setHasPermission(true);
        startPoseDetection();
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      setError(
        err.name === "NotAllowedError" ? "Camera access denied. Please allow permissions." :
        err.name === "NotFoundError" ? "No camera found." :
        `Camera error: ${err.message || "Unknown error"}`
      );
      setUseMockData(true); // Fall back to mock data
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setHasPermission(false);
  }, []);

  const startPoseDetection = useCallback(() => {
    const detectPose = () => {
      if (useMockData) {
        const mockPose = generateMockPose();
        onPoseDetected(mockPose);
        drawPose(mockPose.landmarks);
      } else if (hasPermission && videoRef.current) {
        // Here you would normally call your pose detection library
        // For now we'll just draw the video frame
        if (canvasRef.current && videoRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.drawImage(
              videoRef.current,
              0, 0,
              canvasRef.current.width,
              canvasRef.current.height
            );
          }
        }
      }
      animationRef.current = requestAnimationFrame(detectPose);
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(detectPose);
  }, [useMockData, hasPermission, generateMockPose, onPoseDetected, drawPose]);

  useEffect(() => {
    if (isActive && hasPermission) {
      startPoseDetection();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [isActive, hasPermission, startPoseDetection]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  if (!navigator.mediaDevices?.getUserMedia) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-red-800">
          Camera API not supported in this browser
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
        <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg">
          <CameraOff className="h-12 w-12 text-gray-400 mb-4" />
          <Button onClick={startCamera} disabled={isLoading}>
            <Camera className="h-4 w-4 mr-2" />
            {isLoading ? "Retrying..." : "Try Again"}
          </Button>
        </div>
      </div>
    );
  }

  if (!hasPermission && !useMockData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg">
        <Camera className="h-12 w-12 text-gray-400 mb-4" />
        <Button onClick={startCamera} disabled={isLoading}>
          <Camera className="h-4 w-4 mr-2" />
          {isLoading ? "Loading..." : "Enable Camera"}
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-auto rounded-lg"
        style={{ display: useMockData ? 'none' : 'block' }}
      />
      <canvas
        ref={canvasRef}
        className={`absolute top-0 left-0 w-full h-full pointer-events-none ${useMockData ? 'bg-gray-200' : ''}`}
      />
      
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <Button 
          onClick={stopCamera}
          variant="destructive"
          size="sm"
        >
          <CameraOff className="h-4 w-4 mr-2" />
          Stop Camera
        </Button>
      </div>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p>Starting camera...</p>
          </div>
        </div>
      )}
    </div>
  );
}