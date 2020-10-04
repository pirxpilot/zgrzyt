check: lint test

lint:
	./node_modules/.bin/jshint *.js lib test

test:
	./node_modules/.bin/tape test/*.js | ./node_modules/.bin/tap-diff

.PHONY: check lint test
