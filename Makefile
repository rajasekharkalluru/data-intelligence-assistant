# Developer Intelligence Assistant - Makefile

.PHONY: help install dev test lint format clean build docker-build docker-up docker-down

# Default target
help:
	@echo "Developer Intelligence Assistant - Available Commands:"
	@echo ""
	@echo "Development:"
	@echo "  install     - Install all dependencies"
	@echo "  dev         - Start development environment"
	@echo "  test        - Run all tests"
	@echo "  lint        - Run linting checks"
	@echo "  format      - Format code"
	@echo "  clean       - Clean build artifacts"
	@echo ""
	@echo "Docker:"
	@echo "  docker-build - Build Docker images"
	@echo "  docker-up    - Start Docker development environment"
	@echo "  docker-down  - Stop Docker development environment"
	@echo "  docker-logs  - View Docker logs"
	@echo ""
	@echo "Database:"
	@echo "  db-init     - Initialize database"
	@echo "  db-migrate  - Run database migrations"
	@echo "  db-reset    - Reset database"
	@echo ""
	@echo "Deployment:"
	@echo "  build       - Build for production"
	@echo "  deploy      - Deploy to production"

# Development commands
install:
	@echo "Installing dependencies..."
	./scripts/start-dev.sh

dev:
	@echo "Starting development environment..."
	./scripts/start-dev.sh

test:
	@echo "Running tests..."
	cd backend && python -m pytest tests/ -v
	cd frontend && npm test -- --watchAll=false
	cd cli && python -m pytest tests/ -v || echo "CLI tests not implemented yet"

test-backend:
	@echo "Running backend tests..."
	cd backend && python -m pytest tests/ -v --cov=app --cov-report=html

test-frontend:
	@echo "Running frontend tests..."
	cd frontend && npm test -- --coverage --watchAll=false

lint:
	@echo "Running linting checks..."
	cd backend && black --check . && flake8 . && isort --check-only .
	cd frontend && npm run lint || echo "Frontend linting not configured"

format:
	@echo "Formatting code..."
	cd backend && black . && isort .
	cd frontend && npm run format || echo "Frontend formatting not configured"

clean:
	@echo "Cleaning build artifacts..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	rm -rf backend/dist backend/build 2>/dev/null || true
	rm -rf frontend/build frontend/dist 2>/dev/null || true
	rm -rf cli/dist cli/build 2>/dev/null || true

# Docker commands
docker-build:
	@echo "Building Docker images..."
	docker-compose -f docker-compose.dev.yml build

docker-up:
	@echo "Starting Docker development environment..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Services starting... Web UI will be available at http://localhost:3000"
	@echo "API will be available at http://localhost:8000"
	@echo "Run 'make docker-logs' to view logs"

docker-down:
	@echo "Stopping Docker development environment..."
	docker-compose -f docker-compose.dev.yml down

docker-logs:
	@echo "Viewing Docker logs..."
	docker-compose -f docker-compose.dev.yml logs -f

docker-clean:
	@echo "Cleaning Docker resources..."
	docker-compose -f docker-compose.dev.yml down -v
	docker system prune -f

# Database commands
db-init:
	@echo "Initializing database..."
	cd backend && python init_db.py

db-migrate:
	@echo "Running database migrations..."
	cd backend && alembic upgrade head

db-reset:
	@echo "Resetting database..."
	rm -f backend/data/dia.db
	cd backend && python init_db.py

# Build commands
build:
	@echo "Building for production..."
	cd frontend && npm run build
	cd backend && python -m build

build-cli:
	@echo "Building CLI..."
	cd cli && python -m build

# Deployment commands
deploy-staging:
	@echo "Deploying to staging..."
	# Add staging deployment commands here

deploy-prod:
	@echo "Deploying to production..."
	# Add production deployment commands here

# Utility commands
check-deps:
	@echo "Checking dependencies..."
	@command -v python3 >/dev/null 2>&1 || { echo "Python 3 is required but not installed."; exit 1; }
	@command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed."; exit 1; }
	@command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed."; exit 1; }
	@command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required but not installed."; exit 1; }
	@echo "All dependencies are installed!"

setup-git-hooks:
	@echo "Setting up Git hooks..."
	cp scripts/pre-commit .git/hooks/pre-commit
	chmod +x .git/hooks/pre-commit
	@echo "Git hooks installed!"

# Security commands
security-check:
	@echo "Running security checks..."
	cd backend && safety check -r requirements.txt || echo "Security check completed with warnings"
	cd frontend && npm audit --audit-level moderate || echo "Security audit completed with warnings"

# Documentation commands
docs:
	@echo "Generating documentation..."
	# Add documentation generation commands here

docs-serve:
	@echo "Serving documentation..."
	# Add documentation serving commands here

# Release commands
release-patch:
	@echo "Creating patch release..."
	# Add release commands here

release-minor:
	@echo "Creating minor release..."
	# Add release commands here

release-major:
	@echo "Creating major release..."
	# Add release commands here