# Complete Node.js REST API

A complete Node.js REST API built with Express.js, featuring user management with full CRUD operations, comprehensive validation, error handling, and testing.

## Features

- ✅ Express.js server with security middleware (helmet, cors)
- ✅ Request logging with Morgan
- ✅ User management API with full CRUD operations
- ✅ Input validation using Joi
- ✅ Comprehensive error handling
- ✅ In-memory data storage with sample data
- ✅ Complete test suite with Jest and Supertest
- ✅ Health check endpoint
- ✅ Environment configuration with dotenv

## Project Structure

```
complete-nodejs-api/
├── src/
│   ├── app.js                 # Main application file
│   ├── controllers/
│   │   └── userController.js  # User CRUD operations
│   ├── middleware/
│   │   └── errorHandler.js    # Global error handling
│   ├── models/
│   │   ├── User.js            # User model with validation
│   │   └── userStore.js       # In-memory data store
│   ├── routes/
│   │   └── userRoutes.js      # User route definitions
│   └── utils/                 # Utility functions
├── tests/
│   ├── models/
│   │   └── User.test.js       # User model tests
│   └── users.test.js          # API endpoint tests
├── config/                    # Configuration files
├── package.json
└── README.md
```

## Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd complete-nodejs-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file (optional):**
   ```bash
   cp .env.example .env
   ```
   Or create a `.env` file with:
   ```
   PORT=3000
   NODE_ENV=development
   ```

## Usage

### Development Mode
```bash
npm run dev
```
This starts the server with nodemon for automatic restarts on file changes.

### Production Mode
```bash
npm start
```

### Running Tests
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

### Health Check
- **GET** `/health` - Check server health status

### User Management

#### Get All Users
- **GET** `/api/users`
- **Response:**
  ```json
  {
    "success": true,
    "count": 3,
    "data": [...]
  }
  ```

#### Get User by ID
- **GET** `/api/users/:id`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "age": 30,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
  ```

#### Create User
- **POST** `/api/users`
- **Body:**
  ```json
  {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "age": 25
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "User created successfully",
    "data": {
      "id": 4,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "age": 25,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
  ```

#### Update User
- **PUT** `/api/users/:id`
- **Body (partial updates allowed):**
  ```json
  {
    "name": "Jane Doe",
    "age": 26
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "User updated successfully",
    "data": {
      "id": 4,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "age": 26,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T12:00:00.000Z"
    }
  }
  ```

#### Delete User
- **DELETE** `/api/users/:id`
- **Response:**
  ```json
  {
    "success": true,
    "message": "User deleted successfully",
    "data": {
      "id": 4,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "age": 26,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T12:00:00.000Z"
    }
  }
  ```

## Validation Rules

### User Model
- **name**: Required, 2-50 characters
- **email**: Required, valid email format, unique
- **age**: Required, integer between 1-120

### Error Responses
All error responses follow this format:
```json
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed error message"
}
```

## Sample Data

The API comes with pre-loaded sample users:
- John Doe (john@example.com, age: 30)
- Jane Smith (jane@example.com, age: 25)
- Bob Johnson (bob@example.com, age: 35)

## Testing

The project includes comprehensive tests covering:
- All API endpoints (GET, POST, PUT, DELETE)
- Input validation
- Error handling
- Edge cases
- User model functionality

### Test Coverage
- API endpoint tests: Complete CRUD operations
- Model tests: Validation and constructor functionality
- Error handling: Invalid inputs, missing resources
- Security: Duplicate email handling

## Security Features

- **Helmet**: Adds security headers
- **CORS**: Configurable cross-origin requests
- **Input Validation**: Joi schema validation
- **Error Handling**: Prevents information leakage
- **Request Size Limiting**: 10MB JSON payload limit

## Dependencies

### Production
- **express**: Web framework
- **cors**: Cross-origin resource sharing
- **helmet**: Security middleware
- **morgan**: HTTP request logger
- **joi**: Input validation
- **dotenv**: Environment configuration

### Development
- **jest**: Testing framework
- **supertest**: HTTP testing library
- **nodemon**: Development server with auto-restart

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| NODE_ENV | development | Environment mode |

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## API Testing with curl

### Get all users
```bash
curl http://localhost:3000/api/users
```

### Create a user
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","age":28}'
```

### Update a user
```bash
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name","age":31}'
```

### Delete a user
```bash
curl -X DELETE http://localhost:3000/api/users/1
```