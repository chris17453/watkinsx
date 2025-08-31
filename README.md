# Webmail Platform

A modern, multi-tenant webmail client built with FastAPI (Python) and React (TypeScript). Features multiple domain support, user management, account switching, and a fully themeable interface.

## Features

- **Multi-tenant Architecture**: Support for multiple domains with isolated user management
- **Account Switching**: Users can link and switch between multiple email accounts on the same server
- **Themeable Interface**: Built-in theme system with CSS variables, supports light/dark modes and custom themes
- **IMAP Support**: Full IMAP integration for email fetching, folder management, and message operations
- **Responsive Design**: Modern UI that works on desktop and mobile devices
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Real-time Updates**: Async operations for better performance

## Architecture

### Backend (FastAPI)
- **Models**: SQLAlchemy models for domains, users, email accounts, and themes
- **Authentication**: JWT tokens with domain-aware user sessions
- **IMAP Service**: Async IMAP client using aioimaplib
- **API Endpoints**: RESTful API for all email and user management operations

### Frontend (React + TypeScript)
- **Context Management**: Auth and Theme contexts for global state
- **Styled Components**: CSS-in-JS with theme variables support
- **Responsive Layout**: Modern email client interface with sidebar navigation
- **Account Switching**: Seamless switching between linked email accounts

## Installation

### Prerequisites
- Python 3.8+
- Node.js 14+
- PostgreSQL
- Redis (optional, for caching)

### Backend Setup

1. **Clone and setup Python environment**:
```bash
cd webmail-platform/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Database Setup**:
```bash
# Create PostgreSQL database
createdb webmail_db
createuser webmail_user
# Grant permissions to user for the database
```

3. **Environment Configuration**:
```bash
cp .env.example .env
# Edit .env file with your database credentials and secret keys
```

4. **Database Migration**:
```bash
alembic upgrade head
```

5. **Run the backend**:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

1. **Install dependencies**:
```bash
cd webmail-platform/frontend
npm install
```

2. **Environment Configuration**:
```bash
# Create .env file if needed
echo "REACT_APP_API_URL=http://localhost:8000/api" > .env
```

3. **Run the frontend**:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Configuration

### Domain Setup

Before users can log in, you need to create at least one domain. You can do this through the API or by creating an admin user and using the web interface.

**Create a domain via API**:
```bash
curl -X POST "http://localhost:8000/api/domains/" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "example.com",
       "imap_server": "imap.example.com",
       "imap_port": 993,
       "smtp_server": "smtp.example.com", 
       "smtp_port": 587,
       "use_ssl": true
     }'
```

### User Creation

Users can be created through the API. The first user should be made an admin:

```python
# Example script to create an admin user
from app.database.database import SessionLocal
from app.models.models import User, Domain
from app.core.security import get_password_hash

db = SessionLocal()

# Get domain
domain = db.query(Domain).first()

# Create admin user
admin_user = User(
    username="admin",
    email="admin@example.com",
    hashed_password=get_password_hash("secure_password"),
    full_name="Admin User",
    is_admin=True,
    domain_id=domain.id
)

db.add(admin_user)
db.commit()
```

## Theming

The application supports custom themes through CSS variables. You can create new themes by:

1. **Built-in Themes**: Light, Dark, Blue Ocean, Forest Green
2. **Custom Themes**: Define CSS variables in the theme context
3. **Domain-specific Themes**: Configure default themes per domain
4. **User Preferences**: Users can override domain themes

### Theme Variables
```css
:root {
  --primary-color: #2563eb;
  --background-color: #ffffff;
  --surface-color: #f8fafc;
  --text-primary: #0f172a;
  --sidebar-bg: #1e293b;
  /* ... more variables */
}
```

## API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation (Swagger UI).

### Key Endpoints

- **Authentication**: `/api/auth/login`, `/api/auth/me`
- **Domains**: `/api/domains/` (admin only)
- **Users**: `/api/users/me/accounts`
- **Emails**: `/api/emails/messages`, `/api/emails/folders`

## Security Features

- **Password Hashing**: bcrypt with salt
- **JWT Authentication**: Secure token-based authentication
- **Domain Isolation**: Users can only access their domain's resources
- **CORS Protection**: Configurable origin restrictions
- **Input Validation**: Pydantic models for request validation

## Development

### Backend Development
```bash
# Run with auto-reload
uvicorn app.main:app --reload

# Run tests (when implemented)
pytest

# Generate migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head
```

### Frontend Development
```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Production Deployment

### Backend
- Use a production WSGI server like Gunicorn
- Set up proper environment variables
- Configure PostgreSQL with proper users and permissions
- Set up Redis for session storage and caching
- Use proper SSL certificates

### Frontend
- Build the React app (`npm run build`)
- Serve static files through nginx or similar
- Configure proper API URLs

### Database
- Set up regular backups
- Configure connection pooling
- Monitor performance

### Security
- Use strong secret keys
- Configure proper CORS settings
- Set up rate limiting
- Regular security updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please use the GitHub issue tracker.# watkinsx
