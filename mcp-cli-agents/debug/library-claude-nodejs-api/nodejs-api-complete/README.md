# Node.js REST API

A complete Node.js REST API built with Express.js, featuring user management with full CRUD operations, input validation, error handling, and comprehensive testing.

## Features

- ✅ Express.js server with security middleware (CORS, Helmet, Morgan)
- ✅ RESTful API endpoints for user management
- ✅ Input validation using Joi
- ✅ Comprehensive error handling
- ✅ In-memory data storage (easily replaceable with database)
- ✅ Unit and integration tests with Jest
- ✅ Proper folder structure and separation of concerns

## Tech Stack

- **Runtime**: Node.js (>= 16.0.0)
- **Framework**: Express.js
- **Validation**: Joi
- **Testing**: Jest + Supertest
- **Security**: Helmet, CORS
- **Logging**: Morgan
- **Development**: Nodemon

## Project Structure

```
nodejs-api-complete/
├── src/
│   ├── controllers/
│   │   └── userController.js    # User route handlers
│   ├── middleware/
│   │   └── errorHandler.js      # Error handling middleware
│   ├── models/
│   │   ├── User.js              # User model with validation
│   │   └── userStore.js         # In-memory data store
│   ├── routes/
│   │   └── userRoutes.js        # User route definitions
│   ├── utils/                   # Utility functions (extensible)
│   └── app.js                   # Express app configuration
├── tests/
│   ├── User.test.js             # User model unit tests
│   ├── users.test.js            # API integration tests
│   └── setup.js                 # Test configuration
├── config/                      # Configuration files (extensible)
├── jest.config.js               # Jest test configuration
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## Installation

1. **Clone or download the project**:
   ```bash
   cd nodejs-api-complete
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

## Usage

### Development Mode
```bash
npm run dev
```
Server runs on `http://localhost:3000` with auto-restart on file changes.

### Production Mode
```bash
npm start
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## API Endpoints

### Base URL
```
http://localhost:3000
```

### Root Endpoints
- `GET /` - Welcome message and API information
- `GET /api` - API status and available endpoints

### User Endpoints
All user endpoints are prefixed with `/api/users`

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/api/users` | Get all users | - |
| GET | `/api/users/:id` | Get user by ID | - |
| POST | `/api/users` | Create new user | `{ name, email, age? }` |
| PUT | `/api/users/:id` | Update user | `{ name?, email?, age? }` |
| DELETE | `/api/users/:id` | Delete user | - |

### Request/Response Examples

#### Create User
```bash
POST /api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}
```

**Response (201)**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z"
  },
  "message": "User created successfully"
}
```

#### Get All Users
```bash
GET /api/users
```

**Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "age": 30,
      "createdAt": "2023-12-01T10:00:00.000Z",
      "updatedAt": "2023-12-01T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### Update User
```bash
PUT /api/users/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "name": "John Smith",
  "age": 31
}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Smith",
    "email": "john@example.com",
    "age": 31,
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:05:00.000Z"
  },
  "message": "User updated successfully"
}
```

### Error Responses

#### Validation Error (400)
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "\"email\" must be a valid email"
}
```

#### Not Found (404)
```json
{
  "success": false,
  "error": "Not Found",
  "message": "User not found"
}
```

#### Conflict (409)
```json
{
  "success": false,
  "error": "Conflict",
  "message": "User with this email already exists"
}
```

## Validation Rules

### User Model
- **name**: Required, string, 2-50 characters
- **email**: Required, valid email format, unique
- **age**: Optional, integer, 0-120

## Testing

The project includes comprehensive tests:

- **Unit Tests**: User model validation and methods
- **Integration Tests**: API endpoints with various scenarios
- **Test Coverage**: Configured to track code coverage

### Running Tests
```bash
# Run tests once
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Environment Variables

You can configure the application using environment variables:

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production/test)
- `CORS_ORIGIN`: CORS allowed origins (default: *)

Create a `.env` file in the root directory:
```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

## Security Features

- **Helmet**: Sets various HTTP headers to secure the app
- **CORS**: Configurable Cross-Origin Resource Sharing
- **Input Validation**: Joi validation for all user inputs
- **Error Handling**: Prevents sensitive information leakage

## Extension Points

This API is designed to be easily extensible:

1. **Database Integration**: Replace `userStore.js` with database models (MongoDB, PostgreSQL, etc.)
2. **Authentication**: Add JWT or session-based authentication middleware
3. **More Models**: Follow the same pattern for additional resources
4. **File Upload**: Add multer middleware for file handling
5. **Logging**: Replace console.log with proper logging (Winston, etc.)
6. **Caching**: Add Redis for caching frequently accessed data

## Development Workflow

1. **Make changes** to source files
2. **Run tests** to ensure functionality: `npm test`
3. **Start development server**: `npm run dev`
4. **Test API endpoints** using tools like Postman or curl
5. **Add tests** for new features
6. **Generate coverage report**: `npm run test:coverage`

## License

MIT License - feel free to use this project as a starting point for your applications.

## Support

If you encounter any issues or have questions:

1. Check the test files for usage examples
2. Review the error messages for validation issues
3. Ensure all dependencies are installed correctly
4. Verify Node.js version compatibility (>= 16.0.0)

Happy coding! 🚀