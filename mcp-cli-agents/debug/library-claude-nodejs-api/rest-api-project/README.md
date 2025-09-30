# Node.js REST API

A complete Node.js REST API built with Express.js, featuring user management with full CRUD operations, input validation, error handling, and comprehensive testing.

## Features

- **Express.js** server with essential middleware
- **CRUD operations** for user management
- **Input validation** using Joi
- **Error handling** with custom middleware
- **Security** with Helmet and CORS
- **Logging** with Morgan
- **Testing** with Jest and Supertest
- **In-memory data store** (easily replaceable with database)

## Project Structure

```
rest-api-project/
├── src/
│   ├── controllers/
│   │   └── userController.js     # User business logic
│   ├── middleware/
│   │   └── errorHandler.js       # Global error handling
│   ├── models/
│   │   ├── User.js              # User model with validation
│   │   └── userStore.js         # In-memory data store
│   ├── routes/
│   │   └── userRoutes.js        # User route definitions
│   ├── utils/
│   └── server.js                # Main server file
├── tests/
│   ├── models/
│   │   └── User.test.js         # User model tests
│   └── users.test.js            # API endpoint tests
├── config/
├── package.json
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. **Clone or download** this project
2. **Navigate** to the project directory:
   ```bash
   cd rest-api-project
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```

## Usage

### Development Mode
Start the server with auto-reload:
```bash
npm run dev
```

### Production Mode
Start the server:
```bash
npm start
```

The server will start on `http://localhost:3000` by default.

## API Endpoints

### Health Check
- **GET** `/health` - Check server status

### Users
- **GET** `/api/users` - Get all users
- **GET** `/api/users/:id` - Get user by ID
- **POST** `/api/users` - Create new user
- **PUT** `/api/users/:id` - Update user
- **DELETE** `/api/users/:id` - Delete user

## API Usage Examples

### Get all users
```bash
curl http://localhost:3000/api/users
```

### Get user by ID
```bash
curl http://localhost:3000/api/users/USER_ID
```

### Create new user
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  }'
```

### Update user
```bash
curl -X PUT http://localhost:3000/api/users/USER_ID \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "age": 31
  }'
```

### Delete user
```bash
curl -X DELETE http://localhost:3000/api/users/USER_ID
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

## Validation Rules

### User Model
- **name**: Required, 2-50 characters
- **email**: Required, valid email format, unique
- **age**: Required, integer between 1-120

## Testing

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
```

## Dependencies

### Production Dependencies
- **express**: Fast, unopinionated web framework
- **cors**: Enable Cross-Origin Resource Sharing
- **helmet**: Security middleware
- **morgan**: HTTP request logger
- **joi**: Data validation library
- **uuid**: Generate unique identifiers

### Development Dependencies
- **nodemon**: Auto-restart server on changes
- **jest**: Testing framework
- **supertest**: HTTP assertion library

## Security Features

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: Comprehensive validation using Joi
- **Error Handling**: Secure error responses without sensitive data exposure

## Future Enhancements

- Database integration (MongoDB, PostgreSQL, etc.)
- Authentication and authorization (JWT)
- Rate limiting
- API documentation with Swagger
- Pagination for large datasets
- Caching with Redis
- Docker containerization
- CI/CD pipeline

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run tests to ensure they pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details