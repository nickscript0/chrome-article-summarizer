all: clean build

build:
	npm run build

clean: 
	rm -rf build

xpi:
	zip -r -FS ../chrome-article-summarizer@nickscript0.xpi *
