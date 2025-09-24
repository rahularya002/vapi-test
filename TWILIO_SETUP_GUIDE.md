# Twilio Setup Guide

This guide will help you set up Twilio for making phone calls in your application, including handling trial account limitations.

## Table of Contents
1. [Account Setup](#account-setup)
2. [Phone Number Verification](#phone-number-verification)
3. [Environment Variables](#environment-variables)
4. [Trial Account Limitations](#trial-account-limitations)
5. [Testing Your Setup](#testing-your-setup)
6. [Troubleshooting](#troubleshooting)

## Account Setup

### 1. Create a Twilio Account
1. Go to [Twilio Console](https://console.twilio.com/)
2. Sign up for a new account or log in
3. Complete the account verification process

### 2. Get Your Credentials
1. In the Twilio Console, go to the Dashboard
2. Find your **Account SID** and **Auth Token**
3. Copy these values for your environment variables

### 3. Purchase a Phone Number
1. Go to **Phone Numbers** > **Manage** > **Buy a number**
2. Choose a phone number with voice capabilities
3. Purchase the number (this will be your "from" number)

## Phone Number Verification

### Trial Account Limitations
- **Trial accounts can only call verified phone numbers**
- You must verify each phone number you want to call
- This is a security measure to prevent spam

### How to Verify Phone Numbers

#### Method 1: Via Twilio Console (Recommended)
1. Go to **Phone Numbers** > **Manage** > **Verified Caller IDs**
2. Click **Add a new number**
3. Enter the phone number you want to verify
4. Choose verification method (SMS or Call)
5. Enter the verification code when prompted

#### Method 2: Via API (Programmatic)
```bash
# Use our verification endpoint
curl -X POST http://localhost:3000/api/verify-phone \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+919953624529"}'
```

#### Method 3: Bulk Verification
1. Go to **Phone Numbers** > **Manage** > **Verified Caller IDs**
2. Click **Bulk Upload**
3. Upload a CSV file with phone numbers
4. Follow the verification process for each number

## Environment Variables

Add these to your `.env.local` file:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here

# Optional: Webhook URL for call status updates
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Trial Account Limitations

### What You Can't Do
- Call unverified phone numbers
- Make international calls (in some cases)
- Use certain advanced features

### What You Can Do
- Call verified phone numbers
- Use TwiML for call flows
- Receive webhooks for call status
- Use basic voice features

### Upgrading Your Account
1. Go to **Billing** in your Twilio Console
2. Add a payment method
3. Upgrade to a paid account
4. Remove verification requirements for most numbers

## Testing Your Setup

### 1. Test Phone Number Verification
```bash
# Check if a number is verified
curl -X GET http://localhost:3000/api/verify-phone
```

### 2. Test Call Endpoints

#### Hybrid Call (Twilio + Basic Interview)
```bash
curl -X POST http://localhost:3000/api/hybrid-call \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+919953624529",
    "candidateName": "John Doe"
  }'
```

#### Smart Call (Auto-fallback)
```bash
curl -X POST http://localhost:3000/api/smart-call \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+919953624529",
    "candidateName": "John Doe",
    "preferVapi": false
  }'
```

#### Vapi-Only Call (No Twilio)
```bash
curl -X POST http://localhost:3000/api/vapi-call \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+919953624529",
    "candidateName": "John Doe"
  }'
```

## Troubleshooting

### Common Errors

#### Error 21219: "The number is unverified"
**Solution:** Verify the phone number in your Twilio Console
```bash
# Check verification status
curl -X POST http://localhost:3000/api/verify-phone \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+919953624529"}'
```

#### Error 21211: "Invalid 'To' Phone Number"
**Solution:** Ensure the phone number is in E.164 format (+country_code_number)

#### Error 21214: "Invalid 'From' Phone Number"
**Solution:** Check your TWILIO_PHONE_NUMBER environment variable

### Debug Steps

1. **Check Environment Variables**
   ```bash
   # Verify all required variables are set
   echo $TWILIO_ACCOUNT_SID
   echo $TWILIO_AUTH_TOKEN
   echo $TWILIO_PHONE_NUMBER
   ```

2. **Test Twilio Connection**
   ```bash
   # Use the test endpoint
   curl -X GET http://localhost:3000/api/test-twilio
   ```

3. **Check Call Logs**
   - Go to **Monitor** > **Logs** > **Calls** in Twilio Console
   - Look for error details and status updates

### Alternative Solutions

If you continue having issues with Twilio trial accounts:

1. **Use Vapi-Only Calls**: Set `preferVapi: true` in smart-call endpoint
2. **Upgrade Twilio Account**: Remove verification requirements
3. **Use Different Provider**: Consider other telephony services

## Best Practices

1. **Always verify phone numbers** before making calls
2. **Use the smart-call endpoint** for automatic fallback
3. **Monitor your call logs** for debugging
4. **Set up proper webhooks** for call status tracking
5. **Test with verified numbers** first

## Support

- [Twilio Documentation](https://www.twilio.com/docs)
- [Twilio Support](https://support.twilio.com/)
- [Trial Account Guide](https://www.twilio.com/docs/usage/tutorials/how-to-use-your-free-trial-account)
