# Home Swap Platform

A web-based application that enables users to exchange personal items with other users in their community. Built with Node.js, Express, MongoDB, and Materialize CSS.

## Features

- User registration and authentication
- Item posting and management
- Browse and search items
- Swap request system
- User-to-user messaging
- Admin content moderation
- Responsive web design

## Prerequisites

- Node.js (v14 or higher)
- Docker and Docker Compose
- Git

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd home-swap
```

### 2. Install dependencies

```bash
npm install
```

### Start MongoDB with Mongo Express

```bash
# Start MongoDB and Mongo Express for development
docker-compose up -d mongodb mongo-express

# Or start both development and test databases with their admin interfaces
docker-compose --profile test up -d
```

### 4. Set up environment variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration if needed
```

### 5. Start the development server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Design System & Style Guide

This project uses a modern, accessible, and clean design system, defined in `public/style.css`. The color palette features teal and coral as primary accents, with a full range of semantic and neutral colors for clarity and accessibility. Typography, spacing, buttons, forms, cards, and alert components are all styled for a consistent and user-friendly experience.

A comprehensive style guide is available at [`views/styleguide.ejs`](src/views/styleguide.ejs). To preview all design elements and components, start the server and visit `/styleguide` in your browser. This page demonstrates the color palette, typography, buttons, form elements, cards, alerts, and utility classes in action.

## Development

### Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm run seed:db` – Set up and seed the MongoDB: homeswapDB
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Database Management

#### Start MongoDB with Mongo Express

```bash
docker-compose up -d mongodb mongo-express
```

#### Access Mongo Express (Web UI)

- **Development Database**: http://localhost:8081
- **Test Database**: http://localhost:8082 (when using `--profile test`)
- **Login**: admin / admin

#### Stop MongoDB and Mongo Express

```bash
docker-compose down
```

#### View logs

```bash
# MongoDB logs
docker-compose logs mongodb

# Mongo Express logs
docker-compose logs mongo-express
```

#### Connect to MongoDB shell

```bash
docker exec -it homeswap-mongodb mongosh -u admin -p password
```

#### Reset database (remove all data)

```bash
docker-compose down -v
docker-compose up -d mongodb
```

### Testing

The project includes both unit tests and property-based tests using Jest and fast-check.

#### Run all tests

```bash
npm test
```

#### Run tests with test database

```bash
# Start test database
docker-compose --profile test up -d mongodb-test

# Run tests
npm test

# Stop test database
docker-compose --profile test down
```

## Project Structure

```
├── src/
│   ├── config/          # Configuration files
│   ├── models/          # Mongoose data models
│   ├── routes/          # Express route handlers
│   ├── views/           # EJS templates
│   ├── public/          # Static assets (CSS, JS, images)
│   └── app.js           # Main application file
├── tests/               # Test files
├── docker/              # Docker configuration
├── docker-compose.yml   # Docker Compose configuration
└── package.json         # Project dependencies and scripts
```

## Services

When running with Docker Compose, the following services will be available:

| Service                | URL                       | Description                                           |
| ---------------------- | ------------------------- | ----------------------------------------------------- |
| **Home Swap App**      | http://localhost:3000     | Main application                                      |
| **MongoDB**            | mongodb://localhost:27017 | Development database                                  |
| **Mongo Express**      | http://localhost:8081     | Database admin interface (admin/admin)                |
| **Test MongoDB**       | mongodb://localhost:27018 | Test database (with `--profile test`)                 |
| **Test Mongo Express** | http://localhost:8082     | Test database admin interface (with `--profile test`) |

## Environment Variables

| Variable           | Description                     | Default                                                              |
| ------------------ | ------------------------------- | -------------------------------------------------------------------- |
| `PORT`             | Server port                     | `3000`                                                               |
| `NODE_ENV`         | Environment mode                | `development`                                                        |
| `MONGODB_URI`      | MongoDB connection string       | `mongodb://homeswap_user:homeswap_password@localhost:27017/homeswap` |
| `MONGODB_TEST_URI` | Test database connection string | `mongodb://admin:password@localhost:27018/homeswap_test`             |
| `SESSION_SECRET`   | Session encryption key          | `your-secret-key-here`                                               |

## Database Schema

The application uses MongoDB with the following main collections:

- **users** - User accounts and profiles
- **items** - Items available for swap
- **swaprequests** - Swap requests between users
- **messages** - User-to-user messages
- **reports** - Content moderation reports

## API Endpoints

### Authentication

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Items

- `GET /items` - Browse items
- `POST /items` - Create item
- `GET /items/:id` - Get item details
- `PUT /items/:id` - Update item
- `DELETE /items/:id` - Delete item

### Swap Requests

- `POST /swaps` - Create swap request
- `GET /swaps/incoming` - Get incoming requests
- `GET /swaps/outgoing` - Get outgoing requests
- `PUT /swaps/:id/accept` - Accept swap request
- `PUT /swaps/:id/reject` - Reject swap request

### Messages

- `POST /messages` - Send message
- `GET /messages/conversations` - List conversations
- `GET /messages/conversation/:userId` - Get conversation

### Admin

- `GET /admin/reports` - View reports
- `PUT /admin/items/:id/moderate` - Moderate content

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
