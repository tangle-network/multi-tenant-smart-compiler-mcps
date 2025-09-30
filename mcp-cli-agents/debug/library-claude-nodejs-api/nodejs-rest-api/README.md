# Node.js REST API

A complete Node.js REST API built with Express.js, featuring user management with full CRUD operations, input validation, error handling, and comprehensive testing.

## Features

- **Express.js** server with essential middleware
- **CORS** support for cross-origin requests
- **Helmet** for security headers
- **Morgan** for HTTP request logging
- **User management** with full CRUD operations
- **Input validation** using Joi
- **Error handling** middleware
- **Comprehensive tests** with Jest and Supertest
- **Clean project structure**

## Project Structure

```
nodejs-rest-api/
├── src/
│   ├── controllers/
│   │   └── userController.js    # User business logic
│   ├── middleware/
│   │   └── errorHandler.js      # Global error handling
│   ├── models/
│   │   └── User.js              # User model with validation
│   ├── routes/
│   │   └── userRoutes.js        # User API routes
│   └── server.js                # Main application file
├── tests/
│   └── user.test.js             # User API tests
├── config/                      # Configuration files (optional)
├── jest.config.js               # Jest testing configuration
├── package.json                 # Project dependencies and scripts
└── README.md                    # This file
```

## Installation

1. **Clone or download** this project
2. **Navigate** to the project directory:
   ```bash
   cd nodejs-rest-api
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```

## Usage

### Development Mode
Start the server with auto-restart on file changes:
```bash
npm run dev
```

### Production Mode
Start the server:
```bash
npm start
```

The server will run on `http://localhost:3000` by default.

## API Endpoints

### Base URL
```
http://localhost:3000
```

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users` | Create new user |
| PUT | `/api/users/:id` | Update user by ID |
| DELETE | `/api/users/:id` | Delete user by ID |

### User Model
```json
{
  "id": "uuid",
  "name": "string (2-50 chars, required)",
  "email": "string (valid email, required, unique)",
  "age": "number (1-120, optional)",
  "role": "string ('user' or 'admin', default: 'user')",
  "createdAt": "ISO string",
  "updatedAt": "ISO string"
}
```

## API Examples

### Create User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "role": "user"
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
curl -X PUT http://localhost:3000/api/users/{user-id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "age": 31
  }'
```

### Delete User
```bash
curl -X DELETE http://localhost:3000/api/users/{user-id}
```

## Testing

### Run Tests Once
```bash
npm run test:once
```

### Run Tests in Watch Mode
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

## Environment Variables

You can customize the server behavior using environment variables:

- `PORT` - Server port (default: 3000)

Example:
```bash
PORT=8000 npm start
```

## Error Handling

The API includes comprehensive error handling for:
- Validation errors
- Duplicate entries
- Resource not found
- Invalid data types
- Server errors

All errors return JSON responses with consistent structure:
```json
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed error message"
}
```

## Response Format

All successful API responses follow this format:
```json
{
  "success": true,
  "message": "Optional success message",
  "data": "Response data",
  "count": "Number of items (for arrays)"
}
```

## Development

### Adding New Features
1. Create models in `src/models/`
2. Add controllers in `src/controllers/`
3. Define routes in `src/routes/`
4. Register routes in `src/server.js`
5. Add tests in `tests/`

### Code Style
- Use semicolons
- Use single quotes for strings
- Use camelCase for variables and functions
- Use PascalCase for classes
- Add proper error handling

## Dependencies

### Production Dependencies
- **express**: Web framework
- **cors**: Cross-origin resource sharing
- **helmet**: Security middleware
- **morgan**: HTTP request logger
- **joi**: Input validation
- **uuid**: UUID generation

### Development Dependencies
- **nodemon**: Auto-restart server during development
- **jest**: Testing framework
- **supertest**: HTTP assertion library

## License

MIT License

## Contributing

1. Fork the project
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## Support

For issues and questions, please create an issue in the project repository.