import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type RecordingState = "idle" | "recording" | "processing";

const Practice = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [topic, setTopic] = useState<string>("");
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const storedTopic = localStorage.getItem("selectedTopic");
    if (!storedTopic) {
      navigate("/topics");
      return;
    }
    setTopic(storedTopic);
  }, [navigate]);

  // Cleanup on unmount
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

  const stopRecording = useCallback(() => {
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

    // Simulate processing delay before showing results
    setTimeout(() => {
      // For now, just show a message - we'll add transcription next
      setRecordingState("idle");
      setTimeRemaining(60);
      toast({
        title: "Recording complete!",
        description: "Transcription coming soon...",
      });
    }, 2000);
  }, [toast]);

  const startRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      // Determine best supported MIME type for cross-browser compatibility
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
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || "audio/webm",
        });
        setAudioBlob(audioBlob);
        console.log("Recording saved:", audioBlob.size, "bytes");
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

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setRecordingState("recording");
      setTimeRemaining(60);

      // Start countdown timer
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
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
            description: "Please allow microphone access to record.",
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
    <div className="min-h-screen bg-background px-6 py-8 flex flex-col">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/topics")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-sans text-sm"
          disabled={recordingState === "recording"}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full flex flex-col items-center">
        {/* Topic Display */}
        <div
          className="w-full mb-12 opacity-0 animate-fade-in text-center"
          style={{ animationDelay: "0.1s" }}
        >
          <p className="text-sm text-muted-foreground font-sans mb-2 uppercase tracking-wide">
            Your Topic
          </p>
          <h1 className="text-2xl font-serif font-bold text-foreground leading-relaxed">
            {topic}
          </h1>
        </div>

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
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-full bg-secondary flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-muted-foreground font-serif animate-pulse">
                Processing...
              </p>
            </div>
          ) : (
            <button
              onClick={handleRecordClick}
              className={cn(
                "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-ring focus:ring-offset-4 focus:ring-offset-background",
                recordingState === "idle"
                  ? "bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl hover:scale-105"
                  : "bg-destructive animate-pulse-recording"
              )}
              aria-label={recordingState === "idle" ? "Start recording" : "Stop recording"}
            >
              {recordingState === "idle" ? (
                <div className="w-12 h-12 rounded-full bg-primary-foreground" />
              ) : (
                <div className="w-10 h-10 rounded-sm bg-destructive-foreground" />
              )}
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
            {recordingState === "processing" && "Analyzing your speech..."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Practice;
