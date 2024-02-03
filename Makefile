.PHONY: build run run-bash

TAG=kinchan

build:
	docker build -t kinchan .

run:
	docker run -p 8000:8000 -p 8080:8080 -v $(PWD)/src:/app/src --rm -it $(TAG) pnpm start

run-bash:
	docker run -p 8000:8000 -p 8080:8080 --rm -it $(TAG) bash