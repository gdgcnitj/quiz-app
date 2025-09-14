#!/bin/bash

# Quiz App Setup Script
echo "🚀 Setting up Quiz App Monorepo..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | sed 's/v//')
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install shared package dependencies
echo "📦 Installing shared package dependencies..."
cd packages/shared
npm install
cd ../..

# Build shared package
echo "🔨 Building shared package..."
cd packages/shared
npm run build
cd ../..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd packages/backend
npm install
cd ../..

# Install dashboard dependencies (if you want to set it up)
echo "📦 Installing dashboard dependencies..."
cd packages/dashboard
npm install
cd ../..

echo "✅ All dependencies installed successfully!"

# Create environment files
echo "📝 Creating environment files..."

# Backend .env file
if [ ! -f "packages/backend/.env" ]; then
    cp packages/backend/.env.example packages/backend/.env
    echo "✅ Created packages/backend/.env from example"
    echo "⚠️  Please edit packages/backend/.env with your Appwrite credentials"
else
    echo "✅ packages/backend/.env already exists"
fi

# Dashboard .env file (if needed)
if [ ! -f "packages/dashboard/.env" ]; then
    cat > packages/dashboard/.env << EOF
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
EOF
    echo "✅ Created packages/dashboard/.env"
else
    echo "✅ packages/dashboard/.env already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. 📋 Follow the Appwrite setup guide: docs/APPWRITE_SETUP.md"
echo "2. ✏️  Edit packages/backend/.env with your Appwrite credentials"
echo "3. 🚀 Start the development servers:"
echo "   npm run dev              # Start both backend and dashboard"
echo "   npm run dev:backend      # Start only backend"
echo "   npm run dev:dashboard    # Start only dashboard"
echo ""
echo "📚 Documentation:"
echo "   - docs/APPWRITE_SETUP.md  # Appwrite configuration guide"
echo "   - docs/API.md             # API documentation"
echo "   - packages/backend/README.md    # Backend setup"
echo "   - packages/dashboard/README.md  # Dashboard setup"
echo ""
echo "🔗 URLs (after starting):"
echo "   - Backend API: http://localhost:3001"
echo "   - Dashboard:   http://localhost:3000"
echo "   - Health check: http://localhost:3001/health"
