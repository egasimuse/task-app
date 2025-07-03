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
