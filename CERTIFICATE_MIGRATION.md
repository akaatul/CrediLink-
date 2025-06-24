# Certificate Migration Guide

## Background

CrediLink+ has updated its certificate storage system to use the standardized `credentials` collection instead of the legacy `certificates` collection. This change ensures better compatibility with the platform's credential verification system and improves certificate management.

If you're experiencing any of these issues:
- Certificate not found errors after completing courses
- Missing certificates in your dashboard
- Error messages mentioning "Certificate not found: [certificateId]"

This migration guide will help resolve those issues.

## Migration Process

The platform includes a migration script that will:
1. Transfer all certificates from the legacy `certificates` collection to the new `credentials` collection
2. Ensure all certificates are properly linked to user profiles
3. Correct any missing fields in the certificate data

## Running the Migration

### Prerequisites
- Node.js installed
- Access to Firebase project credentials (via .env file)

### Steps

1. Ensure your Firebase environment variables are set up correctly in your `.env` file:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

2. Run the migration script:
   ```bash
   npm run migrate-certificates
   ```

3. Check the console output for migration results:
   - The script will display how many certificates were successfully migrated
   - If any certificates couldn't be migrated, their IDs and error reasons will be shown

## After Migration

Once the migration is complete:
1. Refresh your certificates page
2. Users should now see all their previously earned certificates
3. New certificates will be automatically stored in the correct collection

## Troubleshooting

If you encounter any issues during migration:

1. Check that your Firebase credentials are correct
2. Verify that your Firebase rules allow read/write access to both collections
3. If specific certificates are failing to migrate, check their structure in Firebase Console

## Safety Measures

The migration script takes these safety precautions:
- Original certificate data is not deleted
- Existing certificates in the new collection are not overwritten
- User profiles are updated only if necessary

## Technical Details

For developers who want to understand the migration in depth:

### Schema Changes
- Added required `issuerId` field
- Standardized `skills` array
- Ensured proper date handling for `issueDate` and `expiryDate`

### Collection Access
The application has been updated to check both collections during the transition period:
- First tries the new `credentials` collection
- Falls back to the legacy `certificates` collection if needed

This dual-collection access ensures backward compatibility while the system transitions to the new structure. 