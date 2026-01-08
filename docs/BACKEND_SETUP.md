# Directus Backend Configuration Guide

## Overview

This document outlines the backend setup required for the authentication system in the Gesangbuch Ionic app. The system uses a simplified registration flow where users provide their activation code during registration, and accounts are automatically activated if the code is valid.

## Authentication Flow

1. **User Registration**: User provides email, password, and activation code
2. **Code Validation**: Custom Directus endpoint validates the activation code
3. **Account Creation**: If code is valid (200 response), user account is created with "activated" role
4. **Auto-Login**: User is automatically logged in after successful registration
5. **Data Access**: User can immediately download and access songs

## Required Directus Configuration

### 1. User Roles

Create two roles in Directus:

#### Public Role (Default for unauthenticated users)

-   No permissions to access songs or files
-   Can only access registration endpoint

#### Activated Role

-   Assigned to all registered users (via the custom registration endpoint)
-   Full permissions to read songs and files
-   Can download and sync content

### 2. Custom Registration Endpoint

You need to create a custom endpoint that handles registration with activation code validation.

#### Registration Endpoint

**Path:** `/custom/register`  
**Method:** POST  
**Request Body:**

```json
{
    "email": "user@example.com",
    "password": "securepassword",
    "code": "XXXX-XXXX-XXXX",
    "first_name": "John",
    "last_name": "Doe"
}
```

**Success Response (200):**

```json
{
    "success": true,
    "message": "Account created and activated"
}
```

**Error Response (400):**

```json
{
    "success": false,
    "message": "Invalid activation code"
}
```

**Implementation: Custom API Extension**

Create a custom endpoint extension in your Directus instance:

```js
// extensions/endpoints/register/index.js
export default {
    id: "register",
    handler: (router, { services, exceptions }) => {
        router.post("/", async (req, res) => {
            const { email, password, code, first_name, last_name } = req.body;
            const { UsersService } = services;
            const { database } = req;

            try {
                // Validate activation code
                const validCode = await database("activation_codes")
                    .where({ code, used: false })
                    .whereRaw("(expires_at IS NULL OR expires_at > NOW())")
                    .first();

                if (!validCode) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid or expired activation code",
                    });
                }

                // Get the "activated" role UUID
                const activatedRole = await database("directus_roles")
                    .where({ name: "activated" })
                    .first();

                if (!activatedRole) {
                    throw new Error("Activated role not found in Directus");
                }

                // Create user with activated role
                const usersService = new UsersService({ schema: req.schema });
                const newUser = await usersService.createOne({
                    email,
                    password,
                    first_name,
                    last_name,
                    role: activatedRole.id,
                    status: "active",
                });

                // Mark activation code as used
                await database("activation_codes")
                    .where({ id: validCode.id })
                    .update({
                        used: true,
                        used_at: new Date(),
                        used_by: newUser,
                    });

                return res.json({
                    success: true,
                    message: "Account created and activated",
                });
            } catch (error) {
                console.error("Registration error:", error);

                // Handle duplicate email
                if (
                    error.message?.includes("unique") ||
                    error.code === "RECORD_NOT_UNIQUE"
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "Email already registered",
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: "Registration failed",
                });
            }
        });
    },
};
```

### 3. Activation Codes Collection

Create a collection named `activation_codes` with the following fields:

-   `id` (UUID, Primary Key)
-   `code` (String, Unique, Required) - The activation code (e.g., "XXXX-XXXX-XXXX")
-   `used` (Boolean, Default: false) - Whether code has been used
-   `created_at` (Timestamp, Auto-generated)
-   `expires_at` (Timestamp, Optional, Nullable) - Code expiration date
-   `used_at` (Timestamp, Optional, Nullable) - When the code was used
-   `used_by` (UUID, Optional, Nullable) - Foreign key to directus_users
-   `notes` (Text, Optional) - Admin notes about the code

**Indexes:**

-   Unique index on `code`
-   Index on `used` for faster queries

### 4. Permissions

Configure role permissions:

#### Public Role (Unauthenticated)

-   Access to `/custom/register` endpoint (handled by the extension)
-   Access to `/auth/login` (Directus built-in)
-   Access to `/auth/password/request` and `/auth/password/reset`
-   No access to any collections

#### Activated Role

-   `directus_users`: Read (own), Update (own)
-   `gesangbuchlied`: Read All
-   `directus_files`: Read All (for assets)
-   Other related collections (authors, categories, etc.): Read All
-   No access to `activation_codes` collection

### 5. Email Templates (Password Reset Only)

Configure email templates in Directus Settings > Email Templates:

#### Password Reset Email

-   Subject: "Passwort zurücksetzen - Johannisches Gesangbuch"
-   Template: Include reset link with token
-   Note: Email verification is NOT needed for registration

