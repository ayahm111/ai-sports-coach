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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState("");
  const [cameraStatus, setCameraStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [useMockData, setUseMockData] = useState(false);

  const generateMockPose = useCallback((): PoseData => {
    const time = Date.now() / 1000;
    const mockLandmarks = [
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
    ];

    return {
      landmarks: mockLandmarks,
      timestamp: Date.now(),
    };
  }, []);

  const drawPose = useCallback((landmarks: any[]) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw video frame if available
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    } else {
      // Draw placeholder background
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Camera Feed", canvas.width / 2, canvas.height / 2);
    }

    // Rest of your drawing logic...
    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 2;

    const connections = [
      [0, 1], [0, 2], // nose to shoulders
      [1, 3], [3, 5], // left arm
      [2, 4], [4, 6], // right arm
      [1, 2], // shoulders
      [1, 7], [2, 8], // shoulders to hips
      [7, 8], // hips
      [7, 9], [9, 11], // left leg
      [8, 10], [10, 12], // right leg
    ];

    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];
      if (startPoint && endPoint && startPoint.visibility > 0.5 && endPoint.visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
        ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
        ctx.stroke();
      }
    });

    // Draw landmarks
    ctx.fillStyle = "#FF0000";
    landmarks.forEach((landmark) => {
      if (landmark.visibility > 0.5) {
        ctx.beginPath();
        ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  }, []);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setCameraStatus("requesting");
      setError("");

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
        setCameraStatus("granted");
        startPoseDetection();
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      setCameraStatus("denied");
      setUseMockData(true); // Fallback to mock data

      if (err.name === "NotAllowedError") {
        setError("Camera access denied. Please allow camera permissions.");
      } else if (err.name === "NotFoundError") {
        setError("No camera found. Please connect a camera.");
      } else if (err.name === "NotReadableError") {
        setError("Camera is already in use by another application.");
      } else {
        setError(`Camera error: ${err.message || "Unknown error"}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setHasPermission(false);
    setCameraStatus("idle");
  }, []);

  const startPoseDetection = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (useMockData) {
      intervalRef.current = setInterval(() => {
        const mockPose = generateMockPose();
        onPoseDetected(mockPose);
        drawPose(mockPose.landmarks);
      }, 100);
    } else if (hasPermission && videoRef.current) {
      intervalRef.current = setInterval(() => {
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
      }, 100);
    }
  }, [useMockData, hasPermission, generateMockPose, onPoseDetected, drawPose]);

  useEffect(() => {
    if (hasPermission) {
      if (isActive) {
        startPoseDetection();
      } else if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isActive, hasPermission, startPoseDetection]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const isGetUserMediaSupported = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  if (!isGetUserMediaSupported()) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-red-800">
          Your browser doesn't support camera access. Please use Chrome, Firefox, or Edge.
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
          <p className="text-gray-600 text-center mb-4">Camera access failed</p>
          <div className="flex gap-2">
            <Button onClick={startCamera} disabled={isLoading}>
              <Camera className="h-4 w-4 mr-2" />
              {isLoading ? "Retrying..." : "Try Again"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setUseMockData(true)}
              disabled={useMockData}
            >
              Use Mock Data
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasPermission && !useMockData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg">
        <Camera className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600 text-center mb-4">
          {cameraStatus === "requesting" ? "Requesting camera access..." : "Camera access required"}
        </p>
        <div className="flex gap-2">
          <Button onClick={startCamera} disabled={isLoading}>
            <Camera className="h-4 w-4 mr-2" />
            {isLoading ? "Loading..." : "Enable Camera"}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setUseMockData(true)}
          >
            Use Mock Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto"
        />
        <canvas
          ref={canvasRef}
          className="w-full h-auto bg-black rounded-lg max-h-96 border"
          style={{ maxWidth: "640px" }}
        />

        {hasPermission && (
          <div className="absolute top-2 right-2 flex gap-2">
            <div className="bg-green-500 text-white px-2 py-1 rounded text-xs">
              {isActive ? "Recording" : "Ready"}
            </div>
            <Button 
              onClick={stopCamera} 
              variant="outline" 
              size="sm" 
              className="bg-white/80 hover:bg-white"
            >
              <CameraOff className="h-4 w-4" />
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p>Starting camera...</p>
            </div>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600 text-center">
        {useMockData && <p className="text-yellow-600">Using mock data - no real camera feed</p>}
        {hasPermission && <p>Camera active • {isActive ? "Analyzing pose" : "Ready"}</p>}
      </div>
    </div>
  );
}