# Security Specification: Idea Vault

This document details the security model, invariants, and threat scenarios for the Idea Vault Firestore database.

## 1. Data Invariants

1. **Owner-Exclusive Isolation**: An Idea document must be owned by a valid user (`userId` match).
2. **Authenticated Operations**: All reads, writes, updates, and deletes must be initiated by an authenticated user whose email is verified.
3. **No Owner Hijacking / Spoofing**: An authenticated user cannot set the `userId` of an Idea document to a UID other than their own.
4. **Immutability of Key Fields**: Once created, `id`, `userId`, and `createdAt` cannot be altered.
5. **No System / Field Poisoning**: Updates can only modify allowed fields: `title`, `description`, `category`, `color`, and `isPinned`.
6. **Strict Field Types and Bounds**:
   - `title`: string, size <= 200 characters.
   - `description`: string, size <= 10000 characters.
   - `category`: string, must be one of the pre-defined categories.
   - `color`: string, size <= 50 characters.
   - `createdAt`, `updatedAt`: number (timestamp).
   - `isPinned`: boolean.
7. **Secure Lists**: Any list query must be restricted to the authenticated user's own items. No blanket read permissions.

---

## 2. The "Dirty Dozen" Payloads

Here are 12 specific payloads or operations designed to attempt breaches of data identity, integrity, and temporal consistency.

### Payload 1: Unauthorized Global Read (The Blanket Scan)
- **Attack**: Attempting a list query on `/ideas` without checking `resource.data.userId == request.auth.uid`.
- **Expected Outcome**: `PERMISSION_DENIED`

### Payload 2: Identity Spoofing (Write other user's data)
- **Attack**: Authenticated as `user_alice`, attempting to create an idea with `userId: "user_bob"`.
```json
{
  "title": "Stolen Startup Idea",
  "description": "Stealing some thoughts.",
  "category": "Startup",
  "color": "cyan",
  "createdAt": 1774888320000,
  "updatedAt": 1774888320000,
  "isPinned": false,
  "userId": "user_bob"
}
```
- **Expected Outcome**: `PERMISSION_DENIED`

### Payload 3: Owner Hijacking (Update owner to someone else)
- **Attack**: Authenticated as `user_bob`, attempting to update `userId` of their own idea to `user_alice` to orphan or leak it.
```json
{
  "userId": "user_alice"
}
```
- **Expected Outcome**: `PERMISSION_DENIED`

### Payload 4: Ghost Field Injection (Shadow Update)
- **Attack**: Authenticated as `user_bob`, attempting to write an idea with an undocumented administrative field `isAdminIdea`.
```json
{
  "title": "My Idea",
  "description": "Test description",
  "category": "Tech",
  "color": "cyan",
  "createdAt": 1774888320000,
  "updatedAt": 1774888320000,
  "isPinned": false,
  "userId": "user_bob",
  "isAdminIdea": true
}
```
- **Expected Outcome**: `PERMISSION_DENIED`

### Payload 5: Invalid Category Poisoning
- **Attack**: Attempting to write an idea with an undefined category `AdminMalicious`.
```json
{
  "title": "Bad Idea",
  "description": "Invalid category value",
  "category": "AdminMalicious",
  "color": "cyan",
  "createdAt": 1774888320000,
  "updatedAt": 1774888320000,
  "isPinned": false,
  "userId": "user_bob"
}
```
- **Expected Outcome**: `PERMISSION_DENIED`

### Payload 6: Denial of Wallet via Giant String Title
- **Attack**: Writing an idea where `title` is a 1MB string.
```json
{
  "title": "[REPEATED 'A' x 100000]",
  "description": "Too large",
  "category": "Tech",
  "color": "cyan",
  "createdAt": 1774888320000,
  "updatedAt": 1774888320000,
  "isPinned": false,
  "userId": "user_bob"
}
```
- **Expected Outcome**: `PERMISSION_DENIED`

### Payload 7: temporal Integrity Bypass (Fake CreatedAt)
- **Attack**: Writing an idea with a client-fabricated `createdAt` date representing the future or the past.
```json
{
  "title": "Time Traveler",
  "description": "Time travel",
  "category": "Tech",
  "color": "cyan",
  "createdAt": 2200000000000,
  "updatedAt": 1774888320000,
  "isPinned": false,
  "userId": "user_bob"
}
```
- **Expected Outcome**: `PERMISSION_DENIED`

### Payload 8: ID Poisoning (Junk Character ID)
- **Attack**: Attempting to create a document under `/ideas/{ideaId}` where `{ideaId}` is a 1.5KB string of malicious control symbols or SQL-injection style commands.
- **Expected Outcome**: `PERMISSION_DENIED`

### Payload 9: Unauthenticated Write
- **Attack**: Creating a document while `request.auth` is null.
- **Expected Outcome**: `PERMISSION_DENIED`

### Payload 10: Email Spoofing Attack (Unverified Email)
- **Attack**: Writing a document where `request.auth.token.email_verified` is `false`.
- **Expected Outcome**: `PERMISSION_DENIED`

### Payload 11: Immutable Field Mutation (Altering CreatedAt)
- **Attack**: Authenticated owner attempting to update the immutable `createdAt` field of an existing Idea.
```json
{
  "createdAt": 1234567890000
}
```
- **Expected Outcome**: `PERMISSION_DENIED`

### Payload 12: Read Someone Else's Specific Idea
- **Attack**: Authenticated user trying to fetch a single document `/ideas/idea-123` owned by a different user.
- **Expected Outcome**: `PERMISSION_DENIED`

---

## 3. Test Specification

Security rules are validated by running unit assertions demonstrating that all 12 scenarios are successfully blocked by the security policy.
