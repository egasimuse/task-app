# Task Management Application

A complete full-stack task management application with Node.js/Express API, React frontend, and Symfony PHP admin panel, all containerized with Docker.

## Architecture Overview

This application consists of four main components:

- **API Server** (Node.js/Express) - RESTful API backend
- **Frontend App** (React) - User-facing web application
- **Admin Panel** (Symfony PHP) - Administrative interface
- **Database** (MySQL 8.0) - Database

## Quick Start (Production Mode)

### Prerequisites
- Docker Desktop
- Docker Compose
- Git

### 1. Clone and Start
```bash
git clone https://github.com/egasimuse/task-app.git
cd task-app
docker-compose up -d
```

### 2. Access Applications
- **Frontend (Users)**: http://localhost:3000
- **Admin Panel**: http://localhost:8080
- **API Server**: http://localhost:5000
- **Database**: localhost:3306

### 3. Default Credentials
- **Admin Login**: admin@example.com / password

### Prerequisites for Development
- Node.js (v18 or higher)
- PHP (v8.2 or higher)
- Composer
- MySQL 8.0
- Docker Desktop (optional but recommended)

---

### Verify Installation
- Frontend: http://localhost:3000
- Admin Panel: http://localhost:8080
- API Health: http://localhost:5000/api/health


### Development Logs
```bash
# Docker logs
docker-compose logs -f api
docker-compose logs -f frontend
docker-compose logs -f admin-panel
docker-compose logs -f database

# Individual service logs
tail -f api/logs/development.log
tail -f admin-panel/var/log/dev.log
```

### Running Jest Tests
```bash
cd api
npm test
```

### Useful Commands
```bash
# Start all containers
docker-compose up -d

# Start with logs visible
docker-compose up

# Reset entire development environment
docker-compose down -v
docker-compose up --build

# Reset just the database
docker-compose down database
docker-compose up database

# View all container status
docker-compose ps

# Access container shell
docker-compose exec api sh
docker-compose exec admin-panel bash
```

## 🧪 Testing

### API Testing with Jest

The API includes a comprehensive test suite using Jest and Supertest for unit and integration testing.

#### Test Setup
```bash
cd api
npm install  # Install testing dependencies (Jest, Supertest)
```

#### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode (automatically re-run on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npx jest __tests__/controllers/authController.test.js

# Run tests matching a pattern
npx jest --testNamePattern="should register"
```

#### Test Coverage

The test suite includes:

**Unit Tests:**
- ✅ Authentication Controller (register, login, token validation)
- ✅ Tasks Controller (CRUD operations, assignment, completion)
- ✅ Users Controller (user management, role-based operations)
- ✅ Authentication Middleware (token verification, error handling)

**Integration Tests:**
- ✅ API Routes (auth, tasks, users endpoints)
- ✅ Server Configuration (CORS, JSON parsing, error handling)
- ✅ Complete request/response cycles

**Test Features:**
- Database mocking for isolated testing
- Comprehensive error scenario testing
- Authentication flow testing
- Input validation testing
- Edge case and boundary testing

#### Test Structure
```
api/__tests__/
├── setup.js                    # Test configuration and mocks
├── server.test.js              # Server integration tests
├── controllers/                # Controller unit tests
│   ├── authController.test.js
│   ├── tasksController.test.js
│   └── usersController.test.js
├── middleware/                 # Middleware tests
│   └── auth.test.js
└── routes/                     # Route integration tests
    ├── auth.test.js
    ├── tasks.test.js
    └── users.test.js
```

#### Coverage Goals
- Controllers: 95%+ line coverage
- Routes: 100% endpoint coverage
- Middleware: 100% branch coverage
- Error handling: All error paths tested

### Frontend Testing
```bash
cd frontend
npm test

# Run tests in watch mode
npm test -- --watch
```

### Admin Panel Testing
```bash
cd admin-panel
php bin/phpunit
```

### Manual Testing
- Use the frontend application interface
- Use the admin panel interface
- API endpoints can be tested with Postman or curl

### Example Test Commands
```bash
# Test API health endpoint
curl http://localhost:5000/api/health

# Test user registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Test user login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```
