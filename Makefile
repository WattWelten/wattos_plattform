# Plattformunabhängiges Makefile (optimiert)
# Funktioniert auf Windows (PowerShell), WSL und Unix-Systemen

.PHONY: up down db:migrate seed dev test lint fmt e2e smoke docker:wait docker:logs docker:ps docker:restart

# Docker Compose Command Detection
DOCKER_COMPOSE := $(shell command -v docker-compose 2> /dev/null || echo "docker compose")

up:
	@echo "🐳 Starting Docker services..."
	@$(DOCKER_COMPOSE) up -d
	@echo "⏳ Waiting for services to be ready..."
	@sleep 3
	@$(MAKE) docker:wait

down:
	@echo "🛑 Stopping Docker services..."
	@$(DOCKER_COMPOSE) down -v

docker:wait:
	@echo "Checking service health..."
	@timeout=30; \
	while [ $$timeout -gt 0 ]; do \
		if $(DOCKER_COMPOSE) ps 2>/dev/null | grep -q "healthy" || $(DOCKER_COMPOSE) ps 2>/dev/null | grep -q "Up"; then \
			echo "✅ Services are ready"; \
			break; \
		fi; \
		sleep 1; \
		timeout=$$((timeout-1)); \
	done; \
	if [ $$timeout -eq 0 ]; then \
		echo "⚠️  Services may still be starting. Check with: make docker:ps"; \
	fi

db:migrate:
	@echo "Running database migrations..."
	@pnpm --filter @wattweiser/db migrate:deploy

seed:
	@pnpm -w exec ts-node scripts/seed.mts || true

dev:
	@pnpm dev:mvp

test:
	@pnpm -w test

lint:
	@pnpm -w lint

fmt:
	@pnpm -w format

e2e:
	@pnpm -w exec playwright test --reporter=line

smoke:
	@node scripts/healthcheck.mjs

# Zusätzliche Docker-Hilfsbefehle
docker:logs:
	@$(DOCKER_COMPOSE) logs -f

docker:ps:
	@$(DOCKER_COMPOSE) ps

docker:restart:
	@$(DOCKER_COMPOSE) restart

