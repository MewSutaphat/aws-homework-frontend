# Application Flow Documentation

## Overview

**Base API URL:** `https://d9tej631xf.execute-api.ap-southeast-7.amazonaws.com/prod/`

**Region:** `ap-southeast-7`

### API Endpoints Summary

| # | Action | Method | Endpoint | Auth Required | Request Body |
|---|--------|--------|----------|:---:|---|
| 1 | Sign Up | POST | `/auth/signup` | No | `{ name, email, password, group }` |
| 2 | Confirm Account | POST | `/auth/confirm` | No | `{ email, code }` |
| 3 | Login | POST | `/auth/login` | No | `{ email, password }` |
| 4 | Logout | POST | `/auth/logout` | Bearer accessToken | — |
| 5 | Create Note | POST | `/notes/create` | Bearer idToken | `{ name, noteId, noteMsg }` |
| 6 | Read All Notes | POST | `/notes/readAll` | Bearer idToken | `{ name }` |
| 7 | Edit Note | POST | `/notes/edit` | Bearer idToken | `{ name, noteId, noteMsg }` |
| 8 | Delete Note | POST | `/notes/delete` | Bearer idToken | `{ name, noteId }` |

---

## Case 1: Sign Up Flow

### API Details

| | |
|---|---|
| **Endpoint** | `POST /auth/signup` |
| **Lambda** | `sign-up` |
| **Auth** | None |
| **Request Body** | `{ email: string, password: string, name: string, group: string }` |
| **Success Response** | `200 { message: "Sign up successful. Please check your email for a verification code." }` |
| **Error Response** | `400 { message: "<Cognito error>" }` |

**Password policy:** min 8 characters, must contain uppercase, lowercase, and digits.

### Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Web Application
    participant APIGW as API Gateway
    participant Lambda as Lambda
    participant Cognito as AWS Cognito

    User->>Frontend: Open login page
    Frontend-->>Frontend: Display login form

    User->>Frontend: Click "Create an account"
    Frontend->>Frontend: Switch to signup form

    User->>Frontend: Fill in Name, Email, Password, Group
    User->>Frontend: Click Submit

    Frontend->>APIGW: Submit signup request
    APIGW->>Lambda: Forward request to sign-up handler

    Lambda->>Cognito: Create new account with email & password
    Cognito-->>Lambda: Account created (pending email verification)
    Cognito--)User: Send verification code to email

    Lambda-->>APIGW: Sign-up successful
    APIGW-->>Frontend: Sign-up successful

    Frontend-->>User: Show success message
    Frontend->>Frontend: Switch to confirm form

    
```

### Simple Flow

```
[Signup Form]
    │
    ├── Fill in Name / Email / Password / Group
    │
    ▼
POST /auth/signup → Lambda → Cognito SignUp
    │
    ├── Success ──► Show success message ──► Switch to Confirm form
    │                                        (Cognito sends OTP to email)
    └── Error ───► Show error message
```

---

## Case 2: Confirm Account Flow

### API Details

| | |
|---|---|
| **Endpoint** | `POST /auth/confirm` |
| **Lambda** | `confirm-sign-up` |
| **Auth** | None |
| **Request Body** | `{ email: string, code: string }` |
| **Success Response** | `200 { message: "Account confirmed successfully.", userId: <number> }` |
| **Error Response** | `400 { message: "<Cognito error>" }` |

**Side effects on success:**
- Assigns a sequential `userId` and appends the user to `userList.txt` in S3.
- Subscribes the user's email to the SNS topic for future notifications.

### Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Web Application
    participant APIGW as API Gateway
    participant Lambda as Lambda
    participant Cognito as AWS Cognito
    participant S3 as AWS S3
    participant SNS as AWS SNS

    User--)User: Receive OTP verification code in email

    User->>Frontend: Enter email + verification code
    User->>Frontend: Click Submit

    Frontend->>APIGW: Submit confirmation request
    APIGW->>Lambda: Forward request to confirm-sign-up handler

    Lambda->>Cognito: Verify confirmation code
    Cognito-->>Lambda: Code verified — account activated

    Lambda->>Lambda: Assign next available user ID

    Lambda->>S3: Add new user entry to the user list file
    S3-->>Lambda: Registry updated

    Lambda->>SNS: Register email for notifications
    SNS--)User: Send notification subscription confirmation

    Lambda-->>APIGW: Account confirmed — return assigned user ID
    APIGW-->>Frontend: Confirmation successful

    Frontend-->>User: Show "Confirmed!"
    Frontend->>Frontend: Switch to login form
```

### Simple Flow

```
[Receive OTP from Email]
    │
    ▼
[Confirm Form] — Fill in Email + Code
    │
    ▼
POST /auth/confirm → Lambda
    │
    ├── Cognito: ConfirmSignUp (verify OTP)
    ├── Cognito: AdminGetUser (get name, group)
    ├── S3: Read userList.txt → calculate next userId
    ├── S3: Write userList.txt → append new user entry
    └── SNS: Subscribe user email to notification topic
    │
    ├── Success ──► Show "Confirmed!" ──► Switch to Login form
    └── Error ───► Show error message
```

