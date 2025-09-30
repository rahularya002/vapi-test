# Deployment Checklist

## Pre-Deployment

- [ ] Set up VAPI account and get credentials
- [ ] Configure environment variables
- [ ] Test VAPI assistant connection
- [ ] Verify phone number in VAPI

## Environment Variables Required

```env
VAPI_PRIVATE_KEY=your_vapi_private_key
VAPI_PHONE_NUMBER_ID=your_vapi_phone_number_id
VAPI_ASSISTANT_ID=your_vapi_assistant_id
```

## Optional (for data persistence)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Deployment Steps

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm start
   ```

3. **Verify deployment**:
   - Check `/api/health` endpoint
   - Test VAPI assistant connection
   - Upload sample candidates
   - Make test call

## Production Notes

- All Twilio code removed - uses VAPI only
- No setup guides included - production ready
- Clean API structure with only necessary endpoints
- Optimized for VAPI assistant usage
