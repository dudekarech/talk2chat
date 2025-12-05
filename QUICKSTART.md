# 🚀 CallNest Quick Start Guide

Get CallNest running in under 10 minutes!

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **PostgreSQL 14+** - [Download here](https://www.postgresql.org/download/)
- **Redis 6+** - [Download here](https://redis.io/download)

## 🏃‍♂️ Quick Installation

### Option 1: Automated (Recommended)
```bash
# On macOS/Linux
chmod +x install.sh
./install.sh

# On Windows (PowerShell)
.\install.ps1
```

### Option 2: Manual
```bash
# Install all dependencies
npm run install:all
```

## ⚙️ Configuration

1. **Copy environment file:**
```bash
cp backend/env.example backend/.env
```

2. **Edit `backend/.env` with your database credentials:**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/callnest?schema=public"
JWT_SECRET="your-super-secret-jwt-key-here"
REDIS_URL="redis://localhost:6379"
```

## 🗄️ Database Setup

```bash
# Set up database schema
npm run db:setup
```

## 🚀 Start Development

```bash
# Start both frontend and backend
npm run dev
```

Your application will be available at:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001
- **API Docs:** http://localhost:3001/api/docs

## 🧪 Test the Widget

1. **Build the widget:**
```bash
cd widget
npm run build
```

2. **Open the demo page:**
```bash
# Open widget/demo.html in your browser
# You should see a floating call button in the bottom-right corner
```

## 🔐 First Login

1. **Create a superadmin user:**
```bash
# Use the API endpoint
POST /api/auth/superadmin
{
  "email": "admin@callnest.io",
  "password": "securepassword123",
  "firstName": "Admin",
  "lastName": "User"
}
```

2. **Login at:** http://localhost:3000/login

## 📱 Widget Integration

Each company gets a unique embed code:

```html
<script src="https://cdn.callnest.io/widget.js" data-uuid="COMPANY-UUID"></script>
```

## 🏗️ Project Structure

```
callnest/
├── backend/          # NestJS API + WebSockets
├── frontend/         # React + Tailwind (Dashboards)
├── widget/           # Vanilla JS embeddable widget
└── docs/            # Documentation
```

## 🎯 What's Next?

- [ ] Complete the remaining backend modules (agents, calls, websockets)
- [ ] Build the React frontend pages and components
- [ ] Implement WebRTC call functionality
- [ ] Add real-time features with Socket.io
- [ ] Set up production deployment

## 🆘 Need Help?

- Check the [README.md](README.md) for detailed documentation
- Review the [API documentation](http://localhost:3001/api/docs) when running
- Open an issue for bugs or feature requests

---

**Happy coding! 🎉**

*"Every website visitor is a potential call waiting to happen"*
