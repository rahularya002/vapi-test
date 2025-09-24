const fs = require('fs');
const path = require('path');

const envTemplate = `# Vapi Configuration
VAPI_PRIVATE_KEY=your_vapi_private_key_here
VAPI_PUBLIC_KEY=your_vapi_public_key_here
VAPI_PHONE_NUMBER_ID=your_phone_number_id_here
VAPI_ASSISTANT_ID=your_assistant_id_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Twilio Configuration (for phone calls)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Assistant Configuration
ASSISTANT_NAME="Interview Assistant"
MODEL_PROVIDER="openai"
MODEL_NAME="gpt-4o-mini"

# Voice Provider
VOICE_PROVIDER="elevenlabs"
VOICE_ID="adam"

# Transcription
TRANSCRIPTION_PROVIDER="deepgram"
TRANSCRIPTION_MODEL="nova-2"
TRANSCRIPTION_LANGUAGE="multi"

# Webhook Security (optional)
WEBHOOK_SECRET="change-me"
`;

const envPath = path.join(__dirname, '..', '.env.local');

if (fs.existsSync(envPath)) {
  console.log('✅ .env.local already exists');
  console.log('📝 Edit the file to add your actual keys');
} else {
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Created .env.local file');
  console.log('📝 Please edit the file and replace the placeholder values with your actual keys');
  console.log('📖 See VAPI_SETUP_GUIDE.md for detailed instructions');
}

console.log('\n🔑 Required Keys:');
console.log('  - VAPI_PRIVATE_KEY (from Vapi dashboard)');
console.log('  - VAPI_PUBLIC_KEY (from Vapi dashboard)');
console.log('  - VAPI_PHONE_NUMBER_ID (from Vapi dashboard)');
console.log('  - VAPI_ASSISTANT_ID (from Vapi dashboard)');
console.log('  - NEXT_PUBLIC_SUPABASE_URL (from Supabase dashboard)');
console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY (from Supabase dashboard)');
console.log('  - TWILIO_ACCOUNT_SID (from Twilio console)');
console.log('  - TWILIO_AUTH_TOKEN (from Twilio console)');
console.log('  - TWILIO_PHONE_NUMBER (from Twilio console)');
