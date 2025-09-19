# Contributing to Developer Intelligence Assistant

Thank you for your interest in contributing to the Developer Intelligence Assistant! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.ai) for local AI
- Git

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd developer-intelligence-assistant
   ```

2. **Run the development setup:**
   ```bash
   ./scripts/start-dev.sh
   ```

3. **Access the application:**
   - Web UI: http://localhost:3000
   - API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## 🏗️ Project Structure

```
developer-intelligence-assistant/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── models/         # Pydantic models and SQLAlchemy schemas
│   │   ├── services/       # Business logic services
│   │   ├── connectors/     # Data source connectors
│   │   └── main.py         # FastAPI application
│   └── requirements.txt
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   └── App.js          # Main application
│   └── package.json
├── cli/                    # Command-line interface
│   ├── dia_cli.py          # CLI implementation
│   └── requirements.txt
├── slack-bot/              # Slack bot integration
├── scripts/                # Development and deployment scripts
└── docs/                   # Documentation
```

## 🔧 Development Guidelines

### Code Style

#### Python (Backend)
- Follow [PEP 8](https://pep8.org/) style guide
- Use type hints for all function parameters and return values
- Use async/await for I/O operations
- Maximum line length: 100 characters

#### JavaScript/React (Frontend)
- Use ES6+ features
- Follow React best practices and hooks patterns
- Use functional components over class components
- Use meaningful component and variable names

#### General
- Write clear, descriptive commit messages
- Add comments for complex logic
- Include docstrings for all public functions
- Write tests for new features

### Testing

#### Backend Tests
```bash
cd backend
python -m pytest tests/
```

#### Frontend Tests
```bash
cd frontend
npm test
```

### Adding New Data Source Connectors

1. **Create connector class:**
   ```python
   # backend/app/connectors/your_connector.py
   from .base_connector import BaseConnector
   
   class YourConnector(BaseConnector):
       def __init__(self):
           super().__init__()
           self.display_name = "Your Service"
           self.description = "Description of your service"
       
       async def fetch_documents(self):
           # Implementation
           pass
       
       async def fetch_documents_since(self, since_date, sync_token):
           # Incremental sync implementation
           pass
   ```

2. **Register connector:**
   ```python
   # backend/app/services/data_source_service.py
   self.connectors = {
       "your_service": YourConnector,
       # ... existing connectors
   }
   ```

3. **Add frontend form fields:**
   ```javascript
   // frontend/src/components/DataSourceForm.js
   your_service: {
     name: 'Your Service',
     fields: [
       { key: 'your_service_url', label: 'Service URL', type: 'url' },
       { key: 'your_service_token', label: 'API Token', type: 'password' }
     ]
   }
   ```

## 📝 Pull Request Process

1. **Fork the repository** and create your feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes** following the coding guidelines

3. **Add tests** for your changes

4. **Update documentation** if needed

5. **Commit your changes:**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

6. **Push to your fork:**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Create a Pull Request** with:
   - Clear title and description
   - Reference any related issues
   - Screenshots for UI changes
   - Test results

### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Examples:
```
feat(auth): add user registration
fix(sync): resolve incremental sync issue
docs(readme): update installation instructions
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment information:**
   - OS and version
   - Python version
   - Node.js version
   - Browser (for frontend issues)

2. **Steps to reproduce:**
   - Clear, numbered steps
   - Expected vs actual behavior
   - Screenshots if applicable

3. **Error messages:**
   - Full error messages
   - Stack traces
   - Log files

## 💡 Feature Requests

For feature requests, please provide:

1. **Use case:** Why is this feature needed?
2. **Description:** What should the feature do?
3. **Acceptance criteria:** How do we know it's complete?
4. **Mockups:** UI mockups if applicable

## 🔒 Security

If you discover a security vulnerability, please:

1. **Do not** create a public issue
2. Email the maintainers directly
3. Provide detailed information about the vulnerability
4. Allow time for the issue to be addressed before disclosure

## 📚 Documentation

Help improve our documentation:

- Fix typos and grammar
- Add examples and use cases
- Improve API documentation
- Create tutorials and guides

## 🤝 Community

- Be respectful and inclusive
- Help others in discussions
- Share your use cases and feedback
- Participate in code reviews

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Project documentation

Thank you for contributing to Developer Intelligence Assistant! 🎉