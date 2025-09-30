# Node.js REST API

A complete Node.js REST API built with Express.js, featuring user management with full CRUD operations, input validation, error handling, and comprehensive testing.

## Features

- **Express.js** server with essential middleware
- **CORS** support for cross-origin requests
- **Helmet** for security headers
- **Morgan** for request logging
- **User CRUD operations** (Create, Read, Update, Delete)
- **Input validation** using Joi
- **Error handling** middleware
- **Comprehensive tests** using Jest and Supertest
- **In-memory data storage** (easily replaceable with database)

## API Endpoints

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users` | Create a new user |
| PUT | `/api/users/:id` | Update user by ID |
| DELETE | `/api/users/:id` | Delete user by ID |

### User Schema

```json
{
  "id": "string (UUID)",
  "name": "string (2-100 chars)",
  "email": "string (valid email)",
  "age": "number (1-150)",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

## Project Structure

```
node-api-project/
├── src/
│   ├── controllers/
│   │   └── userController.js     # User route handlers
│   ├── middleware/
│   │   └── errorHandler.js       # Global error handling
│   ├── models/
│   │   └── User.js               # User model with validation
│   ├── routes/
│   │   └── userRoutes.js         # User route definitions
│   └── app.js                    # Main application file
├── tests/
│   └── user.test.js              # API tests
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone or download the project
2. Navigate to the project directory:
   ```bash
   cd node-api-project
   ```

3. Install dependencies:
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

The server will start on `http://localhost:3000`

### Running Tests

#### Run all tests
```bash
npm test
```

#### Run tests in watch mode
```bash
npm run test:watch
```

#### Run tests with coverage
```bash
npm run test:coverage
```

## API Usage Examples

### Get all users
```bash
curl -X GET http://localhost:3000/api/users
```

### Get user by ID
```bash
curl -X GET http://localhost:3000/api/users/{user-id}
```

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

### Update a user
```bash
curl -X PUT http://localhost:3000/api/users/{user-id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "age": 31
  }'
```

### Delete a user
```bash
curl -X DELETE http://localhost:3000/api/users/{user-id}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "count": 10
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |

## Dependencies

### Production
- **express**: Web framework
- **cors**: Cross-origin resource sharing
- **helmet**: Security middleware
- **morgan**: HTTP request logger
- **joi**: Data validation
- **uuid**: UUID generation

### Development
- **jest**: Testing framework
- **supertest**: HTTP assertion library
- **nodemon**: Development server with auto-restart

## Development

### Adding New Features

1. Create model in `src/models/`
2. Add validation schema
3. Create controller in `src/controllers/`
4. Define routes in `src/routes/`
5. Add routes to main app in `src/app.js`
6. Write tests in `tests/`

### Database Integration

To integrate with a real database:

1. Install database driver (e.g., `pg` for PostgreSQL, `mysql2` for MySQL)
2. Replace in-memory storage in `src/models/User.js`
3. Add database configuration
4. Update model methods to use database queries

## Testing

The project includes comprehensive tests covering:

- All CRUD operations
- Input validation
- Error handling
- Edge cases
- HTTP status codes

Tests are written using Jest and Supertest for HTTP testing.

## Security Features

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configurable cross-origin requests
- **Input Validation**: Validates all user inputs
- **Error Handling**: Prevents information leakage
- **JSON Parsing Limits**: Prevents payload attacks

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Submit a pull request