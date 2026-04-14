#!/bin/bash

echo "🚀 Setting up Academic Messaging Application (Unified)..."
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
echo "📀 Checking database..."
DB_NAME=$(grep DB_NAME .env | cut -d '=' -f2)
DB_USER=$(grep DB_USER .env | cut -d '=' -f2)
DB_PASS=$(grep DB_PASSWORD .env | cut -d '=' -f2)

echo "Attempting to initialize database: $DB_NAME"
mysql -u "$DB_USER" -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "Initializing schema..."
    mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < database/schema.sql 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "${GREEN}✓${NC} Database initialized successfully"
    else
        echo "❌ Database initialization failed (schema error)"
    fi
else
    echo "❌ Database connection failed. Please check .env credentials."
fi

# Dependency installation
echo ""
echo "🔧 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "${GREEN}✓${NC} Dependencies installed successfully"
else
    echo "❌ Dependency installation failed"
fi

echo ""
echo "${GREEN}========================================${NC}"
echo "${GREEN}✓ Setup complete!${NC}"
echo "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Verify .env configuration"
echo "2. Start application: npm run dev"
echo "3. Open http://localhost:5000"
echo ""

