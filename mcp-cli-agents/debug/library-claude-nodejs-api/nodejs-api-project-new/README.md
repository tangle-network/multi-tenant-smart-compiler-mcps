# Node.js REST API

A complete Node.js REST API built with Express.js featuring user management with full CRUD operations, validation, error handling, and comprehensive testing.

## Features

- **Express.js Server** with essential middleware (CORS, Helmet, Morgan)
- **RESTful API** for user management
- **Data Validation** using Joi
- **Error Handling** middleware with proper HTTP status codes
- **In-Memory Data Store** with email uniqueness constraints
- **Comprehensive Testing** with Jest and Supertest
- **Security** headers with Helmet
- **Logging** with Morgan
- **CORS** enabled for cross-origin requests

## Project Structure

```
nodejs-api-project-new/
├── src/
│   ├── controllers/
│   │   └── userController.js      # User business logic
│   ├── middleware/
│   │   └── errorHandler.js        # Global error handling
│   ├── models/
│   │   ├── User.js                # User model with validation
│   │   └── userStore.js           # In-memory data store
│   ├── routes/
│   │   └── userRoutes.js          # User API routes
│   ├── utils/                     # Utility functions (empty)
│   └── server.js                  # Main server file
├── tests/
│   ├── models/
│   │   └── User.test.js           # User model tests
│   ├── setup.js                   # Test setup and configuration
│   └── users.test.js              # API endpoint tests
├── config/                        # Configuration files (empty)
├── jest.config.js                 # Jest configuration
├── package.json                   # Dependencies and scripts
└── README.md                      # This file
```

## API Endpoints

### Users API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users` | Create new user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check endpoint |

## User Model

```json
{
  "id": "uuid-string",
  "name": "string (2-50 chars, required)",
  "email": "string (valid email, required, unique)",
  "age": "number (1-150, optional)",
  "createdAt": "date",
  "updatedAt": "date"
}
```

## Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone or download the project**
   ```bash
   cd nodejs-api-project-new
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

### Running the Application

#### Development Mode (with auto-restart)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in the `PORT` environment variable).

### Testing

#### Run all tests
```bash
npm test
```

#### Run tests in watch mode
```bash
npm run test:watch
```

#### Run tests with coverage report
```bash
npm run test:coverage
```

## API Usage Examples

### Create a User
```bash
curl -X POST http://localhost:3000/api/users \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  }'
```

### Get All Users
```bash
curl http://localhost:3000/api/users
```

### Get User by ID
```bash
curl http://localhost:3000/api/users/{user-id}
```

### Update User
```bash
curl -X PUT http://localhost:3000/api/users/{user-id} \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Smith",
    "age": 31
  }'
```

### Delete User
```bash
curl -X DELETE http://localhost:3000/api/users/{user-id}
```

### Health Check
```bash
curl http://localhost:3000/health
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ /* validation errors if applicable */ ]
}
```

## Dependencies

### Production Dependencies
- **express**: Web framework for Node.js
- **cors**: Enable CORS with various options
- **helmet**: Secure Express apps by setting various HTTP headers
- **morgan**: HTTP request logger middleware
- **joi**: Object schema validation
- **uuid**: Generate RFC-compliant UUIDs

### Development Dependencies
- **nodemon**: Monitor for changes and automatically restart server
- **jest**: JavaScript testing framework
- **supertest**: HTTP assertions made easy via superagent

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |

## Error Handling

The API includes comprehensive error handling:

- **Validation Errors** (400): Invalid input data
- **Not Found Errors** (404): Resource not found
- **Conflict Errors** (409): Duplicate email addresses
- **Server Errors** (500): Internal server errors

## Security Features

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: Joi schema validation for all inputs
- **Error Sanitization**: Production error messages don't expose internal details

## Data Storage

This implementation uses an in-memory data store for simplicity. In a production environment, you would typically replace the `userStore` with a proper database implementation (PostgreSQL, MongoDB, etc.).

## Testing

The project includes comprehensive tests covering:

- **Unit Tests**: User model validation and business logic
- **Integration Tests**: API endpoints with various scenarios
- **Error Handling**: Testing error conditions and edge cases

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.