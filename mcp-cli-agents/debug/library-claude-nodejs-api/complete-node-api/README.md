# Complete Node.js REST API

A complete Node.js REST API built with Express.js, featuring user management, validation, error handling, and comprehensive testing.

## Features

- **Express.js** server with essential middleware
- **CORS** enabled for cross-origin requests
- **Helmet** for security headers
- **Morgan** for HTTP request logging
- **Joi** validation for request data
- **UUID** for unique user identifiers
- **Error handling** middleware
- **In-memory data store** (easily replaceable with database)
- **Comprehensive test suite** with Jest and Supertest
- **Health check** endpoint

## Project Structure

```
complete-node-api/
├── src/
│   ├── controllers/
│   │   └── userController.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   └── userStore.js
│   ├── routes/
│   │   └── userRoutes.js
│   └── app.js
├── tests/
│   ├── models/
│   │   └── User.test.js
│   ├── setup.js
│   └── user.test.js
├── config/
├── jest.config.js
├── package.json
└── README.md
```

## Prerequisites

- Node.js (v14.0.0 or higher)
- npm or yarn package manager

## Installation

1. Clone or download the project
2. Navigate to the project directory:
   ```bash
   cd complete-node-api
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Available Scripts

### Development
```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
```

### Testing
```bash
npm test             # Run tests once
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## API Endpoints

### Base URL
```
http://localhost:3000
```

### Health Check
- **GET** `/health` - Check API health status
- **GET** `/` - Welcome message and API information

### Users
- **GET** `/api/users` - Get all users
- **GET** `/api/users/:id` - Get user by ID
- **POST** `/api/users` - Create new user
- **PUT** `/api/users/:id` - Update user by ID
- **DELETE** `/api/users/:id` - Delete user by ID

## API Usage Examples

### Get all users
```bash
curl -X GET http://localhost:3000/api/users
```

### Create a new user
```bash
curl -X POST http://localhost:3000/api/users \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  }'
```

### Get user by ID
```bash
curl -X GET http://localhost:3000/api/users/{user-id}
```

### Update user
```bash
curl -X PUT http://localhost:3000/api/users/{user-id} \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Smith",
    "age": 35
  }'
```

### Delete user
```bash
curl -X DELETE http://localhost:3000/api/users/{user-id}
```

## User Model

### User Object
```json
{
  "id": "uuid-string",
  "name": "string (2-50 characters, required)",
  "email": "string (valid email, required)",
  "age": "number (1-120, optional)",
  "createdAt": "ISO date string",
  "updatedAt": "ISO date string"
}
```

### Validation Rules
- **name**: Required, 2-50 characters
- **email**: Required, valid email format, unique
- **age**: Optional, integer between 1-120

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // response data
  },
  "count": 0 // for list endpoints
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description"
  }
}
```

## Environment Variables

Create a `.env` file in the root directory (optional):

```env
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Testing

The project includes comprehensive tests covering:
- User model validation
- API endpoint functionality
- Error handling
- Edge cases

Run tests with:
```bash
npm test
```

For test coverage:
```bash
npm run test:coverage
```

## Error Handling

The API includes robust error handling for:
- Validation errors (400)
- Resource not found (404)
- Duplicate entries (400)
- Server errors (500)
- Malformed requests

## Security Features

- **Helmet.js** for security headers
- **CORS** configuration
- Input validation with Joi
- Request size limits
- Error message sanitization

## Development

### Adding New Endpoints
1. Create controller function in `src/controllers/`
2. Add route in `src/routes/`
3. Add validation schema if needed
4. Write tests in `tests/`

### Database Integration
The current implementation uses an in-memory store (`userStore.js`). To integrate with a database:
1. Replace `userStore.js` with database models
2. Update controller methods to use database operations
3. Add database connection configuration

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Support

For issues and questions, please create an issue in the project repository.