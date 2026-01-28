#!/bin/bash

# Setup script for Fraud Detection Backend

set -e

echo "🚀 Setting up Fraud Detection Backend..."

# Check if uv is installed
if ! command -v uv &>/dev/null; then
  echo "❌ uv is not installed. Installing..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  echo "✅ uv installed"
fi

# Install dependencies
echo "📦 Installing dependencies..."
uv sync

# Copy .env.example to .env if not exists
if [ ! -f .env ]; then
  echo "📝 Creating .env file from .env.example..."
  cp .env.example .env
  echo "⚠️  Please update .env with your API keys!"
fi

# Seed database
echo "🌱 Seeding database..."
uv run python -m app.data.loader

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your API keys (OPENAI_API_KEY, TAVILY_API_KEY, etc.)"
echo "2. Run: uv run uvicorn main:app --reload"
echo "3. Visit: http://localhost:8000/docs"
