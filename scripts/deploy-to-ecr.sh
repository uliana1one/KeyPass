#!/bin/bash

# KeyPass AWS ECR Deployment Script
# Usage: ./scripts/deploy-to-ecr.sh [version]

set -e

# Configuration
AWS_REGION="us-east-2"
AWS_ACCOUNT_ID="887637206351"
ECR_REPOSITORY="keypass"
IMAGE_NAME="keypass"
DEFAULT_VERSION="latest"

# Get version from command line or use default
VERSION=${1:-$DEFAULT_VERSION}

echo "🚀 Starting KeyPass deployment to AWS ECR..."
echo "📍 Region: $AWS_REGION"
echo "🏢 Account: $AWS_ACCOUNT_ID"
echo "📦 Repository: $ECR_REPOSITORY"
echo "🏷️  Version: $VERSION"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    echo "   Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install it first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if user is authenticated with AWS
echo "🔐 Checking AWS authentication..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS authentication failed. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS authentication successful"

# Get ECR login token and authenticate Docker
echo "🔑 Authenticating Docker with ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

if [ $? -ne 0 ]; then
    echo "❌ Failed to authenticate with ECR"
    exit 1
fi

echo "✅ Docker authenticated with ECR"

# Build Docker image
echo "🔨 Building Docker image..."
docker build -t $IMAGE_NAME:$VERSION .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed"
    exit 1
fi

echo "✅ Docker image built successfully"

# Tag the image for ECR
echo "🏷️  Tagging image for ECR..."
docker tag $IMAGE_NAME:$VERSION $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$VERSION

if [ $? -ne 0 ]; then
    echo "❌ Failed to tag image"
    exit 1
fi

echo "✅ Image tagged successfully"

# Push image to ECR
echo "📤 Pushing image to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$VERSION

if [ $? -ne 0 ]; then
    echo "❌ Failed to push image to ECR"
    exit 1
fi

echo "✅ Image pushed successfully to ECR"

# Display image URI
IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$VERSION"
echo ""
echo "🎉 Deployment completed successfully!"
echo "📦 Image URI: $IMAGE_URI"
echo ""
echo "💡 To pull this image:"
echo "   docker pull $IMAGE_URI"
echo ""
echo "💡 To run this image:"
echo "   docker run -p 3000:3000 $IMAGE_URI"
echo ""
echo "💡 To deploy to ECS/Fargate, use the image URI: $IMAGE_URI" 