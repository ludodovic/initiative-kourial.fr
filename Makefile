IMAGE ?= initiative-kourial-dev
PORT ?= 4200
NETWORK ?= initiative-local_default

.PHONY: help build dev dev-interactive logs stop

help:
	@printf '%s\n' \
		'make dev             Build and run the development server in detached mode at http://localhost:$(PORT)' \
		'make dev-interactive Run the development server with an attached terminal' \
		'make logs            Show logs from the detached development container' \
		'make stop            Stop the detached development container' \
		'make build           Build the development image'

build:
	docker build --tag $(IMAGE) .

dev: build
	docker run --detach --name initiative-kourial-dev --publish $(PORT):4200 --network $(NETWORK) --volume "$(CURDIR):/app" $(IMAGE)

dev-interactive: build
	docker run --interactive --tty --publish $(PORT):4200 --network $(NETWORK) --volume "$(CURDIR):/app" $(IMAGE)

logs:
	docker logs --follow initiative-kourial-dev

stop:
	docker stop initiative-kourial-dev || true
