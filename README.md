# VAPI Assistant Call System

A production-ready call management system using VAPI (Voice AI Platform) for automated candidate interviews.

## Features

- **VAPI Integration**: Direct integration with VAPI assistants
- **Excel Upload**: Bulk candidate import from Excel files
- **Call Management**: Queue management and call history
- **Assistant Configuration**: Direct VAPI assistant usage
- **Real-time Updates**: Live call status and webhook handling

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# VAPI Configuration
VAPI_PRIVATE_KEY=your_vapi_private_key
VAPI_PHONE_NUMBER_ID=your_vapi_phone_number_id
VAPI_ASSISTANT_ID=your_vapi_assistant_id

# Supabase Configuration (Optional)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Deployment

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set Environment Variables**:
   - Configure VAPI credentials
   - Optionally configure Supabase for data persistence

3. **Deploy**:
   ```bash
   npm run build
   npm start
   ```

## Usage

1. **Upload Candidates**: Use the Upload tab to import candidate data from Excel
2. **Configure Assistant**: Use the Assistant tab to connect your VAPI assistant
3. **Make Calls**: Add candidates to queue and initiate calls
4. **Monitor**: Track call history and status

## API Endpoints

- `POST /api/vapi-call` - Initiate VAPI calls
- `POST /api/vapi-webhook` - Handle VAPI webhooks
- `GET /api/vapi-assistant` - Manage VAPI assistants
- `POST /api/upload-excel` - Upload candidate data
- `GET /api/calls` - Get call history
- `POST /api/call-response` - Handle call responses

## Requirements

- Node.js 18+
- VAPI account with configured assistant
- Twilio number imported to VAPI (optional)

## License

MIT