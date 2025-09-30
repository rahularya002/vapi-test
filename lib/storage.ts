import { writeFile, readFile, mkdir } from "fs/promises";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

// File paths
const CANDIDATES_FILE = join(DATA_DIR, "candidates.json");
const CALL_QUEUE_FILE = join(DATA_DIR, "call-queue.json");
const CALL_HISTORY_FILE = join(DATA_DIR, "call-history.json");
const CONFIG_FILE = join(DATA_DIR, "config.json");

export interface Candidate {
  id: number;
  name: string;
  phone: string;
  email: string;
  position: string;
  status: string;
  callResult?: string;
  callNotes?: string;
  callTime?: string;
  addedAt?: string;
  callStartTime?: string;
  callEndTime?: string;
}

export interface CallConfig {
  method: "vapi" | "twilio" | "hybrid";
  script: string;
  voiceSettings: {
    provider: string;
    voiceId: string;
    speed: number;
    pitch: number;
  };
  callSettings: {
    maxDuration: number;
    retryAttempts: number;
    delayBetweenCalls: number;
  };
  // Assistant configuration fields
  assistant_name?: string;
  assistant_language?: string;
  model_provider?: string;
  model_name?: string;
  voice_provider?: string;
  voice_id?: string;
  voice_speed?: number;
  voice_pitch?: number;
  transcription_provider?: string;
  transcription_model?: string;
  transcription_language?: string;
  instructions?: string;
  max_duration_seconds?: number;
  interruption_threshold?: number;
  background_sound?: string;
  silence_timeout_seconds?: number;
  response_delay_seconds?: number;
  assistant_settings?: any;
}

// Generic file operations
async function readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const data = await readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return defaultValue;
  }
}

async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  await ensureDataDir();
  await writeFile(filePath, JSON.stringify(data, null, 2));
}

// Candidates storage
export async function getCandidates(): Promise<Candidate[]> {
  return readJsonFile(CANDIDATES_FILE, []);
}

export async function saveCandidates(candidates: Candidate[]): Promise<void> {
  await writeJsonFile(CANDIDATES_FILE, candidates);
}

export async function addCandidates(newCandidates: Candidate[]): Promise<void> {
  const existing = await getCandidates();
  const updated = [...existing, ...newCandidates];
  await saveCandidates(updated);
}

// Call queue storage
export async function getCallQueue(): Promise<Candidate[]> {
  return readJsonFile(CALL_QUEUE_FILE, []);
}

export async function saveCallQueue(queue: Candidate[]): Promise<void> {
  await writeJsonFile(CALL_QUEUE_FILE, queue);
}

export async function addToCallQueue(candidates: Candidate[]): Promise<void> {
  const existing = await getCallQueue();
  const updated = [...existing, ...candidates];
  await saveCallQueue(updated);
}

export async function clearCallQueue(): Promise<void> {
  await saveCallQueue([]);
}

// Call history storage
export async function getCallHistory(): Promise<Candidate[]> {
  return readJsonFile(CALL_HISTORY_FILE, []);
}

export async function saveCallHistory(history: Candidate[]): Promise<void> {
  await writeJsonFile(CALL_HISTORY_FILE, history);
}

export async function addToCallHistory(candidate: Candidate): Promise<void> {
  const existing = await getCallHistory();
  const updated = [...existing, candidate];
  await saveCallHistory(updated);
}

// Configuration storage
export async function getConfig(): Promise<CallConfig | null> {
  return readJsonFile(CONFIG_FILE, null);
}

export async function saveConfig(config: CallConfig): Promise<void> {
  await writeJsonFile(CONFIG_FILE, config);
}

// Export data (for backup)
export async function exportData() {
  const candidates = await getCandidates();
  const queue = await getCallQueue();
  const history = await getCallHistory();
  const config = await getConfig();
  
  return {
    candidates,
    callQueue: queue,
    callHistory: history,
    config,
    exportedAt: new Date().toISOString()
  };
}

// Import data (for restore)
export async function importData(data: any) {
  if (data.candidates) await saveCandidates(data.candidates);
  if (data.callQueue) await saveCallQueue(data.callQueue);
  if (data.callHistory) await saveCallHistory(data.callHistory);
  if (data.config) await saveConfig(data.config);
}
