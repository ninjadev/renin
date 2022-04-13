.PHONY: all
all:
	yarn install

.PHONY: run
run:
	yarn run dev

.PHONY: build
build:
	yarn build

.PHONY: clean
clean:
	rm -rf dist
