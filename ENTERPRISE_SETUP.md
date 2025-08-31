# Enterprise Webmail Platform - Complete Setup Guide

## 🚀 **Enterprise-Ready Multi-Tenant Email Client**

This is a fully functional, production-ready webmail platform built for enterprise use with multi-domain support, advanced user management, and comprehensive email functionality.

---

## 🏗️ **Architecture Overview**

### **Backend (FastAPI)**
- **Multi-tenant architecture** with domain isolation
- **Full IMAP/SMTP integration** with connection pooling
- **Advanced email service** with attachments, search, and folder management
- **Comprehensive admin API** for domain and user management
- **Enterprise security** with JWT authentication and role-based access
- **SQLite/PostgreSQL support** with Alembic migrations

### **Frontend (React + TypeScript)**
- **Modern responsive UI** with dark/light theme support
- **Complete admin interface** for system management
- **Email composition** with attachment support
- **Advanced folder navigation** and search capabilities
- **Account switching** for users with multiple email accounts
- **Themeable interface** with CSS variables

---

## 🔧 **Current Service Status**

### **✅ Running Services:**

**Backend API:** http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Admin endpoints: `/api/admin/*`
- Email endpoints: `/api/emails/*`
- User management: `/api/users/*`

**Frontend Web App:** http://localhost:3000
- Login interface with theme switching
- Full dashboard with email functionality
- Admin interface (admin users only)
- Settings and account management

---

## 🔑 **Access Information**

### **Demo Admin Login:**
- **Username:** `admin`
- **Password:** `admin123`
- **Domain:** `localhost` (auto-detected)

### **Database Location:**
- **File:** `/home/nd/thin/webmail-platform/backend/webmail.db`
- **Type:** SQLite (easily migrated to PostgreSQL)

---

## 📋 **Enterprise Features Implemented**

### **✅ Complete Email Functionality**
- **IMAP Integration:** Full async IMAP client with connection pooling
- **SMTP Integration:** Email sending with attachment support
- **Folder Management:** Browse all IMAP folders with unread counts
- **Email Search:** Server-side and client-side search capabilities
- **Attachments:** Full support for file uploads and downloads
- **Message Actions:** Move, delete, mark as read/unread

### **✅ Advanced Admin Interface**
- **System Dashboard:** Real-time statistics and monitoring
- **Domain Management:** Add/edit/delete domains with IMAP/SMTP settings
- **User Management:** Create/manage users across domains
- **Email Account Oversight:** Monitor all configured email accounts
- **Security Controls:** Activate/deactivate users and domains

### **✅ Multi-Tenant Architecture**
- **Domain Isolation:** Complete separation between domains
- **User Roles:** Admin and regular user permissions
- **Account Switching:** Users can manage multiple email accounts
- **Theme Management:** Per-user theme preferences

### **✅ Enterprise Security**
- **JWT Authentication:** Secure token-based auth with expiration
- **Password Hashing:** bcrypt with proper salting
- **Role-Based Access:** Admin-only routes and features
- **Input Validation:** Comprehensive request validation
- **CORS Protection:** Configurable origin restrictions

---

## 🚀 **How to Use - Enterprise Scenarios**

### **1. Domain Administration**

**Add a new email domain (e.g., Gmail, Office365, custom mail server):**

1. Login as admin at http://localhost:3000
2. Go to **Admin** → **Domains**
3. Click **Add Domain** and configure:
   ```
   Domain: yourdomain.com
   IMAP Server: imap.yourdomain.com
   IMAP Port: 993
   SMTP Server: smtp.yourdomain.com  
   SMTP Port: 587
   SSL: Yes
   ```

**Or via API:**
```bash
curl -X POST "http://localhost:8000/api/admin/domains" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "yourdomain.com",
    "imap_server": "imap.yourdomain.com",
    "imap_port": 993,
    "smtp_server": "smtp.yourdomain.com",
    "smtp_port": 587,
    "use_ssl": true
  }'
```

### **2. User Management**

**Create users for domains:**
1. Go to **Admin** → **Users**
2. Click **Add User**
3. Fill user details and assign to domain
4. Set admin privileges if needed

**Or via API:**
```bash
curl -X POST "http://localhost:8000/api/admin/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john.doe",
    "email": "john.doe@yourdomain.com",
    "password": "secure_password",
    "domain_id": 1,
    "full_name": "John Doe",
    "is_admin": false
  }'
```

### **3. Email Account Configuration**

**Users can add their email accounts:**
1. Login as regular user
2. Go to **Settings** → **Add Email Account**
3. Configure IMAP credentials:
   ```
   Email: user@domain.com
   Username: user@domain.com
   Password: [app password or regular password]
   ```

### **4. Real Email Server Integration**

**Example configurations for popular providers:**

**Gmail:**
```
IMAP Server: imap.gmail.com:993 (SSL)
SMTP Server: smtp.gmail.com:587 (TLS)
Username: your-email@gmail.com
Password: App Password (not regular password)
```

