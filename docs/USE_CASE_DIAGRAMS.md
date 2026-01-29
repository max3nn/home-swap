# HomeSwap Platform - Use Case Diagrams

## 1. User Authentication & Account Creation Flow

```mermaid
sequenceDiagram
    participant U as New User
    participant W as Web Browser
    participant S as Express Server
    participant DB as MongoDB
    participant BCR as BCrypt (via User model)
    participant SESS as Session Store

    Note over U,SESS: Account Registration Process

    U->>W: Visit registration page
    W->>S: GET /auth/register
    S-->>W: Render register.ejs form
    W-->>U: Display registration form

    U->>W: Fill form (name, email, password)
    W->>S: POST /auth/register with JSON data
    S->>S: Check database connection
    S->>S: Validate form data (required fields, email format, password length)

    alt Validation fails
        S-->>W: JSON response with validation errors
        W-->>U: Show validation errors
    else Validation passes
        S->>DB: User.findOne({$or: [{email}, {username}]})
        DB-->>S: Check if user exists

        alt User already exists
            S-->>W: JSON response 409 "User already exists"
            W-->>U: Show "User already exists" error
        else User doesn't exist
            S->>S: Generate unique userId (mongoose ObjectId)
            S->>S: Create new User({userId, username, email, password, userrole})
            S->>BCR: user.save() - triggers pre-save password hashing
            BCR-->>S: User saved with hashed password
            S-->>W: JSON response 201 "Account registered successfully"
            W-->>U: Show success, redirect to login
        end
    end

    Note over U,SESS: Login Process

    U->>W: Visit login page
    W->>S: GET /auth/login

    alt Already logged in
        S->>SESS: Check req.session.user
        SESS-->>S: User session exists
        S-->>W: Redirect to /search
        W-->>U: Redirect to main app
    else Not logged in
        S-->>W: Render login.ejs form
        W-->>U: Display login form
    end

    U->>W: Enter email and password
    W->>S: POST /auth/login with JSON data
    S->>S: Check database connection
    S->>S: Validate input (email format, required fields)
    S->>DB: User.findOne({email: trimmedEmail})
    DB-->>S: User record or null

    alt User not found
        S-->>W: JSON response 401 "Invalid email or password"
        W-->>U: Show "Invalid credentials" error
    else User found
        S->>BCR: user.comparePassword(password)
        BCR-->>S: Password comparison result

        alt Password incorrect
            S-->>W: JSON response 401 "Invalid email or password"
            W-->>U: Show "Invalid credentials" error
        else Password correct
            S->>SESS: req.session.user = {userId, username, email, userrole}
            SESS-->>S: Session created
            S-->>W: JSON response 200 "Login successful" + user data
            W-->>U: Successfully logged in, redirect to /search
        end
    end

    Note over U,SESS: Protected Route Access & Session Management

    U->>W: Try to access protected route (e.g., /swaps/*)
    W->>S: GET protected route
    S->>SESS: Check req.session.user in middleware

    alt No session/not logged in
        SESS-->>S: No user session
        S-->>W: Redirect to /auth/login
        W-->>U: Redirected to login page
    else Valid session
        SESS-->>S: User session data
        S-->>W: Render protected page
        W-->>U: Access granted to protected content
    end

    Note over U,SESS: Session Info & Logout

    U->>W: Check login status
    W->>S: GET /auth/me
    S->>SESS: Check req.session.user

    alt Authenticated
        SESS-->>S: User session data
        S-->>W: JSON response with user data
        W-->>U: Show user info
    else Not authenticated
        S-->>W: JSON response 401 "Not authenticated"
        W-->>U: Redirect to login
    end

    U->>W: Click logout button
    W->>S: POST /auth/logout
    S->>SESS: req.session.destroy()
    SESS-->>S: Session cleared
    S->>S: res.clearCookie('connect.sid')
    S-->>W: JSON response 200 "Logged out"
    W-->>U: Logged out, redirect to login
```

## 2. Item Creation Feature Flow

