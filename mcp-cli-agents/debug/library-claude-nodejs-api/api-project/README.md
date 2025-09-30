# Node.js REST API

A complete Node.js REST API built with Express.js, featuring user management with full CRUD operations, input validation, error handling, and comprehensive testing.

## Features

- ✅ Express.js server with security middleware (helmet, cors)
- ✅ Request logging with Morgan
- ✅ RESTful API endpoints for user management
- ✅ Input validation using Joi
- ✅ Comprehensive error handling
- ✅ In-memory database simulation
- ✅ Complete test suite with Jest and Supertest
- ✅ Graceful server shutdown handling

## Project Structure

```
api-project/
├── src/
│   ├── controllers/
│   │   └── userController.js    # User route handlers
│   ├── middleware/
│   │   └── errorHandler.js      # Global error handling
│   ├── models/
│   │   └── User.js              # User model with validation
│   ├── routes/
│   │   └── userRoutes.js        # User API routes
│   ├── utils/
│   │   └── database.js          # In-memory database simulation
│   └── server.js                # Express server setup
├── tests/
│   ├── models/
│   │   └── User.test.js         # User model tests
│   └── user.test.js             # API endpoint tests
├── config/                      # Configuration files
├── .env.example                 # Environment variables template
├── package.json                 # Project dependencies and scripts
└── README.md                    # This file
```

## Installation

1. **Clone or download the project**
   ```bash
   cd api-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file:
   ```
   PORT=3000
   NODE_ENV=development
   ```

## Usage

### Development Mode
```bash
npm run dev
```
Starts the server with nodemon for automatic restarts on file changes.

### Production Mode
```bash
npm start
```
Starts the server in production mode.

### Running Tests
```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## API Endpoints

Base URL: `http://localhost:3000`

### Health Check
- **GET** `/health` - Check server status

### Users
- **GET** `/api/users` - Get all users
- **GET** `/api/users/:id` - Get user by ID
- **POST** `/api/users` - Create new user
- **PUT** `/api/users/:id` - Update user
- **DELETE** `/api/users/:id` - Delete user

## API Usage Examples

### Create a new user
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  }'
```

### Get all users
```bash
curl http://localhost:3000/api/users
```

### Get user by ID
```bash
curl http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440000
```

### Update user
```bash
curl -X PUT http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "age": 31
  }'
```

### Delete user
```bash
curl -X DELETE http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440000
```

## Request/Response Format

### Success Response Format
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ },
  "count": 5  // Only for list endpoints
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"]  // For validation errors
}
```

## User Model

### User Properties
- `id` (string, UUID) - Auto-generated unique identifier
- `name` (string, 2-50 chars) - User's full name
- `email` (string, valid email) - User's email address
- `age` (number, 1-120) - User's age
- `createdAt` (string, ISO date) - Creation timestamp
- `updatedAt` (string, ISO date) - Last update timestamp

### Validation Rules
- **Name**: Required, 2-50 characters
- **Email**: Required, valid email format, unique
- **Age**: Required, integer between 1-120

## Dependencies

### Production Dependencies
- **express** - Web framework
- **cors** - Cross-origin resource sharing
- **helmet** - Security middleware
- **morgan** - HTTP request logger
- **joi** - Data validation
- **uuid** - UUID generation
- **dotenv** - Environment variables

### Development Dependencies
- **nodemon** - Development server with auto-restart
- **jest** - Testing framework
- **supertest** - HTTP assertions for testing

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |

## Error Handling

The API includes comprehensive error handling for:
- Validation errors (400)
- Resource not found (404) 
- Duplicate email (409)
- Server errors (500)
- Invalid JSON (400)
- Invalid route parameters (400)

## Testing

The project includes comprehensive tests covering:
- All API endpoints (GET, POST, PUT, DELETE)
- User model validation
- Error scenarios
- Edge cases

Test coverage includes:
- Unit tests for the User model
- Integration tests for API endpoints
- Error handling scenarios
- Validation testing

Run tests with: `npm test`

## Security Features

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configurable cross-origin resource sharing
- **Input validation**: All inputs validated with Joi
- **Error handling**: Prevents sensitive information leakage
- **Graceful shutdown**: Proper server cleanup on termination

## Next Steps

To extend this API for production use:

1. **Database Integration**: Replace in-memory storage with PostgreSQL, MongoDB, etc.
2. **Authentication**: Add JWT-based authentication
3. **Authorization**: Implement role-based access control
4. **Rate Limiting**: Add request rate limiting
5. **Logging**: Implement structured logging with Winston
6. **Monitoring**: Add health checks and metrics
7. **Docker**: Containerize the application
8. **CI/CD**: Set up automated testing and deployment

## License

MIT