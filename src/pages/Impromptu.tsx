import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { transcribeAudio } from "@/services/transcription";
import { analyzeStructuralElements } from "@/lib/structuralAnalysis";
import { getRandomImpromptuQuestion } from "@/lib/impromptuQuestions";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { FuturismBlock } from "@/components/ui/FuturismBlock";

type ImpromptuPhase = "question" | "countdown" | "recording" | "processing";
const THINK_SECONDS = 5;
const RECORD_SECONDS = 90;

const Impromptu = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [question, setQuestion] = useState<string>("");
  const [phase, setPhase] = useState<ImpromptuPhase>("question");
  const [countdownSeconds, setCountdownSeconds] = useState(THINK_SECONDS);
  const [recordSecondsRemaining, setRecordSecondsRemaining] = useState(RECORD_SECONDS);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingDurationSecondsRef = useRef(0);

  useEffect(() => {
    setQuestion(getRandomImpromptuQuestion());
  }, []);

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const stopRecording = useCallback(() => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setPhase("processing");
    setTranscriptionError(null);
  }, []);

  const startTranscription = useCallback(
    async (blob: Blob, durationSeconds: number) => {
      try {
        const transcript = await transcribeAudio(blob);
        const durationMinutes = Math.max(0.1, durationSeconds / 60);
        const analysisResults = analyzeStructuralElements(transcript, durationMinutes);
        navigate("/impromptu-results", {
          state: {
            transcript,
            analysisResults,
            durationMinutes,
            question,
          },
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Transcription failed. Please try again.";
        setTranscriptionError(message);
      }
    },
    [navigate, question]
  );

  const startRecording = useCallback(async () => {
    setPhase("recording");
    setRecordSecondsRemaining(RECORD_SECONDS);
    recordingDurationSecondsRef.current = 0;

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
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mimeType || "audio/webm",
        });
        setAudioBlob(blob);
        startTranscription(blob, recordingDurationSecondsRef.current);
      };

      mediaRecorder.onerror = () => {
        toast({
          title: "Recording error",
          description: "Something went wrong with the recording.",
          variant: "destructive",
        });
        stopRecording();
      };

      mediaRecorder.start(1000);

      recordTimerRef.current = setInterval(() => {
        setRecordSecondsRemaining((prev) => {
          recordingDurationSecondsRef.current = RECORD_SECONDS - prev + 1;
          if (prev <= 1) {
            stopRecording();
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
            description: "Please allow microphone access in your browser settings.",
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
      setPhase("question");
    }
  }, [stopRecording, startTranscription, toast]);

  const startCountdown = useCallback(() => {
    setPhase("countdown");
    setCountdownSeconds(THINK_SECONDS);

    countdownTimerRef.current = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [startRecording]);

  const getSupportedMimeType = (): string | null => {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return null;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartClick = () => {
    if (phase === "question") {
      startCountdown();
    } else if (phase === "recording") {
      recordingDurationSecondsRef.current = RECORD_SECONDS - recordSecondsRemaining;
      stopRecording();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-layered px-6 py-8 pb-24 flex flex-col relative page-transition">
      <FuturismBlock
        variant="block-1"
        className="top-6 right-[-140px] futurism-strong"
        borderColor="#7209B7"
        zIndex={1}
      />
      <FuturismBlock
        variant="block-2"
        className="bottom-[-60px] left-[-120px]"
        borderColor="#F72585"
        zIndex={2}
      />
      <FuturismBlock
        variant="stripe-1"
        className="top-28 right-[-140px]"
        zIndex={1}
      />
      <FuturismBlock
        variant="stripe-2"
        className="top-56 left-[-140px]"
        zIndex={1}
      />

      <div className="mb-8 relative z-10">
        <button
          onClick={() => navigate("/onboarding/topics")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-sans text-sm"
          disabled={phase === "recording"}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full flex flex-col items-center relative z-10">
        <GlassCard
          className="w-full mb-8 p-6 text-center opacity-0 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
          hover={false}
        >
          <p className="text-sm text-muted-foreground font-sans mb-2 uppercase tracking-wide">
            Impromptu Response
          </p>
          {phase === "question" ? (
            <>
              <h1 className="text-xl font-serif font-bold text-foreground leading-relaxed">
                Tap Begin to reveal your question
              </h1>
              <p className="text-sm text-muted-foreground font-sans mt-3">
                You&apos;ll have {THINK_SECONDS} seconds to think, then respond for up to {RECORD_SECONDS / 60} minutes.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-serif font-bold text-foreground leading-relaxed">
                {question}
              </h1>
              <p className="text-sm text-muted-foreground font-sans mt-3">
                You have {THINK_SECONDS} seconds to think, then respond for up to {RECORD_SECONDS / 60} minutes.
              </p>
            </>
          )}
        </GlassCard>

        {/* Countdown or Timer */}
        <div
          className="mb-12 opacity-0 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          {phase === "countdown" && (
            <div
              className={cn(
                "text-6xl font-sans font-light tracking-tight transition-colors duration-300",
                countdownSeconds <= 2 ? "text-primary" : "text-muted-foreground"
              )}
            >
              {countdownSeconds}
            </div>
          )}
          {phase === "recording" && (
            <div
              className={cn(
                "text-6xl font-sans font-light tracking-tight transition-colors duration-300",
                recordSecondsRemaining <= 10 ? "text-destructive" : "text-primary"
              )}
            >
              {formatTime(recordSecondsRemaining)}
            </div>
          )}
          {phase === "question" && (
            <div className="text-6xl font-sans font-light tracking-tight text-muted-foreground">
              —
            </div>
          )}
        </div>

        {/* Main action area */}
        <div
          className="flex-1 flex items-center justify-center opacity-0 animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          {phase === "processing" ? (
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
                          if (audioBlob)
                            startTranscription(audioBlob, recordingDurationSecondsRef.current);
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
                          setPhase("question");
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
          ) : phase === "countdown" ? (
            <GlassCard className="p-8 w-full max-w-sm text-center" hover={false}>
              <p className="text-muted-foreground font-serif">
                Get ready... speak when recording starts
              </p>
            </GlassCard>
          ) : (
            <button
              onClick={handleStartClick}
              className={cn(
                "record-button focus:outline-none focus:ring-4 focus:ring-ring focus:ring-offset-4 focus:ring-offset-background",
                phase === "recording" ? "record-button--recording" : "record-button--idle"
              )}
              aria-label={
                phase === "recording" ? "Stop recording" : "Start 5-second countdown"
              }
            >
              {phase === "recording" && (
                <span className="record-button-pulse" aria-hidden />
              )}
              <span className="record-button-content">
                {phase === "recording"
                  ? formatTime(RECORD_SECONDS - recordSecondsRemaining)
                  : "Begin"}
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
            {phase === "question" && "Tap Begin for 5 seconds to think, then record"}
            {phase === "countdown" && "Think of your position and main points"}
            {phase === "recording" && "Tap to stop early, or wait for timer"}
            {phase === "processing" &&
              (transcriptionError ? "Try again or record a new response." : "Analyzing your speech...")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Impromptu;
