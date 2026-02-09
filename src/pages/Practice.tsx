import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { transcribeAudio } from "@/services/transcription";
import { analyzeFillerWords } from "@/lib/fillerWords";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { FuturismBlock } from "@/components/ui/FuturismBlock";

type RecordingState = "idle" | "recording" | "processing";

const Practice = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [topic, setTopic] = useState<string>("");
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingDurationSecondsRef = useRef(60);
  const timeRemainingRef = useRef(60);

  useEffect(() => {
    const storedTopic = localStorage.getItem("selectedTopic");
    if (!storedTopic) {
      navigate("/topics");
      return;
    }
    setTopic(storedTopic);
  }, [navigate]);

  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const stopRecording = useCallback((remainingSeconds?: number) => {
    const remaining = remainingSeconds ?? timeRemainingRef.current;
    recordingDurationSecondsRef.current = Math.max(0, 60 - remaining);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setRecordingState("processing");
    setTranscriptionError(null);
  }, []);

  const startTranscription = useCallback(
    async (blob: Blob, durationSeconds: number) => {
      try {
        const transcript = await transcribeAudio(blob);
        const durationMinutes = Math.max(0.1, durationSeconds / 60);
        const analysisResults = analyzeFillerWords(transcript, durationMinutes);
        navigate("/results", {
          state: { transcript, analysisResults, durationMinutes },
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Transcription failed. Please try again.";
        setTranscriptionError(message);
      }
    },
    [navigate]
  );

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = getSupportedMimeType();

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mimeType || "audio/webm",
        });
        setAudioBlob(blob);
        const durationSeconds = recordingDurationSecondsRef.current;
        startTranscription(blob, durationSeconds);
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast({
          title: "Recording error",
          description: "Something went wrong with the recording.",
          variant: "destructive",
        });
        stopRecording();
      };

      mediaRecorder.start(1000);
      setRecordingState("recording");
      setTimeRemaining(60);

      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            stopRecording(prev);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);

      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          toast({
            title: "Microphone access denied",
            description:
              "Please allow microphone access in your browser settings.",
            variant: "destructive",
          });
        } else if (error.name === "NotFoundError") {
          toast({
            title: "No microphone found",
            description: "Please connect a microphone to record.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Recording not available",
            description: "Your browser may not support audio recording.",
            variant: "destructive",
          });
        }
      }
    }
  };

  const getSupportedMimeType = (): string | null => {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return null;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleRecordClick = () => {
    if (recordingState === "idle") {
      startRecording();
    } else if (recordingState === "recording") {
      stopRecording();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-layered px-6 py-8 pb-24 flex flex-col relative page-transition">
      <FuturismBlock
        variant="block-1"
        className="top-[-220px] right-[-260px] futurism-strong"
        borderColor="#4CC9F0"
        zIndex={1}
      />
      <FuturismBlock
        variant="block-2"
        className="bottom-[-260px] left-[-220px]"
        borderColor="#F72585"
        zIndex={2}
      />
      <FuturismBlock
        variant="stripe-1"
        className="top-24 right-[-240px]"
        zIndex={1}
      />
      <FuturismBlock
        variant="stripe-2"
        className="top-56 left-[-240px]"
        zIndex={1}
      />
      <div className="mb-8 relative z-10">
        <button
          onClick={() => navigate("/topics")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-sans text-sm"
          disabled={recordingState === "recording"}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full flex flex-col items-center relative z-10">
        {/* Topic Display in Glass Card */}
        <GlassCard
          className="w-full mb-12 p-6 text-center opacity-0 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
          hover={false}
        >
          <p className="text-sm text-muted-foreground font-sans mb-2 uppercase tracking-wide">
            Your Topic
          </p>
          <h1 className="text-2xl font-serif font-bold text-foreground leading-relaxed">
            {topic}
          </h1>
        </GlassCard>

        {/* Timer */}
        <div
          className="mb-12 opacity-0 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <div
            className={cn(
              "text-6xl font-sans font-light tracking-tight transition-colors duration-300",
              recordingState === "recording" && timeRemaining <= 10
                ? "text-destructive"
                : recordingState === "recording"
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {formatTime(timeRemaining)}
          </div>
        </div>

        {/* Record Button */}
        <div
          className="flex-1 flex items-center justify-center opacity-0 animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          {recordingState === "processing" ? (
            <GlassCard className="p-8 w-full max-w-sm" hover={false}>
              <div className="flex flex-col items-center gap-6">
                {transcriptionError ? (
                  <>
                    <p className="text-sm font-sans text-center status-error rounded-lg px-3 py-2">
                      {transcriptionError}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                      <Button
                        variant="outline"
                        className="btn-glass"
                        onClick={() => {
                          setTranscriptionError(null);
                          if (audioBlob) startTranscription(audioBlob, recordingDurationSecondsRef.current);
                        }}
                      >
                        Try again
                      </Button>
                      <Button
                        variant="secondary"
                        className="btn-glass"
                        onClick={() => {
                          setTranscriptionError(null);
                          setAudioBlob(null);
                          setRecordingState("idle");
                          setTimeRemaining(60);
                        }}
                      >
                        Record again
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-full h-1.5 rounded-full bg-white/30 overflow-hidden">
                      <div className="h-full w-1/3 rounded-full bg-primary/60 animate-analyzing" />
                    </div>
                    <p className="text-muted-foreground font-serif animate-soft-fade">
                      Analyzing your speech...
                    </p>
                  </>
                )}
              </div>
            </GlassCard>
          ) : (
            <button
              onClick={handleRecordClick}
              className={cn(
                "record-button focus:outline-none focus:ring-4 focus:ring-ring focus:ring-offset-4 focus:ring-offset-background",
                recordingState === "idle" ? "record-button--idle" : "record-button--recording"
              )}
              aria-label={recordingState === "idle" ? "Start recording" : "Stop recording"}
            >
              {recordingState === "recording" && (
                <span className="record-button-pulse" aria-hidden />
              )}
              <span className="record-button-content">
                {recordingState === "recording"
                  ? formatTime(Math.max(0, 60 - timeRemaining))
                  : "Record"}
              </span>
            </button>
          )}
        </div>

        {/* Instructions */}
        <div
          className="mt-auto pt-8 text-center opacity-0 animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          <p className="text-sm text-muted-foreground font-sans">
            {recordingState === "idle" && "Tap to start recording"}
            {recordingState === "recording" && "Tap to stop early, or wait for timer"}
            {recordingState === "processing" &&
              (transcriptionError ? "Try again or record a new clip." : "Analyzing your speech...")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Practice;