---

## Case 3: Login Flow

### API Details

| | |
|---|---|
| **Endpoint** | `POST /auth/login` |
| **Lambda** | `login` |
| **Auth** | None |
| **Request Body** | `{ email: string, password: string }` |
| **Success Response** | `200 { accessToken, idToken, refreshToken }` |
| **Error Response** | `401 { message: "<Cognito error>" }` |

**Token usage:**
- `idToken` — sent as `Authorization` header for all protected `/notes/*` endpoints.
- `accessToken` — sent as `Authorization` header for logout only.
- `refreshToken` — stored for session refresh (not yet implemented in frontend).

### Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Web Application
    participant Storage as Local Storage
    participant APIGW as API Gateway
    participant Lambda as Lambda
    participant Cognito as AWS Cognito

    User->>Frontend: Fill in email + password
    User->>Frontend: Click Login

    Frontend->>APIGW: Submit login request
    APIGW->>Lambda: Forward request to login handler

    Lambda->>Cognito: Authenticate with email & password
    Cognito-->>Lambda: Return session tokens

    Lambda-->>APIGW: Login successful
    APIGW-->>Frontend: Return session tokens

    Frontend->>Frontend: Read username from session token

    Frontend->>Storage: Save session token
    Frontend->>Storage: Save access token
    Frontend->>Storage: Save email

    Frontend-->>User: Login successful
    Frontend->>Frontend: Redirect to main app
```

### Simple Flow

```
[Login Form] — Fill in Email + Password
    │
    ▼
POST /auth/login → Lambda → Cognito InitiateAuth
    │
    ├── Success ──► Save idToken + accessToken to localStorage ──► Go to /create
    └── Error ───► Show error message
```

---

## Case 4: Guest Access Flow

### Sequence Diagram

```mermaid
sequenceDiagram
    actor Guest
    participant Frontend as Web Application
    participant Storage as Local Storage
    participant Dialog as Guest Dialog

    Guest->>Frontend: Click "Continue as Guest"
    Frontend->>Storage: Mark session as guest
    Frontend->>Frontend: Check access permission (guest allowed)
    Frontend-->>Guest: Access granted
    Frontend->>Frontend: Redirect to main app

    Guest->>Frontend: Attempt to perform an action
    Frontend->>Frontend: Detect guest session
    Frontend->>Dialog: Show guest warning

    Dialog-->>Guest: "Please login to use this feature"

    alt Click "Go to Login"
        Guest->>Storage: Clear guest flag
        Frontend->>Frontend: Redirect to login page
    else Click "Close"
        Dialog-->>Guest: Close dialog
    end
```

### Simple Flow

```
[Login Page]
    │
    ├── Click "Continue as Guest"
    │
    ▼
sessionStorage['guest'] = 'true'
    │
    ▼
[Protected Pages] (accessible — but actions blocked)
    │
    ├── Attempt Create / Edit / Delete
    │       └──► GuestDialog ──► "Go to Login" or "Close"
    │
    └── Show All Notes
            └──► Skip data loading (no data displayed)
```

> Guest mode is frontend-only. No API calls are made for guests attempting note operations.

---

## Case 5: Note Operations (Authenticated Users)

### API Details — Create Note

| | |
|---|---|
| **Endpoint** | `POST /notes/create` |
| **Lambda** | `create-notes` |
| **Auth** | `Authorization: <idToken>` (Cognito Authorizer) |
| **Request Body** | `{ name: string, noteId: string, noteMsg: string }` |
| **Success Response** | `200 { message: "Note created successfully", userId, noteId }` |
| **Error Response** | `404 { message: "User '...' not found" }` |
| **Side effect** | Publishes SNS notification to the user's email |

### API Details — Read All Notes

| | |
|---|---|
| **Endpoint** | `POST /notes/readAll` |
| **Lambda** | `read-all-note` |
| **Auth** | `Authorization: <idToken>` (Cognito Authorizer) |
| **Request Body** | `{ name: string }` |
| **Success Response** | `200 { userId, notes: [ { userId, noteId, noteContent } ] }` |
| **Error Response** | `404 { message: "User '...' not found" }` |

### API Details — Edit Note

| | |
|---|---|
| **Endpoint** | `POST /notes/edit` |
| **Lambda** | `edit-note` |
| **Auth** | `Authorization: <idToken>` (Cognito Authorizer) |
| **Request Body** | `{ name: string, noteId: string, noteMsg: string }` |
| **Success Response** | `200 { message: "Note updated successfully", userId, noteId }` |
| **Error Response** | `404 { message: "User/Note not found" }` |

### API Details — Delete Note

| | |
|---|---|
| **Endpoint** | `POST /notes/delete` |
| **Lambda** | `delete-notes` |
| **Auth** | `Authorization: <idToken>` (Cognito Authorizer) |
| **Request Body** | `{ name: string, noteId: string }` |
| **Success Response** | `200 { message: "Note deleted successfully", noteId }` |
| **Error Response** | `400/404/500` with error message |

### Sequence Diagram — Create Note

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Web Application
    participant APIGW as API Gateway
    participant Lambda as Lambda
    participant S3 as AWS S3
    participant DynamoDB as AWS DynamoDB
    participant SNS as AWS SNS

    User->>Frontend: Open create note page

    User->>Frontend: Fill in note ID + note content
    User->>Frontend: Click Submit

    Frontend->>APIGW: Submit create note request (with auth token)

    APIGW->>APIGW: Verify user is authenticated
    APIGW->>Lambda: Forward request to create-notes handler

    Lambda->>S3: Read user list file
    S3-->>Lambda: User list data

    Lambda->>Lambda: Look up user ID by username

    alt User not found
        Lambda-->>APIGW: User does not exist
        APIGW-->>Frontend: Error response
        Frontend-->>User: Show error dialog
    else User found
        Lambda->>DynamoDB: Save note to database
        DynamoDB-->>Lambda: Note saved

        Lambda->>Lambda: Get user email from token
        Lambda->>SNS: Send note creation notification

        SNS--)User: Email — note created successfully

        Lambda-->>APIGW: Note created successfully
        APIGW-->>Frontend: Success response
        Frontend-->>User: Show success dialog
    end
```

