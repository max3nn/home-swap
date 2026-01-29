# HomeSwap Platform - Use Case Diagrams

## 1. User Authentication & Account Creation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant W as Web Browser
    participant S as Express Server
    participant DB as MongoDB
    participant SESS as Session Store

    Note over U,SESS: Registration Process
    U->>W: Fill registration form (name, email, password)
    W->>S: POST /auth/register
    S->>S: Validate form data
    S->>DB: Check if user exists

    alt User exists
        DB-->>W: "User already exists" error
    else New user
        S->>DB: Create User with hashed password
        DB-->>W: Registration successful
    end

    Note over U,SESS: Login Process
    U->>W: Enter login credentials
    W->>S: POST /auth/login
    S->>DB: Find user and verify password

    alt Valid credentials
        S->>SESS: Create session
        S-->>W: Login successful, redirect to /search
    else Invalid credentials
        S-->>W: "Invalid credentials" error
    end

    Note over U,SESS: Protected Routes
    U->>W: Access protected route
    W->>S: Request protected resource
    S->>SESS: Check session

    alt Authenticated
        S-->>W: Serve protected content
    else Not authenticated
        S-->>W: Redirect to /auth/login
    end

    Note over U,SESS: Logout
    U->>W: Click logout
    W->>S: POST /auth/logout
    S->>SESS: Destroy session
    S-->>W: Logged out
```

## 2. Item Creation Feature Flow

```mermaid
sequenceDiagram
    participant U as User
    participant W as Web Browser
    participant S as Express Server
    participant DB as MongoDB

    Note over U,DB: Item Creation Process
    U->>W: Fill item form (title, description, image)
    W->>S: POST /items/new with image upload
    S->>S: Check authentication & validate form

    alt Validation fails
        S-->>W: Show validation errors
    else Validation passes
        S->>S: Process image to memory buffer
        S->>DB: Item.create() with image data
        DB-->>S: Item created with unique ID
        S-->>W: Redirect to /search with success
    end

    Note over U,DB: Item Display
    U->>W: Browse search page
    W->>S: GET /search
    S->>DB: Find items with owner names
    DB-->>S: Items with image URLs
    S-->>W: Render search results

    W->>S: GET /items/:itemId/image
    S->>DB: Fetch image binary data
    DB-->>S: Image buffer
    S-->>W: Serve image
    W-->>U: Display item with image

    Note over U,DB: Item Management
    U->>W: Edit item
    W->>S: POST /items/:itemId/edit
    S->>S: Verify ownership & validate
    S->>DB: Update item with new data
    DB-->>S: Item updated
    S-->>W: Redirect with success
```

## 3. Swap Request Feature Flow

```mermaid
sequenceDiagram
    participant U as User (Requester)
    participant W as Web Browser
    participant S as Express Server
    participant DB as MongoDB
    participant O as Owner

    Note over U,O: Swap Request Process
    U->>W: Browse search page
    W->>S: GET /search
    S->>DB: Find items with owner names & swap status
    DB-->>S: Items with swap information
    S-->>W: Display items with "Request Swap" buttons

    U->>W: Click "Request Swap" and fill form
    W->>S: POST /swaps/request/:itemId
    S->>S: Validate request & check authentication
    S->>DB: Find target item & user's offered items

    alt Create new item or use existing
        S->>DB: Create/find offered item
    end

    S->>DB: SwapRequest.create() with swap details
    DB-->>S: Swap request created
    S-->>W: Redirect with success message

    Note over O,DB: Owner Reviews Request
    O->>W: Visit received requests
    W->>S: GET /swaps/received
    S->>DB: Find swap requests for owner's items
    DB-->>S: Swap requests with item/user details
    S-->>W: Display pending requests

    O->>W: Accept or reject request
    W->>S: POST /swaps/:requestId/respond
    S->>S: Verify ownership

    alt Accept request
        S->>DB: Update swap status to 'accepted'
        S->>DB: Mark both items as 'swapped'
        S->>DB: Reject other pending requests
    else Reject request
        S->>DB: Update swap status to 'rejected'
    end

    DB-->>S: Updates completed
    S-->>W: Redirect with confirmation
    W-->>O: Show action result
```

## Key Components Explained

### Authentication Components:

- **Express Routes**: `/register`, `/login`, `/logout`
- **Middleware**: Session validation on protected routes
- **Security**: BCrypt password hashing
- **Session Management**: Express-session with MongoDB store
- **Models**: `User` model with unique constraints
- **Validation**: Form validation and duplicate user checks

### Item Creation Components:

- **Express Routes**: `/items/new`, `/items/:itemId/edit`, `/items/:itemId/image`
- **Models**: `Item` with embedded image binary data
- **Views**: `item-new.ejs`, `item-edit.ejs`, `account.ejs`
- **File Upload**: Multer with memoryStorage() for 10MB limit, image-only filter
- **Image Storage**: Binary data stored in MongoDB `image.data` field as Buffer
- **Image Serving**: Dynamic route `/items/:itemId/image` serves from database
- **Content Type Detection**: Sniffs image headers for proper MIME types
- **Validation**: Form validation, required fields, category selection
- **ObjectId Generation**: Unique item identifiers using mongoose ObjectId
- **Authentication**: Protected routes requiring login session
- **Cache Control**: No-cache headers for immediate image updates

### Swap Feature Components:

- **Express Routes**: `/swaps/request/:itemId`, `/swaps/received`, `/swaps/:requestId/respond`
- **Models**: `SwapRequest`, `Item`, `User`
- **Views**: `search.ejs`, `swap-request.ejs`, `swap-received.ejs`
- **File Upload**: Multer middleware for swap offer images
- **Status Management**: Pending → Accepted/Rejected workflow

### Database Schema Integration:

- **Users**: `userId` (UUID), `username`, `email`, `password` (hashed)
- **Items**: `itemId`, `ownerId`, `status`, `hasPendingSwaps`
- **SwapRequests**: `requesterId`, `itemId`, `offeredItemId`, `status`, `createdAt`
- **Indexes**: Optimized queries for user lookups and swap status checks