### 6. Environment Variables

Ensure your Directus instance has email configured for password reset:

```env
EMAIL_FROM="noreply@yourchurch.org"
EMAIL_TRANSPORT="smtp"
EMAIL_SMTP_HOST="smtp.yourprovider.com"
EMAIL_SMTP_PORT="587"
EMAIL_SMTP_USER="your-smtp-user"
EMAIL_SMTP_PASSWORD="your-smtp-password"
```

## Frontend Configuration

Update your `.env` file in the Ionic app:

```env
VITE_BACKEND_URL=https://your-directus-instance.com
VITE_AUTH_TOKEN=your-static-admin-token-for-fallback
```

## Activation Code Management

### Generating Activation Codes

You can generate activation codes in several ways:

1. **Manual Entry in Directus Admin:**

    - Go to Activation Codes collection
    - Click "Create Item"
    - Enter a unique code (e.g., "ABCD-EFGH-IJKL-MNOP")
    - Optionally set an expiration date

2. **Batch Generation Script:**

```js
// Generate 100 random activation codes
const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const segments = 4;
    const segmentLength = 4;

    return Array(segments)
        .fill()
        .map(() =>
            Array(segmentLength)
                .fill()
                .map(() => chars[Math.floor(Math.random() * chars.length)])
                .join("")
        )
        .join("-");
};

// Insert into Directus via API
for (let i = 0; i < 100; i++) {
    await directus.items("activation_codes").createOne({
        code: generateCode(),
        used: false,
        expires_at: null, // or set an expiration date
    });
}
```

3. **Directus Flow Automation:**
    - Create a Flow that generates codes on demand
    - Trigger via webhook or manual operation

## Testing

### 1. Create Test Activation Code

```sql
INSERT INTO activation_codes (id, code, used, created_at)
VALUES (
  uuid(),
  'TEST-CODE-1234',
  false,
  NOW()
);
```

### 2. Test Registration Flow

1. Open the app and navigate to Registration
2. Enter activation code: `TEST-CODE-1234`
3. Enter email: `test@example.com`
4. Enter password: `Test1234!`
5. Submit form

**Expected Result:**

-   User account created with "activated" role
-   Code marked as used in database
-   User automatically logged in
-   Can access songs immediately

### 3. Test Invalid Code

1. Try registering with code: `INVALID-CODE`
2. Should receive error: "Invalid or expired activation code"

### 4. Test Used Code

1. Try registering again with: `TEST-CODE-1234`
2. Should receive error: "Invalid or expired activation code"

### 5. Test Password Reset

1. Click "Forgot Password" on login screen
2. Enter email
3. Check email for reset link
4. Use token to reset password

## Development Mode

The app includes a "Skip for Now" button on login/register screens for development purposes. This bypasses authentication completely.

To disable in production, remove these buttons from:

-   `src/views/LoginPage.vue`
-   `src/views/RegisterPage.vue`

## Security Recommendations

1. **Use HTTPS:** Always use HTTPS for your Directus instance
2. **Strong Passwords:** Enforce strong password policies in Directus (min 8 characters)
3. **Token Expiration:** Configure appropriate token expiration (default: 15 minutes)
4. **Rate Limiting:** Enable rate limiting on registration and login endpoints
5. **Code Complexity:** Use complex activation codes (16+ characters with 4 segments)
6. **Code Expiration:** Set expiration dates on activation codes (e.g., 90 days)
7. **Audit Logging:** Enable Directus activity logging to track registrations
8. **Monitor Usage:** Regularly check for unused codes or suspicious patterns
9. **Code Distribution:** Only share codes via secure channels
10. **Backup Codes:** Keep a secure backup of all generated codes

## Troubleshooting

### Issue: "Registration failed"

-   **Check:** Custom `/custom/register` endpoint is properly installed
-   **Check:** Activation codes collection exists
-   **Check:** "activated" role exists in Directus
-   **Verify:** Directus logs for specific error messages

### Issue: "Invalid activation code"

-   **Check:** Code exists in `activation_codes` table
-   **Check:** Code has `used = false`
-   **Check:** Code hasn't expired (`expires_at` is null or future date)
-   **Verify:** Code matches exactly (case-sensitive)

### Issue: "Email already registered"

-   User tried to register with existing email
-   They should use "Forgot Password" to reset their password instead

### Issue: Can't access songs after registration

-   **Check:** User's role is set to "activated" (not default "user")
-   **Check:** "activated" role has read permissions for songs/files
-   **Verify:** Token is valid and not expired

### Issue: "Failed to fetch songs from server"

-   **Check:** User is logged in (token exists)
-   **Check:** Token hasn't expired
-   **Check:** GraphQL endpoint is accessible
-   **Verify:** Permissions are correctly set for activated role
