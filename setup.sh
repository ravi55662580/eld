#!/bin/bash

echo "🚛 ELD Software Backend Setup"
echo "=============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | sed 's/v//')
REQUIRED_VERSION="16.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 16+ and try again."
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup environment file
if [ ! -f .env ]; then
    echo "⚙️  Setting up environment variables..."
    cp .env.example .env
    echo "✅ Created .env file from template"
else
    echo "✅ .env file already exists"
fi

# Check for MongoDB
echo "🔍 Checking for MongoDB..."

if command -v mongod &> /dev/null; then
    echo "✅ MongoDB found locally"
    MONGODB_OPTION="local"
elif command -v docker &> /dev/null; then
    echo "✅ Docker found - can use containerized MongoDB"
    MONGODB_OPTION="docker"
else
    echo "⚠️  MongoDB not found locally, Docker not available"
    MONGODB_OPTION="atlas"
fi

case $MONGODB_OPTION in
    "local")
        echo "🎯 Using local MongoDB"
        echo "💡 Make sure MongoDB is running: mongod"
        ;;
    "docker")
        echo "🐳 Using Docker MongoDB"
        echo "💡 To start with Docker: docker-compose up -d mongodb"
        echo "💡 To start everything: docker-compose up -d"
        ;;
    "atlas")
        echo "☁️  Using MongoDB Atlas (recommended)"
        echo "💡 Please:"
        echo "   1. Create a MongoDB Atlas account at https://cloud.mongodb.com"
        echo "   2. Create a new cluster"
        echo "   3. Get your connection string"
        echo "   4. Update MONGODB_URI in .env file"
        ;;
esac

echo ""
echo "🚀 Setup complete! Next steps:"
echo "=============================="

if [ "$MONGODB_OPTION" = "docker" ]; then
    echo "1. Start MongoDB with Docker:"
    echo "   docker-compose up -d mongodb"
    echo ""
elif [ "$MONGODB_OPTION" = "local" ]; then
    echo "1. Start MongoDB:"
    echo "   mongod"
    echo ""
elif [ "$MONGODB_OPTION" = "atlas" ]; then
    echo "1. Update .env file with your MongoDB Atlas connection string"
    echo ""
fi

echo "2. Seed the database:"
echo "   npm run seed"
echo ""
echo "3. Start the development server:"
echo "   npm run dev"
echo ""
echo "4. Your API will be available at:"
echo "   http://localhost:5000"
echo ""
echo "🔑 Default login credentials (after seeding):"
echo "   Admin: admin / admin123"
echo "   Manager: manager / manager123"  
echo "   Demo: demoaccount / demo123"
echo ""
echo "📚 API Documentation: http://localhost:5000/api/v1"
echo ""
echo "Happy coding! 🎉"
