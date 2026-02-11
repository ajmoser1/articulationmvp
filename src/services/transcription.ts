const ASSEMBLYAI_BASE = "https://api.assemblyai.com/v2";
const POLL_INTERVAL_MS = 1500;
const TIMEOUT_MS = 60_000;

type UploadResponse = { upload_url: string };
type TranscriptCreateBody = {
  audio_url: string;
  speech_models: ("universal-3-pro" | "universal-2")[];
  disfluencies: boolean;
};
type TranscriptCreateResponse = { id: string };
type TranscriptStatus = "queued" | "processing" | "completed" | "error";
type TranscriptPollResponse = {
  status: TranscriptStatus;
  text?: string | null;
  error?: string;
};

function getApiKey(): string {
  const key = import.meta.env.VITE_ASSEMBLYAI_API_KEY;
  if (!key || typeof key !== "string") {
    throw new Error(
      "VITE_ASSEMBLYAI_API_KEY is not set. Add it to your .env file."
    );
  }
  return key;
}

async function uploadAudio(blob: Blob, apiKey: string): Promise<string> {
  const res = await fetch(`${ASSEMBLYAI_BASE}/upload`, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/octet-stream",
    },
    body: blob,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Upload failed (${res.status}): ${body || res.statusText}`
    );
  }

  const data = (await res.json()) as UploadResponse;
  if (!data.upload_url) {
    throw new Error("Upload response missing upload_url");
  }
  return data.upload_url;
}

async function createTranscript(
  audioUrl: string,
  apiKey: string
): Promise<string> {
  const body: TranscriptCreateBody = {
    audio_url: audioUrl,
    speech_models: ["universal-2"],
    disfluencies: true,
  };
  const res = await fetch(`${ASSEMBLYAI_BASE}/transcript`, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Create transcript failed (${res.status}): ${text || res.statusText}`
    );
  }

  const data = (await res.json()) as TranscriptCreateResponse;
  if (!data.id) {
    throw new Error("Transcript response missing id");
  }
  return data.id;
}

async function pollTranscript(
  transcriptId: string,
  apiKey: string
): Promise<string> {
  const deadline = Date.now() + TIMEOUT_MS;

  while (Date.now() < deadline) {
    const res = await fetch(`${ASSEMBLYAI_BASE}/transcript/${transcriptId}`, {
      headers: { Authorization: apiKey },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Get transcript failed (${res.status}): ${text || res.statusText}`
      );
    }

    const data = (await res.json()) as TranscriptPollResponse;

    if (data.status === "completed") {
      return data.text ?? "";
    }

    if (data.status === "error") {
      throw new Error(
        data.error ?? "Transcription failed (AssemblyAI returned error)"
      );
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new Error(
    "Transcription timed out after 60 seconds. Please try again."
  );
}

/**
 * Uploads audio to AssemblyAI, creates a transcript job, polls until complete,
 * and returns the transcript text. Throws on missing API key, upload/API errors,
 * or after 60 seconds without completion.
 */
export async function transcribeAudio(blob: Blob): Promise<string> {
  const apiKey = getApiKey();
  const uploadUrl = await uploadAudio(blob, apiKey);
  const transcriptId = await createTranscript(uploadUrl, apiKey);
  return pollTranscript(transcriptId, apiKey);
}
