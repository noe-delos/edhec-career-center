/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */

"use client";

// components/conversation.tsx

import { useConversation } from "@11labs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Square, Camera, CameraOff, ArrowLeft } from "lucide-react";
import { getQuestionsForCategory } from "@/lib/interview-questions";
import { motion, useAnimationControls } from "framer-motion";

interface ConversationProps {
  interviewType: string;
  onBack: () => void;
}

export function Conversation({ interviewType, onBack }: ConversationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [loadingSignedUrl, setLoadingSignedUrl] = useState(false);
  const [urlFetchFailed, setUrlFetchFailed] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  // Animation controls for the speaking animation
  const animationControls = useAnimationControls();

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs");
      setConversationStarted(true);
      setInitializing(false);
      // Start timer when conversation begins
      startTimer();
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs");
      setConversationStarted(false);
      // Stop timer when conversation ends
      stopTimer();
    },
    onMessage: (message) => console.log("Message:", message),
    onError: (error) => {
      console.error("Error:", error);
      setUrlFetchFailed(true);
      setInitializing(false);
    },
  });

  // Format time in HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [hours, minutes, secs]
      .map((val) => val.toString().padStart(2, "0"))
      .join(":");
  };

  // Timer functions
  const startTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    setElapsedTime(0);
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  const getSignedUrl = async (): Promise<string | null> => {
    try {
      setLoadingSignedUrl(true);
      const response = await fetch("/api/get-signed-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ interviewType }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get signed url: ${response.statusText}`);
      }

      const data = await response.json();

      // If we're using direct agent ID (no authentication)
      if (data.directUse) {
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error("Error getting signed URL:", error);
      setUrlFetchFailed(true);
      return null;
    } finally {
      setLoadingSignedUrl(false);
    }
  };

  // Toggle camera on/off
  const toggleCamera = () => {
    if (cameraEnabled) {
      // Stop camera - but only video tracks, keep audio
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const videoTracks = stream.getVideoTracks();
        videoTracks.forEach((track) => track.stop());

        // Keep audio tracks
        const audioTracks = stream.getAudioTracks();
        const newStream = new MediaStream(audioTracks);
        videoRef.current.srcObject = newStream;
      }
    } else {
      // Restart camera
      initializeMedia();
    }
    setCameraEnabled(!cameraEnabled);
  };

  // Initialize media (camera and microphone) - only called once at mount and on manual toggle
  const initializeMedia = async () => {
    try {
      // Request both camera and microphone permissions at once
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });

      // Attach to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      return true;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      setCameraEnabled(false);
      return false;
    }
  };

  const startConversation = useCallback(async () => {
    if (conversationStarted || loadingSignedUrl) return;

    try {
      // No need to request microphone again since we already did in initializeMedia

      // Prepare dynamic variables for ElevenLabs
      const dynamicVariables = {
        interview_type:
          interviewType === "corporate"
            ? "Finance d'Entreprise"
            : "Sales & Trading",
      };

      // Set up client tools for fetching questions
      const clientTools: any = {
        getQuestion: async ({ category, difficulty }: any) => {
          const question = getQuestionsForCategory(
            interviewType,
            category,
            difficulty
          );
          console.log("Retrieved question:", question);
          return { question };
        },
      };

      // Get signed URL if using a private agent
      const signedUrl = await getSignedUrl();

      if (signedUrl) {
        // Using signed URL
        await conversation.startSession({
          signedUrl,
          dynamicVariables,
          clientTools,
        });
      } else if (!urlFetchFailed) {
        // Using public agent ID directly
        const agentId =
          interviewType === "corporate"
            ? process.env.NEXT_PUBLIC_CORPORATE_AGENT_ID
            : process.env.NEXT_PUBLIC_MARKET_AGENT_ID;

        await conversation.startSession({
          agentId:
            agentId || process.env.NEXT_PUBLIC_AGENT_ID || "default_agent_id",
          dynamicVariables,
          clientTools,
        });
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
      setInitializing(false);
    }
  }, [
    conversation,
    conversationStarted,
    loadingSignedUrl,
    urlFetchFailed,
    interviewType,
  ]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    setConversationStarted(false);
  }, [conversation]);

  // Initialize everything once on component mount
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (!mounted) return;

      try {
        // Initialize camera and microphone once
        const mediaInitialized = await initializeMedia();

        if (mediaInitialized && mounted) {
          // Give a brief delay for media to initialize
          setTimeout(() => {
            if (mounted) {
              startConversation();
            }
          }, 1000);
        } else {
          setInitializing(false);
        }
      } catch (error) {
        console.error("Initialization error:", error);
        setInitializing(false);
      }
    };

    initialize();

    // Cleanup function
    return () => {
      mounted = false;
      stopTimer();

      // Stop all media tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []); // Empty dependency array - run only once on mount

  // Effect for handling the speaking animation
  useEffect(() => {
    let animationInterval: NodeJS.Timeout | null = null;

    if (conversation.isSpeaking) {
      // Start random animation when speaking - faster and more random
      animationInterval = setInterval(() => {
        // Generate more extreme random scale between 0.7 and 1.5
        const randomScale = 0.7 + Math.random() * 0.8;
        // Faster transitions with random durations
        animationControls.start({
          scale: randomScale,
          x: (Math.random() - 0.5) * 8, // slight random horizontal movement
          y: (Math.random() - 0.5) * 8, // slight random vertical movement
          transition: {
            duration: 0.2 + Math.random() * 0.3,
            ease: ["easeIn", "easeOut", "circIn", "circOut"][
              Math.floor(Math.random() * 4)
            ],
          },
        });
      }, 200); // Twice as fast update interval
    } else {
      // Reset to normal size when not speaking
      animationControls.start({
        scale: 1,
        x: 0,
        y: 0,
        transition: { duration: 0.2 },
      });
    }

    return () => {
      if (animationInterval) clearInterval(animationInterval);
    };
  }, [conversation.isSpeaking, animationControls]);

  // Get interview type label
  const getInterviewTypeLabel = () => {
    switch (interviewType) {
      case "corporate":
        return "Entretien Finance d'Entreprise";
      case "market":
        return "Entretien Sales & Trading";
      default:
        return "Entretien";
    }
  };

  return (
    <div className="flex flex-col justify-between h-screen">
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          disabled={conversationStarted && !urlFetchFailed}
          className="rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1
          className="text-2xl font-bold text-center"
          style={{ color: "#A02235" }}
        >
          {getInterviewTypeLabel()}
        </h1>
        <div className="w-8"></div> {/* For balance */}
      </div>

      {/* Main content - perfectly centered */}
      <div className="flex-grow flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl px-4">
          {/* Left card - EDHEC branded background */}
          <Card
            className="overflow-hidden h-[450px]"
            style={{ backgroundColor: "#A02235" }}
          >
            <div className="h-full w-full flex items-center justify-center p-6">
              <div className="text-white text-center">
                <h2 className="text-xl font-bold mb-4">EDHEC AI Assistant</h2>
                <p className="mb-6">
                  Votre compagnon de préparation aux entretiens
                </p>
                {/* Speaking animation circle - more dynamic version */}
                <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                  <motion.div
                    animate={animationControls}
                    className="absolute inset-0 bg-white/10 rounded-full"
                  />
                  <motion.div
                    animate={animationControls}
                    initial={{ scale: 1 }}
                    style={{ scale: 0.95, originX: 0.5, originY: 0.5 }}
                    className="absolute inset-1 bg-white/20 rounded-full"
                  />
                  <motion.div
                    animate={animationControls}
                    initial={{ scale: 1 }}
                    style={{ scale: 0.9, originX: 0.5, originY: 0.5 }}
                    className="absolute inset-2 bg-white/30 rounded-full"
                  />
                  <motion.div
                    animate={animationControls}
                    initial={{ scale: 1 }}
                    style={{ scale: 0.85, originX: 0.5, originY: 0.5 }}
                    className="absolute inset-3 bg-white/40 rounded-full"
                  />
                  <motion.div
                    animate={animationControls}
                    initial={{ scale: 1 }}
                    style={{ scale: 0.8, originX: 0.5, originY: 0.5 }}
                    className="absolute inset-4 bg-white/50 rounded-full"
                  />
                  <motion.div className="relative z-10 text-white font-medium text-sm">
                    {conversation.isSpeaking ? "Parlant" : "En attente"}
                  </motion.div>
                </div>
              </div>
            </div>
          </Card>

          {/* Right - Camera feed with no container */}
          <div className="h-[450px] bg-white flex items-center justify-center">
            {cameraEnabled ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover rounded-xl bg-white"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <CameraOff className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>La caméra est désactivée</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="p-6">
        {/* Timer */}
        <div className="text-center text-xl font-mono mb-4">
          {formatTime(elapsedTime)}
        </div>

        <div className="flex justify-center items-center gap-6 mb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleCamera}
            className="rounded-full h-14 w-14 shadow-md"
          >
            {cameraEnabled ? (
              <CameraOff className="h-6 w-6" />
            ) : (
              <Camera className="h-6 w-6" />
            )}
          </Button>

          {urlFetchFailed ? (
            <Button
              className="rounded-full h-14 w-14 shadow-md"
              size="icon"
              onClick={startConversation}
              style={{ backgroundColor: "#A02235" }}
            >
              <Play className="h-6 w-6" />
            </Button>
          ) : (
            <Button
              className="rounded-full h-14 w-14 shadow-md"
              size="icon"
              disabled={conversationStarted || loadingSignedUrl}
              onClick={startConversation}
              style={{ backgroundColor: "#A02235" }}
            >
              {initializing || loadingSignedUrl ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>
          )}

          <Button
            variant="destructive"
            size="icon"
            disabled={!conversationStarted}
            onClick={stopConversation}
            className="rounded-full h-14 w-14 shadow-md"
          >
            <Square className="h-6 w-6" />
          </Button>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>
            Statut:{" "}
            {conversationStarted
              ? "Connecté"
              : initializing
              ? "Initialisation..."
              : "Déconnecté"}
          </p>
          {conversationStarted && (
            <p>
              L'IA est en train de{" "}
              {conversation.isSpeaking ? "parler" : "écouter"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
