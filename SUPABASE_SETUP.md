# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - Name: `auto-caller-agent`
   - Database Password: (create a strong password)
   - Region: Choose closest to your location
6. Click "Create new project"

## 2. Get Your Supabase Credentials

1. Go to your project dashboard
2. Click on "Settings" in the sidebar
3. Click on "API"
4. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## 3. Set Up the Database Schema

1. In your Supabase dashboard, go to "SQL Editor"
2. Click "New query"
3. Copy and paste the contents of `supabase-schema.sql` from this project
4. Click "Run" to execute the SQL

This will create:
- `candidates` table for storing candidate data
- `call_configs` table for storing configuration
- Proper indexes and triggers
- Row Level Security policies

## 4. Configure Environment Variables

Create a `.env.local` file in your project root with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Vapi Configuration
VAPI_PRIVATE_KEY=your_vapi_private_key_here
VAPI_PUBLIC_KEY=your_vapi_public_key_here
VAPI_PHONE_NUMBER_ID=your_phone_number_id_here
VAPI_ASSISTANT_ID=your_assistant_id_here

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Other settings...
ASSISTANT_NAME="Interview Assistant"
MODEL_PROVIDER="openai"
MODEL_NAME="gpt-4o-mini"
VOICE_PROVIDER="elevenlabs"
VOICE_ID="adam"
TRANSCRIPTION_PROVIDER="deepgram"
TRANSCRIPTION_MODEL="nova-2"
TRANSCRIPTION_LANGUAGE="multi"
WEBHOOK_SECRET="change-me"
```

## 5. Install Dependencies

```bash
npm install
```

## 6. Test the Connection

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:3000`
3. Try uploading an Excel file - it should now save to Supabase
4. Check your Supabase dashboard > Table Editor > candidates to see the data

## 7. Database Features

### Real-time Updates
- Data changes are automatically synced across all connected clients
- No need to refresh the page to see updates

### Data Security
- Row Level Security (RLS) is enabled
- All data is encrypted in transit and at rest
- Automatic backups

### Scalability
- Handles thousands of candidates
- Automatic scaling based on usage
- No server maintenance required

## 8. Monitoring

- Go to Supabase Dashboard > Logs to see API calls
- Monitor database performance in the Dashboard
- Set up alerts for important events

## Troubleshooting

### Connection Issues
- Verify your environment variables are correct
- Check that your Supabase project is active
- Ensure the database schema was created successfully

### Permission Issues
- Make sure RLS policies are set up correctly
- Check that your anon key has the right permissions

### Data Not Saving
- Check the browser console for errors
- Verify the API routes are working
- Check Supabase logs for database errors

## Benefits of Supabase

✅ **Cloud Storage** - No local files to manage
✅ **Real-time Sync** - Updates across all devices
✅ **Automatic Backups** - Never lose your data
✅ **Scalable** - Grows with your needs
✅ **Secure** - Enterprise-grade security
✅ **Easy to Use** - Simple API and dashboard
