#!/bin/bash

echo "🚀 Setting up FootyLive"
echo "=================================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

echo "✅ Python and Node.js are installed"

# Setup backend
echo "📦 Setting up backend..."
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

echo "✅ Backend setup complete"

# Setup frontend
echo "📦 Setting up frontend..."
cd ../frontend

# Install Node.js dependencies
npm install

echo "✅ Frontend setup complete"

# Create .env file if it doesn't exist
cd ..
if [ ! -f backend/.env ]; then
    echo "📝 Creating .env file..."
    echo "FOOTBALL_DATA_API_KEY=your_api_key_here" > backend/.env
    echo "⚠️  Please update backend/.env with your football-data.org API key"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "1. Update backend/.env with your football-data.org API key"
echo "2. Start backend: cd backend && source venv/bin/activate && python3 -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"
echo "3. Start frontend: cd frontend && npm run dev"
echo ""
echo "Or use Docker: docker-compose up"
