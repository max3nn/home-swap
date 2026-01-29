# HomeSwap Platform - Use Case Diagrams

## 1. Swap Request Feature Flow

```mermaid
sequenceDiagram
    participant U as User (Requester)
    participant W as Web Browser
    participant S as Express Server
    participant DB as MongoDB
    participant O as Owner
    participant N as Notification System

    Note over U,N: Item Swap Request Process

    U->>W: Browse search page
    W->>S: GET /search
    S->>DB: Item.find() + User.find() + SwapRequest.find()
    DB-->>S: Items with owner names & pending status
    S-->>W: Render search.ejs with items
    W-->>U: Display items with "Request Swap" buttons

    U->>W: Click "Request Swap" on item
    W->>S: GET /swaps/request/:itemId
    S->>DB: Item.findOne({itemId})
    S->>DB: Item.find({ownerId: user.userId})
    DB-->>S: Target item + User's items
    S-->>W: Render swap-request.ejs form
    W-->>U: Show swap request form

    U->>W: Fill form (select item, add message, upload image)
    W->>S: POST /swaps/request/:itemId (with file upload)
    S->>S: Validate form data & process image
    S->>DB: SwapRequest.create({requesterId, itemId, offeredItemId, message, status: 'pending'})
    DB-->>S: New swap request created
    S->>DB: Update item with hasPendingSwaps flag
    S-->>W: Redirect to /search with success message
    W-->>U: Show success notification

    Note over O,N: Owner Reviews Request

    O->>W: Visit items page or received requests
    W->>S: GET /swaps/received
    S->>DB: SwapRequest.find({itemOwnerId, status: 'pending'})
    DB-->>S: Pending swap requests
    S-->>W: Render swap-received.ejs
    W-->>O: Show pending requests with details

    O->>W: Click Accept/Reject on request
    W->>S: POST /swaps/:requestId/respond
    S->>DB: SwapRequest.findOneAndUpdate({status: 'accepted'/'rejected'})
    S->>DB: Update both items status if accepted
    DB-->>S: Updated request and items
    S-->>W: Redirect with status message
    W-->>O: Show success/confirmation

    Note over U,N: System Updates & Notifications

    S->>N: Trigger notification to requester
    N-->>U: Email/in-app notification of decision
    S->>DB: Update item.hasPendingSwaps flags
    DB-->>S: Flags updated

    Note over U,O: Both users see updated item statuses in search/detail views
```

## 2. User Authentication & Account Creation Flow

```mermaid
sequenceDiagram
    participant U as New User
    participant W as Web Browser
    participant S as Express Server
    participant DB as MongoDB
    participant BCR as BCrypt
    participant SESS as Session Store

    Note over U,SESS: Account Registration Process

    U->>W: Visit /register
    W->>S: GET /register
    S-->>W: Render register.ejs form
    W-->>U: Display registration form

    U->>W: Fill form (username, email, password, confirm password)
    W->>S: POST /register with form data
    S->>S: Validate form data (required fields, password match)

    alt Validation fails
        S-->>W: Render register.ejs with errors
        W-->>U: Show validation errors
    else Validation passes
        S->>DB: User.findOne({$or: [{username}, {email}]})
        DB-->>S: Check if user exists

        alt User already exists
            S-->>W: Render register.ejs with error
            W-->>U: Show "User already exists" error
        else User doesn't exist
            S->>BCR: bcrypt.hash(password, 10)
            BCR-->>S: Hashed password
            S->>DB: User.create({username, email, password: hashedPassword, userId: uuid()})
            DB-->>S: New user created
            S->>SESS: req.session.user = userData
            SESS-->>S: Session established
            S-->>W: Redirect to /search
            W-->>U: Logged in, redirect to main app
        end
    end

    Note over U,SESS: Login Process

    U->>W: Visit /login
    W->>S: GET /login
    S-->>W: Render login.ejs form
    W-->>U: Display login form

    U->>W: Enter username/email and password
    W->>S: POST /login with credentials
    S->>DB: User.findOne({$or: [{username}, {email}]})
    DB-->>S: User record or null

    alt User not found
        S-->>W: Render login.ejs with error
        W-->>U: Show "Invalid credentials" error
    else User found
        S->>BCR: bcrypt.compare(password, user.password)
        BCR-->>S: Password match result

        alt Password incorrect
            S-->>W: Render login.ejs with error
            W-->>U: Show "Invalid credentials" error
        else Password correct
            S->>SESS: req.session.user = {userId, username, email}
            SESS-->>S: Session established
            S-->>W: Redirect to /search
            W-->>U: Successfully logged in
        end
    end

    Note over U,SESS: Protected Route Access

    U->>W: Try to access protected route (e.g., /items/new)
    W->>S: GET /items/new
    S->>SESS: Check req.session.user

    alt No session/not logged in
        S-->>W: Redirect to /login
        W-->>U: Redirected to login page
    else Valid session
        SESS-->>S: User session data
        S->>DB: Verify user still exists (optional)
        DB-->>S: User verification
        S-->>W: Render protected page
        W-->>U: Access granted to protected content
    end

    Note over U,SESS: Logout Process

    U->>W: Click logout button
    W->>S: POST /logout
    S->>SESS: req.session.destroy()
    SESS-->>S: Session cleared
    S-->>W: Redirect to /login
    W-->>U: Logged out, redirected to login
```

## Key Components Explained

### Swap Feature Components:

- **Express Routes**: `/swaps/request/:itemId`, `/swaps/received`, `/swaps/:requestId/respond`
- **Models**: `SwapRequest`, `Item`, `User`
- **Views**: `search.ejs`, `swap-request.ejs`, `swap-received.ejs`
- **File Upload**: Multer middleware for swap offer images
- **Status Management**: Pending → Accepted/Rejected workflow

### Authentication Components:

- **Express Routes**: `/register`, `/login`, `/logout`
- **Middleware**: Session validation on protected routes
- **Security**: BCrypt password hashing
- **Session Management**: Express-session with MongoDB store
- **Models**: `User` model with unique constraints
- **Validation**: Form validation and duplicate user checks

### Database Schema Integration:

- **Users**: `userId` (UUID), `username`, `email`, `password` (hashed)
- **Items**: `itemId`, `ownerId`, `status`, `hasPendingSwaps`
- **SwapRequests**: `requesterId`, `itemId`, `offeredItemId`, `status`, `createdAt`
- **Indexes**: Optimized queries for user lookups and swap status checks