### Sequence Diagram — Read / Edit / Delete Note

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Web Application
    participant APIGW as API Gateway
    participant Lambda as Lambda
    participant S3 as AWS S3
    participant DynamoDB as AWS DynamoDB

    User->>Frontend: Perform read / edit / delete action

    Frontend->>APIGW: Submit request with auth token

    APIGW->>APIGW: Verify user is authenticated
    APIGW->>Lambda: Forward request to handler

    Lambda->>S3: Read user registry
    S3-->>Lambda: User list data

    Lambda->>Lambda: Look up user ID by username

    alt User not found
        Lambda-->>APIGW: User does not exist
    else User found
        Note over Lambda,DynamoDB: Read All → Fetch all notes for this user<br/>Edit → Check note exists → Update note content<br/>Delete → Check note exists → Remove note
        Lambda->>DynamoDB: Perform operation on database
        DynamoDB-->>Lambda: Operation result
        Lambda-->>APIGW: Success response
    end

    APIGW-->>Frontend: Response
    Frontend-->>User: Show result dialog
```

---

## Case 6: Logout Flow

### API Details

| | |
|---|---|
| **Endpoint** | `POST /auth/logout` |
| **Lambda** | `logout` |
| **Auth** | `Authorization: <accessToken>` (raw token, no "Bearer" prefix) |
| **Request Body** | None |
| **Success Response** | `200 { message: "Logged out successfully." }` |
| **Error Response** | `400 { message: "<Cognito error>" }` |

**Effect:** Calls Cognito `GlobalSignOut` — invalidates all tokens (access, id, refresh) across all sessions.

### Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Web Application
    participant Storage as Local Storage
    participant APIGW as API Gateway
    participant Lambda as Lambda
    participant Cognito as AWS Cognito

    User->>Frontend: Click "Logout"

    Frontend->>Storage: Load access token
    Frontend->>APIGW: Submit logout request (with access token)
    APIGW->>Lambda: Forward request to logout handler

    Lambda->>Cognito: Invalidate all active sessions
    Cognito-->>Lambda: All sessions ended

    Lambda-->>APIGW: Logout successful
    APIGW-->>Frontend: Logout successful

    Frontend->>Storage: Clear session token
    Frontend->>Storage: Clear access token
    Frontend->>Storage: Clear saved email

    Frontend-->>User: Logout successful
    Frontend->>Frontend: Redirect to login page
```

---

## Full Application Flow Overview

![Application Auth Flow](./app_auth_flow_diagram.svg)

---

## Backend Architecture Summary

```
Client (Vue.js Frontend)
  └─► AWS API Gateway (REST API — note-api)
        │
        ├── /auth/* (no auth)
        │     ├── POST /signup   → Lambda: sign-up       → Cognito: SignUp
        │     ├── POST /confirm  → Lambda: confirm-sign-up→ Cognito + S3 + SNS
        │     ├── POST /login    → Lambda: login          → Cognito: InitiateAuth
        │     └── POST /logout   → Lambda: logout         → Cognito: GlobalSignOut
        │
        └── /notes/* (Cognito JWT Authorizer)
              ├── POST /create   → Lambda: create-notes  → S3 + DynamoDB + SNS
              ├── POST /readAll  → Lambda: read-all-note → S3 + DynamoDB
              ├── POST /edit     → Lambda: edit-note     → S3 + DynamoDB
              └── POST /delete   → Lambda: delete-notes  → S3 + DynamoDB

AWS Services:
  - Cognito User Pool  : User registration, verification, authentication
  - S3 (userList.txt)  : User registry — maps userId ↔ userName ↔ Group
  - DynamoDB           : Note storage (PK: userId, SK: noteId)
  - SNS                : Email notifications (account confirmed, note created)
```
