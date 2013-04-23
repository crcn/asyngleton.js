test-web:
	rm -rf test-web;
	cp -r test test-web;
	for F in `ls test-web`; do ./node_modules/.bin/sardines "test-web/$$F" -o "test-web/$$F" -p browser; done


