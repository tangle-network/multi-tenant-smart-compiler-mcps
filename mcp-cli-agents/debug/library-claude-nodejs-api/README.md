# Node.js REST API

A complete Node.js REST API built with Express.js, featuring user management with full CRUD operations, input validation, error handling, and comprehensive testing.

## Features

- 🚀 Express.js server with security middleware (Helmet, CORS)
- 📝 User management API with full CRUD operations
- ✅ Input validation using Joi
- 🛡️ Comprehensive error handling
- 🧪 Unit and integration tests
- 📊 Request logging with Morgan
- 🔧 Development tools (Nodemon)

## Project Structure

```
src/
├── app.js                 # Main application entry point
├── controllers/           # Route controllers
│   └── userController.js  # User-related business logic
├── middleware/            # Custom middleware
│   └── errorHandler.js    # Global error handling
├── models/               # Data models and validation
│   ├── User.js           # User model with validation
│   └── userStore.js      # In-memory user storage
└── routes/               # API routes
    └── userRoutes.js     # User API endpoints

tests/                    # Test files
└── users.test.js        # User API tests
```

## API Endpoints

### Users

| Method | Endpoint     | Description        | Body                                    |
|--------|-------------|--------------------|-----------------------------------------|
| GET    | `/api/users` | Get all users      | None                                    |
| GET    | `/api/users/:id` | Get user by ID | None                                    |
| POST   | `/api/users` | Create new user    | `{ "name": "string", "email": "string", "age": number }` |
| PUT    | `/api/users/:id` | Update user    | `{ "name"?: "string", "email"?: "string", "age"?: number }` |
| DELETE | `/api/users/:id` | Delete user    | None                                    |

### Response Format

All API responses follow this structure:

```json
{
  "success": true|false,
  "message": "string",
  "data": {},
  "count": number,
  "errors": []
}
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone or download the project:**
   ```bash
   cd your-project-directory
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file (optional):**
   ```bash
   # Create .env file
   echo "PORT=3000" > .env
   echo "NODE_ENV=development" >> .env
   ```

### Running the Application

#### Development Mode
```bash
npm run dev
```
This starts the server with Nodemon for automatic restarts on file changes.

#### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000` (or the PORT specified in your environment).

### Testing

#### Run all tests:
```bash
npm test
```

#### Run tests in watch mode:
```bash
npm run test:watch
```

#### Run tests with coverage:
```bash
npm run test:coverage
```

## Usage Examples

### Get all users
```bash
curl http://localhost:3000/api/users
```

### Get user by ID
```bash
curl http://localhost:3000/api/users/1
```

### Create a new user
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Johnson", "email": "alice@example.com", "age": 28}'
```

### Update a user
```bash
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Smith", "age": 29}'
```

### Delete a user
```bash
curl -X DELETE http://localhost:3000/api/users/1
```

## Input Validation

The API validates all input data:

- **name**: Required, 2-50 characters
- **email**: Required, valid email format, must be unique
- **age**: Required, integer between 0-120

Invalid requests return detailed error messages with HTTP 400 status.

## Error Handling

The API includes comprehensive error handling:

- **400**: Bad Request (validation errors)
- **404**: Not Found (resource doesn't exist)
- **409**: Conflict (duplicate email)
- **500**: Internal Server Error

All errors return a consistent JSON format with helpful error messages.

## Security Features

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configures Cross-Origin Resource Sharing
- **Input Validation**: Prevents injection attacks
- **Error Sanitization**: Hides sensitive information in production

## Data Storage

This implementation uses in-memory storage for simplicity. For production use, consider integrating with:

- MongoDB (with Mongoose)
- PostgreSQL (with Sequelize or Prisma)
- MySQL
- Redis

## Development

### Adding New Features

1. Create model in `src/models/`
2. Add validation schema
3. Create controller in `src/controllers/`
4. Define routes in `src/routes/`
5. Add error handling
6. Write tests in `tests/`

### Code Style

- Use ES6+ features
- Follow RESTful conventions
- Implement proper error handling
- Write comprehensive tests
- Use descriptive variable names

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.