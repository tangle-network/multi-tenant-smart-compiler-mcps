.PHONY: ensure-image pull-image build-image build-multi-platform push-multi-platform

# docker image name and tag
DOCKER_IMAGE := tangle-network/mcp-risc-zero:latest
DOCKER_CONTAINER := mcp-risc-zero

# build and tag the docker image for amd64 (default for consistency)
build-image:
	DOCKER_BUILDKIT=1 docker build $(if $(PLATFORM),--platform $(PLATFORM),) -t $(DOCKER_IMAGE) .

# build multi-platform images separately and load them locally
build-multi-platform:
	@echo "Building for linux/amd64..."
	docker buildx build --platform linux/amd64 -t $(DOCKER_IMAGE)-amd64 --load .
	@echo "Building for linux/arm64..."
	docker buildx build --platform linux/arm64 -t $(DOCKER_IMAGE)-arm64 --load .
	@echo "Tagging native platform as latest..."
	@if [ "$$(uname -m)" = "aarch64" ]; then \
		docker tag $(DOCKER_IMAGE)-arm64 $(DOCKER_IMAGE); \
	else \
		docker tag $(DOCKER_IMAGE)-amd64 $(DOCKER_IMAGE); \
	fi
	@echo "Multi-platform build complete: $(DOCKER_IMAGE)-amd64, $(DOCKER_IMAGE)-arm64, $(DOCKER_IMAGE)"

# build and load single platform image locally (for local testing)
build-local:
	docker buildx build $(if $(PLATFORM),--platform $(PLATFORM),--platform linux/amd64) -t $(DOCKER_IMAGE) --load .

# build and push multi-platform image to registry
push-multi-platform:
	docker buildx build --platform linux/amd64,linux/arm64 -t $(DOCKER_IMAGE) --push .

# pull the docker image if it exists
pull-image:
	docker pull $(DOCKER_IMAGE) || exit 0

# run the docker image
start-container:
	docker compose up -d

# setup for end-to-end testing
e2e-setup:
	pnpm install
	pnpm build
	docker compose up --build -d

# restart the container
restart-container:
	docker restart $(DOCKER_CONTAINER)

# attach to the container
attach-to-container:
	docker exec -it $(DOCKER_CONTAINER) /bin/bash

# stop the container
stop-container:
	docker stop $(DOCKER_CONTAINER)

# remove the container
remove-container:
	docker rm $(DOCKER_CONTAINER)

# development workflow
dev:
	pnpm build
	docker compose up --build -d
	$(MAKE) attach-to-container

# clean up containers and images
clean:
	docker compose down
	docker rm -f $(DOCKER_CONTAINER) 2>/dev/null || true
	docker rmi $(DOCKER_IMAGE) 2>/dev/null || true

# view container logs
logs:
	docker compose logs -f
