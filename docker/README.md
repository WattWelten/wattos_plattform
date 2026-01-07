# Docker Build Commands fÃ¼r WattOS Plattform

# Build alle Images
docker-compose build

# Build einzelne Services
docker build -f docker/Dockerfile.gateway -t wattos-gateway:latest .
docker build -f docker/Dockerfile.web -t wattos-web:latest --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001/api .
docker build -f docker/Dockerfile.customer-portal -t wattos-customer-portal:latest --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001/api .
docker build -f docker/Dockerfile.console -t wattos-console:latest --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001/api .

# Start Services
docker-compose up -d

# View Logs
docker-compose logs -f

# Stop Services
docker-compose down
