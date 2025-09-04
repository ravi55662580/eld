# ELD Software Backend API

A comprehensive backend API for Electronic Logging Device (ELD) software, built with Node.js, Express, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js (16.0.0 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone and navigate to the backend directory:**
   ```bash
   cd eld-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB:**
   ```bash
   # If using local MongoDB
   mongod

   # Or use MongoDB Atlas by updating MONGODB_URI in .env
   ```

5. **Seed the database:**
   ```bash
   npm run seed
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## 📁 Project Structure

```
eld-backend/
├── src/
│   ├── config/         # Database configuration
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # Express routes
│   ├── scripts/        # Utility scripts (seeding, etc.)
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── server.js       # Main application file
├── tests/              # Test files
├── .env                # Environment variables
├── .env.example        # Environment template
└── package.json        # Dependencies and scripts
```

## 🔑 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Login Credentials (After Seeding)

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Manager | manager | manager123 |
| Demo Account | demoaccount | demo123 |

## 📚 API Endpoints

Base URL: `http://localhost:5000/api/v1`

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | ❌ |
| POST | `/auth/login` | User login | ❌ |
| GET | `/auth/me` | Get current user profile | ✅ |
| PUT | `/auth/me` | Update user profile | ✅ |
| PUT | `/auth/change-password` | Change password | ✅ |

### Carriers
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/carriers` | Get all carriers | ✅ |
| POST | `/carriers` | Create new carrier | ✅ (Admin) |
| GET | `/carriers/:id` | Get carrier by ID | ✅ |
| PUT | `/carriers/:id` | Update carrier | ✅ (Admin/Manager) |

### Assets
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/assets` | Get all assets | ✅ |
| POST | `/assets` | Create new asset | ✅ |
| GET | `/assets/:id` | Get asset by ID | ✅ |
| PUT | `/assets/:id` | Update asset | ✅ |
| DELETE | `/assets/:id` | Delete asset | ✅ |

### Drivers
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/drivers` | Get all drivers | ✅ |
| POST | `/drivers` | Create new driver | ✅ |
| GET | `/drivers/:id` | Get driver by ID | ✅ |
| PUT | `/drivers/:id` | Update driver | ✅ |
| DELETE | `/drivers/:id` | Delete driver | ✅ |

### Notifications
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/notifications` | Get all notifications | ✅ |
| POST | `/notifications` | Create new notification | ✅ |
| GET | `/notifications/:id` | Get notification by ID | ✅ |
| PUT | `/notifications/:id` | Update notification | ✅ |
| DELETE | `/notifications/:id` | Delete notification | ✅ |

## 🔍 Query Parameters

### Assets
- `search` - Search by number, VIN, plate, make, model
- `homeBase` - Filter by home base
- `type` - Filter by asset type
- `active` - Filter by active status (true/false)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

### Drivers
- `search` - Search by name, username, license number
- `homeBase` - Filter by home base
- `active` - Filter by active status

### Notifications
- `search` - Search by name, emails
- `homeBase` - Filter by home base
- `type` - Filter by notification type

## 📝 Request/Response Examples

### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "login": "demoaccount",
  "password": "demo123"
}

# Response
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "username": "demoaccount",
      "email": "demo@limitlessworld.demo",
      "firstName": "Demo",
      "lastName": "Account",
      "role": "manager",
      "carrierId": "..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get Assets
```bash
GET /api/v1/assets?search=001&page=1&limit=10
Authorization: Bearer <token>

# Response
{
  "success": true,
  "data": {
    "assets": [
      {
        "_id": "...",
        "type": "Tractor",
        "assetSubtype": "Truck",
        "number": "001",
        "vin": "1GRAP0628DJ480001",
        "fuelType": "Diesel",
        "plate": "",
        "registrationState": "CA",
        "homeBase": "Home Terminal",
        "active": true,
        "make": "Freightliner",
        "model": "Cascadia",
        "year": 2020
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

### Create Asset
```bash
POST /api/v1/assets
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "Tractor",
  "assetSubtype": "Truck", 
  "number": "002",
  "vin": "1HGCM82633A004352",
  "fuelType": "Diesel",
  "plate": "ABC123",
  "registrationState": "CA",
  "homeBase": "Home Terminal",
  "make": "Volvo",
  "model": "VNL",
  "year": 2021,
  "active": true
}

# Response
{
  "success": true,
  "message": "Asset created successfully",
  "data": {
    "asset": { /* created asset object */ }
  }
}
```

## 🛠️ Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run seed       # Populate database with sample data
npm test           # Run tests (to be implemented)
```

## 🔧 Environment Variables

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/eld-software

# JWT Configuration  
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:5173

# API
API_PREFIX=/api/v1
```

## 🚨 Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "type": "ErrorType",
  "errors": [ /* validation errors if applicable */ ]
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt with salt rounds
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing configuration
- **Input Validation** - Express-validator for request validation
- **Rate Limiting** - (Can be added with express-rate-limit)

## 🗄️ Database Models

### User
- Authentication and authorization
- Roles: admin, manager, driver, dispatcher
- Linked to carriers (except admin)

### Carrier  
- Company information
- DOT number, MC number
- Address, contact details
- Subscription and settings

### Driver
- Personal information  
- License details
- Home base assignment
- ELD-specific settings

### Asset
- Vehicle information
- VIN, registration details
- Maintenance tracking
- Location data (for future GPS integration)

### Notification
- Alert configuration
- Email templates
- Trigger conditions
- Recipient management

## 🚀 Deployment

### Production Checklist
- [ ] Set secure JWT_SECRET
- [ ] Configure production MongoDB
- [ ] Set NODE_ENV=production
- [ ] Configure CORS for production frontend URL
- [ ] Set up process manager (PM2)
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up SSL certificate
- [ ] Configure logging
- [ ] Set up monitoring

### Docker Deployment
```dockerfile
# Dockerfile example
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes  
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

## 🔗 Frontend Integration

This backend is designed to work with the ELD Software frontend. To connect:

1. Update frontend API base URL to `http://localhost:5000/api/v1`
2. Use the login endpoint to get JWT token
3. Include token in Authorization header for protected routes
4. Handle error responses appropriately

**Ready to power your ELD software! 🚛✨**
