.PHONY: build run run-bash start stop

TAG=kinchan

build:
	docker build -t kinchan .

run:
	docker run -p 8000:8000 -p 8080:8080 -v $(PWD)/src:/app/src -v $(PWD)/static:/app/static --rm -it $(TAG) pnpm start

start:
	docker run -p 8000:8000 -p 8080:8080 -v $(PWD)/src:/app/src -v $(PWD)/static:/app/static --name kinchan --rm -d $(TAG) pnpm start

stop:
	docker kill kinchan

run-bash:
	docker run -p 8000:8000 -p 8080:8080 --rm -it $(TAG) bash