#!/bin/bash

echo "🚀 Setting up Academic Messaging Application..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL first."
    exit 1
fi

echo "${GREEN}✓${NC} MySQL found"

# Initialize database
echo ""
echo "📀 Initializing database..."
echo "${YELLOW}Note: You may be prompted for your MySQL password${NC}"

sudo mysql < database/schema.sql

if [ $? -eq 0 ]; then
    echo "${GREEN}✓${NC} Database initialized successfully"
else
    echo "❌ Database initialization failed"
    echo "You can manually run: sudo mysql < database/schema.sql"
fi

# Backend setup
echo ""
echo "🔧 Setting up backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "${YELLOW}⚠${NC}  No .env file found. Please configure backend/.env"
    echo "   Example .env has been created. Update DB_PASSWORD and JWT_SECRET"
else
    echo "${GREEN}✓${NC} Backend .env exists"
fi

# Frontend setup
echo ""
echo "🎨 Setting up client..."
cd ../client

if [ ! -f ".env.local" ]; then
    echo "Creating client/.env.local..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
    echo "NEXT_PUBLIC_SOCKET_URL=http://localhost:5000" >> .env.local
    echo "${GREEN}✓${NC} Client .env.local created"
else
    echo "${GREEN}✓${NC} Client .env.local exists"
fi

cd ..

echo ""
echo "${GREEN}========================================${NC}"
echo "${GREEN}✓ Setup complete!${NC}"
echo "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your MySQL password"
echo "2. Start backend:  cd backend && npm run dev"
echo "3. Start client:   cd client && npm run dev"
echo "4. Open http://localhost:3000"
echo ""
