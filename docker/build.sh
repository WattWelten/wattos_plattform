# Docker Build Scripts fÃ¼r WattOS Plattform

# Build alle Docker Images
docker-compose build

# Starte alle Services
docker-compose up -d

# Zeige Logs
docker-compose logs -f

# Stoppe alle Services
docker-compose down

# Stoppe und entferne Volumes
docker-compose down -v

# Build einzelne Services
# docker-compose build gateway
# docker-compose build web
# docker-compose build customer-portal
# docker-compose build console
