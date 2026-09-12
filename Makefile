SHELL := /bin/sh
.DEFAULT_GOAL := help

DOCKER ?= docker
COMPOSE_BIN := $(shell $(DOCKER) compose version >/dev/null 2>&1 && echo "$(DOCKER) compose" || echo "docker-compose")
COMPOSE_PROJECT ?= initiative-frontend-prod
COMPOSE_FILE ?= compose.frontend.yml
SERVICE ?= initiative-frontend
UPLOADS_VOLUME ?= initiative-api-prod_initiative_uploads
FRONTEND_PORT ?= 4200
HEALTH_URL ?= http://127.0.0.1:$(FRONTEND_PORT)/

export FRONTEND_PORT UPLOADS_VOLUME

COMPOSE := $(COMPOSE_BIN) --project-name $(COMPOSE_PROJECT) --file $(COMPOSE_FILE)

.PHONY: help install dev check build-local config volume build up deploy update restart logs status health down

help:
	@echo "Initiative frontend"
	@echo ""
	@echo "Local development:"
	@echo "  make install      Install exact npm dependencies"
	@echo "  make dev          Start the Angular development server"
	@echo "  make check        Type-check and build the Angular application"
	@echo "  make build-local  Build the Angular application locally"
	@echo ""
	@echo "Production deployment:"
	@echo "  make deploy       Pull, rebuild, deploy, and show container status"
	@echo "  make update       Alias for make deploy"
	@echo "  make up           Build and start the current code"
	@echo "  make build        Build the frontend Docker image"
	@echo "  make restart      Restart the frontend container"
	@echo "  make logs         Follow frontend logs"
	@echo "  make status       Show container status"
	@echo "  make health       Check the local frontend HTTP endpoint"
	@echo "  make config       Validate and render the Compose configuration"
	@echo "  make down         Stop the frontend; the shared uploads volume is kept"
	@echo ""
	@echo "Configuration: FRONTEND_PORT=$(FRONTEND_PORT), volume=$(UPLOADS_VOLUME)"

install:
	npm ci

dev:
	npm start

check:
	./node_modules/.bin/tsc --project tsconfig.app.json --noEmit
	npm run build

build-local:
	npm run build

config:
	$(COMPOSE) config

volume:
	@$(DOCKER) volume inspect $(UPLOADS_VOLUME) >/dev/null 2>&1 || { \
		echo "ERROR: Docker volume '$(UPLOADS_VOLUME)' was not found."; \
		echo "Start the backend stack first, or override UPLOADS_VOLUME."; \
		exit 1; \
	}
	@echo "Using uploads volume: $(UPLOADS_VOLUME)"

build:
	$(COMPOSE) build --pull $(SERVICE)

up: volume build
	$(COMPOSE) up --detach --remove-orphans $(SERVICE)
	$(COMPOSE) ps

deploy:
	git pull --ff-only
	$(MAKE) up
	$(MAKE) health

# Backwards-compatible name from the backend Makefile.
update: deploy

restart: volume
	$(COMPOSE) restart $(SERVICE)
	$(COMPOSE) ps

logs:
	$(COMPOSE) logs --follow --tail 100 $(SERVICE)

status:
	$(COMPOSE) ps

health:
	@curl --fail --silent --show-error --retry 10 --retry-delay 1 --retry-connrefused $(HEALTH_URL) >/dev/null
	@echo "Frontend is responding on $(HEALTH_URL)"

down:
	$(COMPOSE) down --remove-orphans
	@echo "Frontend stopped. External volume '$(UPLOADS_VOLUME)' was kept."
