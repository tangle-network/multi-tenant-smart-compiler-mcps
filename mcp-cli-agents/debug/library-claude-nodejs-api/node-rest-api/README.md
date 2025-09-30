# Node.js REST API

A complete Node.js REST API built with Express.js featuring user management with full CRUD operations, input validation, error handling, and comprehensive testing.

## Features

- **Express.js** server with security middleware (CORS, Helmet, Morgan)
- **RESTful API** with full CRUD operations for users
- **Input validation** using Joi
- **Error handling** middleware
- **In-memory data storage** with sample data
- **Comprehensive test suite** with Jest and Supertest
- **Health check endpoint**
- **Proper project structure**

## Project Structure

```
node-rest-api/
├── src/
│   ├── controllers/
│   │   └── userController.js     # User CRUD operations
│   ├── middleware/
│   │   └── errorHandler.js       # Error handling middleware
│   ├── models/
│   │   ├── User.js              # User model with validation
│   │   └── userStore.js         # In-memory data store
│   ├── routes/
│   │   └── userRoutes.js        # User API routes
│   └── app.js                   # Express application setup
├── tests/
│   ├── models/
│   │   └── User.test.js         # User model tests
│   └── users.test.js            # API endpoint tests
├── config/                      # Configuration files
├── package.json
├── jest.config.js
└── README.md
```

## Installation

1. **Clone or download the project**
   ```bash
   cd node-rest-api
   ```

2. **Install dependencies**
   ```bash
   npm install
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

The server will start on port 3000 by default. You can change this by setting the `PORT` environment variable.

```bash
PORT=8000 npm start
```

## API Endpoints

### Base URL
```
http://localhost:3000
```

### Health Check
- **GET** `/health` - Check API health status

### Users API
Base path: `/api/users`

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET    | `/api/users` | Get all users | - |
| GET    | `/api/users/:id` | Get user by ID | - |
| POST   | `/api/users` | Create new user | `{ name, email, age }` |
| PUT    | `/api/users/:id` | Update user | `{ name?, email?, age? }` |
| DELETE | `/api/users/:id` | Delete user | - |

### Request/Response Examples

#### Create User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  }'
```

#### Response Format
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z"
  }
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "\"name\" length must be at least 2 characters long"
  ]
}
```

## Validation Rules

### User Model
- **name**: String, 2-50 characters, required
- **email**: Valid email format, required, unique
- **age**: Integer, 1-120, required

## Testing

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Test Coverage
The test suite includes:
- Unit tests for the User model
- Integration tests for all API endpoints
- Validation testing
- Error handling testing

## Dependencies

### Production
- **express**: Web framework
- **cors**: Cross-origin resource sharing
- **helmet**: Security middleware
- **morgan**: HTTP request logger
- **joi**: Data validation
- **uuid**: UUID generation

### Development
- **nodemon**: Development server with auto-restart
- **jest**: Testing framework
- **supertest**: HTTP testing library

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment mode |

## Error Handling

The API includes comprehensive error handling:
- Input validation errors (400)
- Resource not found errors (404)
- Duplicate resource errors (409)
- Server errors (500)

All errors return a consistent JSON format:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Security Features

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configurable cross-origin resource sharing
- **Input validation**: All inputs are validated using Joi
- **Error sanitization**: Sensitive error details are hidden in production

## Sample Data

The API comes with 3 sample users:
- John Doe (john@example.com, age 30)
- Jane Smith (jane@example.com, age 25)
- Bob Johnson (bob@example.com, age 35)

## Future Enhancements

- Database integration (PostgreSQL/MongoDB)
- Authentication and authorization
- Rate limiting
- API documentation with Swagger
- Logging improvements
- Docker containerization
- Environment-based configuration

## License

MIT License