**Office365:**
```
IMAP Server: outlook.office365.com:993 (SSL)
SMTP Server: smtp.office365.com:587 (TLS)  
Username: your-email@company.com
Password: Regular password or App Password
```

**Custom Mail Server:**
```
IMAP Server: mail.yourcompany.com:993 (SSL)
SMTP Server: mail.yourcompany.com:587 (TLS)
Username: username (or full email)
Password: Account password
```

---

## 🔧 **Production Deployment**

### **Backend Deployment**

1. **Environment Setup:**
   ```bash
   cp backend/.env.example backend/.env
   # Edit .env with production values:
   # - Strong SECRET_KEY
   # - PostgreSQL DATABASE_URL  
   # - Production ALLOWED_ORIGINS
   ```

2. **Database Migration:**
   ```bash
   # For PostgreSQL in production
   pip install psycopg2-binary
   alembic upgrade head
   ```

3. **Production Server:**
   ```bash
   pip install gunicorn
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```

### **Frontend Deployment**

1. **Build for Production:**
   ```bash
   cd frontend
   npm run build
   # Serve build/ directory with nginx or similar
   ```

2. **Configure API URL:**
   ```bash
   echo "REACT_APP_API_URL=https://your-api-domain.com/api" > .env.production
   ```

### **Security Considerations**

- **SSL/TLS:** Use HTTPS for all communications
- **Secrets:** Use environment variables for all sensitive data
- **Database:** Use PostgreSQL with proper user permissions
- **Firewall:** Restrict access to necessary ports only
- **Backups:** Implement regular database backups
- **Monitoring:** Set up logging and monitoring
- **Updates:** Keep dependencies updated regularly

---

## 🎯 **Advanced Features Available**

### **Email Operations**
- Send emails with attachments
- Move messages between folders  
- Delete messages permanently
- Search emails by subject/sender
- View email statistics per account
- Handle HTML and plain text emails

### **Admin Capabilities**
- Real-time system statistics
- User activation/deactivation
- Domain management with testing
- Email account monitoring
- Bulk user operations
- System health monitoring

### **API Features**
- RESTful API with OpenAPI documentation
- Comprehensive error handling
- Rate limiting ready
- Pagination support
- Advanced search capabilities
- File upload handling

---

## 📊 **API Endpoints Summary**

### **Authentication**
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Current user info

### **Email Operations**
- `GET /api/emails/folders` - Get email folders
- `GET /api/emails/messages` - Get email list
- `GET /api/emails/message/{id}` - Get single email
- `POST /api/emails/send` - Send email with attachments
- `POST /api/emails/move/{id}` - Move email
- `DELETE /api/emails/message/{id}` - Delete email
- `GET /api/emails/search` - Search emails
- `GET /api/emails/statistics` - Email statistics

### **User Management**
- `GET /api/users/me/accounts` - Get user's email accounts
- `POST /api/users/me/accounts` - Add email account
- `PUT /api/users/me/accounts/{id}/primary` - Set primary account

### **Admin Operations** (Admin only)
- `GET /api/admin/statistics` - System statistics
- `GET /api/admin/domains` - List domains
- `POST /api/admin/domains` - Create domain
- `PUT /api/admin/domains/{id}` - Update domain
- `DELETE /api/admin/domains/{id}` - Delete domain
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/{id}` - Update user
- `DELETE /api/admin/users/{id}` - Delete user
- `GET /api/admin/email-accounts` - List all email accounts

---

## 🎨 **Theming and Customization**

The platform includes 4 built-in themes:
- **Light** - Clean professional look
- **Dark** - Modern dark interface  
- **Blue Ocean** - Blue-themed design
- **Forest Green** - Green-themed design

**Custom themes** can be added by extending the theme system in `ThemeContext.tsx`.

---

## 🔍 **Monitoring and Maintenance**

### **Health Checks**
- **API Health:** http://localhost:8000/
- **Database:** Check webmail.db file size and integrity
- **Email Connections:** Monitor IMAP/SMTP connection pools

### **Log Monitoring**
- **Backend Logs:** FastAPI server output
- **Frontend Logs:** Browser developer console
- **Email Errors:** Check IMAP service logs

### **Performance Optimization**
- **Connection Pooling:** IMAP connections are pooled and reused
- **Lazy Loading:** Email content loaded on demand
- **Caching:** Theme and user preferences cached
- **Pagination:** Email lists are paginated for performance

---

## 🏆 **Enterprise-Ready Features**

✅ **Multi-tenant with domain isolation**  
✅ **Full IMAP/SMTP email functionality**  
✅ **Advanced admin interface**  
✅ **User role management**  
✅ **Account switching capabilities**  
✅ **Themeable interface**  
✅ **Email attachments support**  
✅ **Search and folder management**  
✅ **Production-ready security**  
✅ **Comprehensive API documentation**  
✅ **Real-time statistics**  
✅ **Database migration support**  

---

**The platform is now fully operational and ready for enterprise deployment!**

Access your webmail platform at: **http://localhost:3000**  
API documentation at: **http://localhost:8000/docs**  
Admin login: **admin / admin123**