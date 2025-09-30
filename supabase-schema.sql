-- Auto Caller Agent Database Schema for Supabase

-- Enable Row Level Security

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  position VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  call_result TEXT,
  call_notes TEXT,
  call_time TIMESTAMP WITH TIME ZONE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  call_start_time TIMESTAMP WITH TIME ZONE,
  call_end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create call_configs table
CREATE TABLE IF NOT EXISTS call_configs (
  id SERIAL PRIMARY KEY,
  method VARCHAR(20) NOT NULL DEFAULT 'hybrid',
  script TEXT NOT NULL,
  voice_settings JSONB NOT NULL DEFAULT '{}',
  call_settings JSONB NOT NULL DEFAULT '{}',
  assistant_settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns for assistant configuration
ALTER TABLE call_configs 
ADD COLUMN IF NOT EXISTS assistant_name VARCHAR(255) DEFAULT 'Interview Assistant',
ADD COLUMN IF NOT EXISTS assistant_language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS model_provider VARCHAR(50) DEFAULT 'openai',
ADD COLUMN IF NOT EXISTS model_name VARCHAR(50) DEFAULT 'gpt-4o-mini',
ADD COLUMN IF NOT EXISTS voice_provider VARCHAR(50) DEFAULT 'elevenlabs',
ADD COLUMN IF NOT EXISTS voice_id VARCHAR(100) DEFAULT 'adam',
ADD COLUMN IF NOT EXISTS voice_speed DECIMAL(3,1) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS voice_pitch DECIMAL(3,1) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS transcription_provider VARCHAR(50) DEFAULT 'deepgram',
ADD COLUMN IF NOT EXISTS transcription_model VARCHAR(50) DEFAULT 'nova-2',
ADD COLUMN IF NOT EXISTS transcription_language VARCHAR(10) DEFAULT 'multi',
ADD COLUMN IF NOT EXISTS instructions TEXT,
ADD COLUMN IF NOT EXISTS max_duration_seconds INTEGER DEFAULT 600,
ADD COLUMN IF NOT EXISTS interruption_threshold INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS background_sound VARCHAR(50) DEFAULT 'office',
ADD COLUMN IF NOT EXISTS silence_timeout_seconds INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS response_delay_seconds DECIMAL(3,1) DEFAULT 0.5;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_phone ON candidates(phone);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON candidates(created_at);
CREATE INDEX IF NOT EXISTS idx_call_configs_created_at ON call_configs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_candidates_updated_at 
  BEFORE UPDATE ON candidates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_call_configs_updated_at 
  BEFORE UPDATE ON call_configs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_configs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security needs)
CREATE POLICY "Enable all operations for all users" ON candidates
  FOR ALL USING (true);

CREATE POLICY "Enable all operations for all users" ON call_configs
  FOR ALL USING (true);

-- Insert default configuration
INSERT INTO call_configs (method, script, voice_settings, call_settings) 
VALUES (
  'hybrid',
  'Hello! This is an automated call regarding your job application. Do you have a few minutes to answer some questions?

1. Can you tell me about yourself and your background?
2. What interests you about this position?
3. What are your key strengths and skills?
4. Do you have any questions about the role or company?
5. What is your availability for the next steps?

Thank you for your time!',
  '{"provider": "elevenlabs", "voice_id": "adam", "speed": 1.0, "pitch": 1.0}',
  '{"max_duration": 15, "retry_attempts": 2, "delay_between_calls": 30}'
) ON CONFLICT DO NOTHING;
