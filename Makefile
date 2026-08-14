IMAGE ?= initiative-kourial-dev
PORT ?= 4200
NETWORK ?= initiative-local_default

.PHONY: help build dev

help:
	@printf '%s\n' 'make dev    Build and run the development server at http://localhost:$(PORT)' 'make build  Build the development image'

build:
	docker build --tag $(IMAGE) .

dev: build
	docker run --rm --interactive --tty --publish $(PORT):4200 --network $(NETWORK) --volume "$(CURDIR):/app" $(IMAGE)