```mermaid
sequenceDiagram
    participant U as User
    participant W as Web Browser
    participant S as Express Server
    participant DB as MongoDB
    participant M as Multer
    participant V as Validator

    Note over U,V: Item Creation Process

    U->>W: Navigate to create new item
    W->>S: GET /items/new
    S->>S: Check authentication middleware

    alt User not authenticated
        S-->>W: Redirect to /auth/login
        W-->>U: Show login page
    else User authenticated
        S->>S: Load ITEM_CATEGORIES from config
        S-->>W: Render item-new.ejs with categories
        W-->>U: Show item creation form
    end

    U->>W: Fill form (title, description, category, wanted categories, image)
    W->>S: POST /items/new (multipart/form-data)
    S->>M: Multer processes file upload to memory

    alt File upload error (size > 10MB or not image)
        M-->>S: Multer error
        S-->>W: Render item-new.ejs with file error
        W-->>U: Show "Invalid file" or "Too large" error
    else File upload successful
        M-->>S: req.file.buffer with image data
        S->>V: Validate form data (title, description required)
        V-->>S: Validation results

        alt Validation fails
            S-->>W: Render item-new.ejs with errors
            W-->>U: Show validation errors
        else Validation passes
            S->>S: Generate unique itemId (mongoose ObjectId)
            S->>S: Set imageUrl = `/items/${itemId}/image`

            S->>DB: Item.create({
            Note right of S: itemId: ObjectId,<br/>title, description,<br/>itemType, wantedCategories,<br/>ownerId: user.userId,<br/>imageUrl: `/items/${itemId}/image`,<br/>image: {data: Buffer, contentType},<br/>hasImage: true
            S->>DB: })
            DB-->>S: Item stored with binary image data

            S-->>W: Redirect to /search with success
            W-->>U: Show "Item created successfully" notification
        end
    end

    Note over U,V: Image Serving Process

    U->>W: Browse search page with new item
    W->>S: GET /search
    S->>DB: Item.find() with owner names
    DB-->>S: Items with imageUrl paths
    S-->>W: Render search.ejs with imageUrl references
    W-->>U: Display items with image URLs

    W->>S: GET /items/:itemId/image (for each image)
    S->>DB: Item.findOne({itemId}).select('image')
    DB-->>S: Binary image data and contentType
    S->>S: Convert BSON Binary to Buffer using toBuffer()
    S->>S: Sniff content type from buffer headers
    S-->>W: Send image buffer with proper headers
    W-->>U: Display images in search results

    Note over U,V: Item Management

    U->>W: View own items in account page
    W->>S: GET /account
    S->>DB: Item.find({ownerId: user.userId})
    DB-->>S: User's items
    S-->>W: Render account.ejs with user's items
    W-->>U: Show owned items with edit/manage options

    U->>W: Click edit item
    W->>S: GET /items/:itemId/edit
    S->>DB: Item.findOne({itemId, ownerId})

    alt Item not found or not owner
        S-->>W: Render error page with 403/404
        W-->>U: Show "Access denied" or "Not found" error
    else Item found and user is owner
        DB-->>S: Item details
        S-->>W: Render item-edit.ejs with current data
        W-->>U: Show edit form pre-populated

        U->>W: Update item details and submit
        W->>S: POST /items/:itemId/edit
        S->>M: Process new image upload (if provided)
        S->>V: Validate updated data

        alt New image uploaded
            S->>S: item.image.data = req.file.buffer
            S->>S: item.imageUrl = `/items/${itemId}/image?v=${timestamp}`
            S->>S: item.markModified('image')
        end

        S->>DB: item.save() - update document with new data
        DB-->>S: Item updated successfully
        S-->>W: Redirect to /search with success
        W-->>U: Show "Item updated successfully"
    end
```

## 3. Swap Request Feature Flow

```mermaid
sequenceDiagram
    participant U as User (Requester)
    participant W as Web Browser
    participant S as Express Server
    participant DB as MongoDB
    participant O as Owner
    participant M as Multer

    Note over U,M: Item Swap Request Process

    U->>W: Browse search page
    W->>S: GET /search
    S->>DB: Item.find() + User.find() + SwapRequest.find()
    DB-->>S: Items with owner names & pending status
    S-->>W: Render search.ejs with items
    W-->>U: Display items with "Request Swap" buttons

    U->>W: Click "Request Swap" on item
    W->>S: GET /swaps/request/:itemId
    S->>S: Check authentication middleware
    S->>DB: Item.findOne({itemId})
    S->>DB: User.findOne({userId: item.ownerId})
    S->>DB: Item.find({ownerId: user.userId})
    DB-->>S: Target item + owner info + User's items
    S->>S: Validate item not swapped & not own item
    S-->>W: Render swap-request.ejs form
    W-->>U: Show swap request form with item selection

    U->>W: Fill form (select/create item, add message, upload image)
    W->>S: POST /swaps/request/:itemId (multipart/form-data)
    S->>S: Check authentication & database connection
    S->>S: Validate form data (message, item selection)
    S->>DB: Item.findOne({itemId}) - verify target item

    alt Create new item for swap
        S->>S: Call createItem() shared function
        S->>M: Process image upload to memory
        S->>DB: Item.create() with new item data
        DB-->>S: New item created
    else Use existing item
        S->>DB: Item.findOne({itemId: offeredItemId, ownerId})
        DB-->>S: Existing offered item
    end

    S->>DB: SwapRequest.findOne() - check for duplicates

    alt Duplicate request exists
        S-->>W: Render swap-request.ejs with error
        W-->>U: Show "Already requested" error
    else No duplicate
        S->>DB: SwapRequest.create({
        Note right of S: swapRequestId: ObjectId,<br/>itemId, ownerId,<br/>offeredItemId, message,<br/>status: 'pending',<br/>imageUrl: from offered item
        S->>DB: })
        DB-->>S: New swap request created
        S->>S: req.session.success = 'Swap request sent!'
        S-->>W: Redirect to /search
        W-->>U: Show success notification
    end

    Note over O,M: Owner Reviews Requests

    O->>W: Visit received swap requests
    W->>S: GET /swaps/received
    S->>S: Check authentication middleware
    S->>DB: SwapRequest.find({itemId: {$in: userItemIds}})
    S->>DB: Item.find() for all related items
    S->>DB: User.find() for requester information
    DB-->>S: Enriched swap requests with item/user data
    S-->>W: Render swap-received.ejs
    W-->>O: Show pending requests with full details

    O->>W: Click Accept/Reject on request
    W->>S: POST /swaps/:requestId/respond
    S->>DB: SwapRequest.findOne({swapRequestId})
    S->>S: Verify ownership and status

    alt Accept request
        S->>DB: SwapRequest.update({status: 'accepted'})
        S->>DB: Item.update() both items to 'swapped'
        S->>DB: SwapRequest.update() reject all other requests for both items
        DB-->>S: All updates completed
        S-->>W: Redirect with "Swap accepted" message
    else Reject request
        S->>DB: SwapRequest.update({status: 'rejected'})
        DB-->>S: Request rejected
        S-->>W: Redirect with "Swap rejected" message
    end

    W-->>O: Show action confirmation
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
