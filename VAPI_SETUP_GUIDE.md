# Vapi Setup Guide - Fixing Key Issues

## 🚨 **Issue Found: Missing .env.local File**

Your Vapi keys are not being loaded because the `.env.local` file doesn't exist. Here's how to fix it:

## 📝 **Step 1: Create .env.local File**

Create a file named `.env.local` in your project root with the following content:

```bash
# Vapi Configuration
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
```

## 🔑 **Step 2: Get Your Vapi Keys**

1. **Go to Vapi Dashboard**: https://dashboard.vapi.ai
2. **Sign in** to your account
3. **Get your keys**:
   - **Private Key**: Go to Settings → API Keys → Copy Private Key
   - **Public Key**: Go to Settings → API Keys → Copy Public Key
   - **Phone Number ID**: Go to Phone Numbers → Copy the ID of your phone number ⚠️ **REQUIRED**
   - **Assistant ID**: Go to Assistants → Copy the ID of your assistant ⚠️ **REQUIRED**

## 📱 **Step 3: Get Your Twilio Keys**

1. **Go to Twilio Console**: https://console.twilio.com
2. **Sign in** to your account
3. **Get your credentials**:
   - **Account SID**: Found on the main dashboard
   - **Auth Token**: Found on the main dashboard (click to reveal)
   - **Phone Number**: Go to Phone Numbers → Manage → Active numbers → Copy your number

## 🗄️ **Step 4: Get Your Supabase Keys**

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Get your keys**:
   - **Project URL**: Go to Settings → API → Project URL
   - **Anon Key**: Go to Settings → API → Project API keys → anon public

## ✅ **Step 5: Test Your Configuration**

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Test Vapi connection**:
   - Go to your app: http://localhost:3000
   - Click "Settings" button
   - Click "Test Vapi" button
   - Check the results

## 🔍 **Common Issues & Solutions**

### **Issue 1: "VAPI_PRIVATE_KEY not configured"**
- **Cause**: Missing or incorrect `.env.local` file
- **Solution**: Create `.env.local` file with correct keys

### **Issue 2: "401 Unauthorized"**
- **Cause**: Invalid VAPI_PRIVATE_KEY
- **Solution**: Check your private key in Vapi dashboard

### **Issue 3: "403 Forbidden"**
- **Cause**: Key doesn't have required permissions
- **Solution**: Check your Vapi account permissions

### **Issue 4: "404 Not Found"**
- **Cause**: Invalid VAPI_PHONE_NUMBER_ID or VAPI_ASSISTANT_ID
- **Solution**: Check your phone number and assistant IDs

### **Issue 5: "Couldn't Get Phone Number. Need Either `phoneNumberId` Or `phoneNumber`"**
- **Cause**: Missing VAPI_PHONE_NUMBER_ID in environment variables
- **Solution**: Add VAPI_PHONE_NUMBER_ID to your .env.local file

### **Issue 6: Environment variables not loading**
- **Cause**: File not named correctly or in wrong location
- **Solution**: Ensure file is named `.env.local` and in project root

## 📋 **File Structure Check**

Your project should look like this:
```
vaapi/
├── .env.local          ← This file must exist
├── app/
├── lib/
├── public/
├── package.json
└── ...
```

## 🚀 **Quick Test Commands**

Test your setup with these URLs:
- **Vapi Test**: http://localhost:3000/api/vapi-test
- **Supabase Test**: http://localhost:3000/api/test-supabase
- **Main App**: http://localhost:3000

## 📞 **Need Help?**

If you're still having issues:
1. Check the browser console for errors
2. Check the terminal for server errors
3. Verify all keys are correct in their respective dashboards
4. Make sure `.env.local` is in the project root directory
5. Restart your development server after creating `.env.local`

## 🔒 **Security Note**

- Never commit `.env.local` to version control
- Keep your private keys secure
- Use different keys for development and production
