# Auto Caller Agent - Candidate Interview System

A comprehensive auto caller system that reads candidate data from Excel files and conducts automated phone interviews using Vapi AI voice technology.

## Features

- **Excel File Upload**: Upload candidate data from Excel files (.xlsx, .xls)
- **Call Queue Management**: Manage and track candidate calls in a queue system
- **Automated Interviews**: AI-powered voice interviews with customizable scripts
- **Call Tracking**: Track call results, notes, and completion status
- **Web Dashboard**: User-friendly interface for managing the entire process
- **Vapi Integration**: Seamless integration with Vapi for voice calling

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the project root:

```bash
# Vapi Configuration
VAPI_PRIVATE_KEY=your_vapi_private_key_here
VAPI_PUBLIC_KEY=your_vapi_public_key_here
VAPI_PHONE_NUMBER_ID=your_phone_number_id_here
VAPI_ASSISTANT_ID=your_assistant_id_here

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

# Interview Script
INITIAL_MESSAGE="Hello! This is an automated call regarding your job application. Do you have a few minutes to answer some questions?"
INSTRUCTIONS="You are a professional interview assistant conducting phone interviews for job candidates..."

# Webhook Security (optional)
WEBHOOK_SECRET="change-me"
```

### 3. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to access the dashboard.

## How to Use

### 1. Upload Candidate Data

1. Prepare an Excel file with candidate information
2. Required columns: `phone` (mandatory)
3. Optional columns: `name`, `email`, `position`
4. Upload the file through the dashboard
5. Review parsed candidates and add them to the call queue

### 2. Manage Call Queue

1. View all candidates in the call queue
2. Start calls individually or in sequence
3. Track call status (pending, calling, completed)
4. Clear the queue if needed

### 3. Track Call History

1. View completed calls and their results
2. Review call notes and outcomes
3. Export data for further analysis

## API Endpoints

### Core Endpoints

- `GET /api/assistant` — Returns Vapi assistant configuration for interviews
- `POST /api/upload-excel` — Upload and parse Excel files with candidate data
- `GET/POST /api/calls` — Manage call queue and history
- `POST /api/vapi-call` — Initiate outbound calls via Vapi only
- `POST /api/twilio-call` — Initiate outbound calls via Twilio only
- `POST /api/hybrid-call` — Initiate calls using Twilio + Vapi combination
- `POST /api/vapi-webhook` — Receive call events from Vapi

### File Upload Format

Your Excel file should contain these columns:

| Column | Required | Description |
|--------|----------|-------------|
| phone | Yes | Candidate's phone number |
| name | No | Candidate's name |
| email | No | Candidate's email address |
| position | No | Job position they're applying for |

## Setup Guide

### 1. Vapi Setup

1. Sign up at [vapi.ai](https://vapi.ai)
2. Get your private and public keys from the dashboard
3. Create an assistant configuration
4. Use the assistant configuration from `/api/assistant`

### 2. Twilio Setup

1. Sign up at [twilio.com](https://twilio.com)
2. Get your Account SID and Auth Token from the console
3. Purchase a phone number or use existing one
4. Note your Twilio phone number

### 3. Environment Variables

Make sure to set these in your `.env.local`:

**Vapi Configuration:**
- `VAPI_PRIVATE_KEY`: Your Vapi private key
- `VAPI_PUBLIC_KEY`: Your Vapi public key
- `VAPI_PHONE_NUMBER_ID`: Your Vapi phone number ID (if using Vapi calls)
- `VAPI_ASSISTANT_ID`: Your Vapi assistant ID

**Twilio Configuration:**
- `TWILIO_ACCOUNT_SID`: Your Twilio Account SID
- `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token
- `TWILIO_PHONE_NUMBER`: Your Twilio phone number

### 4. Call Methods

The system supports three calling methods:

1. **Vapi Only**: Uses Vapi's built-in calling (requires Vapi phone number)
2. **Twilio Only**: Uses Twilio for calls with basic TwiML responses
3. **Hybrid**: Uses Twilio for calls + Vapi for AI conversation (recommended)

## Customization

### Interview Script

Modify the interview script in `.env.local`:

```bash
INSTRUCTIONS="Your custom interview script here..."
```

### Voice Settings

Change voice provider and voice ID:

```bash
VOICE_PROVIDER="elevenlabs"
VOICE_ID="your_voice_id"
```

### Call Flow

The system follows this flow:

1. **Greeting**: Warm greeting and identity confirmation
2. **Introduction**: Explain it's an automated interview
3. **Time Check**: Ask if they have 10-15 minutes
4. **Questions**: Ask structured interview questions
5. **Wrap-up**: Thank them and explain next steps

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Update webhook URL in Vapi dashboard

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Troubleshooting

### Common Issues

1. **Excel Upload Fails**: Check file format and column names
2. **Calls Not Initiating**: Verify Vapi API key and phone number ID
3. **Webhook Not Working**: Check webhook URL and authentication
4. **Voice Issues**: Verify voice provider settings

### Debug Mode

Enable debug logging by checking browser console and server logs.

## File Structure

```
app/
├── api/
│   ├── assistant/route.ts      # Vapi assistant configuration
│   ├── upload-excel/route.ts   # Excel file processing
│   ├── calls/route.ts          # Call queue management
│   ├── vapi-call/route.ts      # Vapi call initiation
│   └── vapi-webhook/route.ts   # Webhook handler
├── page.tsx                    # Main dashboard UI
└── layout.tsx                  # App layout
```

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review Vapi documentation
3. Check server logs for errors
4. Verify environment configuration

## License

This project is open source and available under the MIT License.

