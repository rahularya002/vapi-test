## Voice Call Agent (Vapi) – Minimal Setup

This repo exposes two serverless endpoints to power a simple voice agent using Vapi. There is no UI. The agent starts every call by asking the caller for their language preference (English or Hindi) and then continues in that language.

### Endpoints

- `GET /api/assistant` — returns a minimal Vapi assistant configuration that opens by asking for English/Hindi.
- `POST /api/vapi-webhook` — receives and logs Vapi call events. You can set this URL in the Vapi dashboard as your webhook.

### Run locally

```bash
npm run dev
# Server runs at http://localhost:3000
```

With the dev server running:

- Test assistant config: `http://localhost:3000/api/assistant`
- Webhook healthcheck: `http://localhost:3000/api/vapi-webhook`

### Configure in Vapi Dashboard

1. Create an assistant and attach a phone number (or test in-browser from Vapi).
2. Set your webhook URL to your deployed `POST /api/vapi-webhook` endpoint.
3. Optionally copy pieces from `GET /api/assistant` into your Vapi assistant config (model, voice, transcription, and the initial greeting that asks for English/Hindi).

### Notes

- The example `model`, `voice`, and `transcription` providers in `app/api/assistant/route.ts` are placeholders. Choose providers/models you have enabled in Vapi.
- If you deploy to Vercel, remember to update the webhook URL in the Vapi dashboard to your production domain.

### Environment variables

Create a `.env.local` file in the project root with the following keys (values are examples and can be changed):

```bash
# Assistant configuration
ASSISTANT_NAME="Language Preference Agent"
MODEL_PROVIDER="openai"
MODEL_NAME="gpt-4o-mini"

# Voice provider
VOICE_PROVIDER="elevenlabs"
VOICE_ID="adam"

# Transcription
TRANSCRIPTION_PROVIDER="deepgram"
TRANSCRIPTION_MODEL="nova-2"
TRANSCRIPTION_LANGUAGE="multi"

# Prompting
INITIAL_MESSAGE="Hello! I can speak English or Hindi. Which language would you prefer?"
INSTRUCTIONS="You are a friendly assistant that can converse in English and Hindi. After the caller states a preference, continue the conversation in that language. If unclear, briefly ask again."

# Webhook auth (optional). If set, webhook requires Authorization: Bearer <token>
WEBHOOK_SECRET="change-me"
```

### Files

- `app/api/assistant/route.ts`: returns the minimalist assistant config.
- `app/api/vapi-webhook/route.ts`: receives and logs webhook events.

