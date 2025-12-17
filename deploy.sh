#!/bin/bash

# Ultimate Tic-Tac-Toe Deployment Script
# Usage: ./deploy.sh [platform]
# Platforms: local, docker, heroku, vercel, railway

set -e

PLATFORM=${1:-local}

echo "🚀 Deploying Ultimate Tic-Tac-Toe to $PLATFORM"

case $PLATFORM in
    local)
        echo "📦 Installing dependencies..."
        npm install

        echo "🏃 Starting local server..."
        npm start
        ;;

    docker)
        echo "🐳 Building Docker image..."
        docker build -t ultimate-tic-tac-toe .

        echo "🏃 Running with Docker..."
        docker run -p 3000:3000 ultimate-tic-tac-toe
        ;;

    docker-compose)
        echo "🐳 Starting with Docker Compose..."
        docker-compose up --build
        ;;

    heroku)
        echo "🔧 Setting up Heroku deployment..."

        if ! command -v heroku &> /dev/null; then
            echo "❌ Heroku CLI not found. Install from https://devcenter.heroku.com/articles/heroku-cli"
            exit 1
        fi

        # Check if git repo
        if [ ! -d .git ]; then
            echo "📝 Initializing git repository..."
            git init
            git add .
            git commit -m "Initial commit"
        fi

        echo "🔗 Creating Heroku app..."
        heroku create ultimate-tic-tac-toe-$(date +%s) --stack=container

        echo "🚀 Deploying to Heroku..."
        git push heroku main
        ;;

    vercel)
        echo "⚡ Deploying to Vercel..."

        if ! command -v vercel &> /dev/null; then
            echo "❌ Vercel CLI not found. Install with: npm i -g vercel"
            exit 1
        fi

        vercel --prod
        ;;

    railway)
        echo "🚂 Deploying to Railway..."

        if ! command -v railway &> /dev/null; then
            echo "❌ Railway CLI not found. Install from https://docs.railway.app/develop/cli"
            exit 1
        fi

        railway login
        railway init
        railway up
        ;;

    *)
        echo "❌ Unknown platform: $PLATFORM"
        echo "📋 Available platforms: local, docker, docker-compose, heroku, vercel, railway"
        exit 1
        ;;
esac

echo "✅ Deployment complete!"
echo "🎮 Your Ultimate Tic-Tac-Toe game is ready to play!"
