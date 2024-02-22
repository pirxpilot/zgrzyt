BIOME=node_modules/.bin/biome

check: lint test

lint:
	$(BIOME) ci .

format:
	$(BIOME) check --apply .

test:
	node --test

.PHONY: check lint format test
