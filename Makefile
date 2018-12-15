all: clean build

firefox: clean build bundle-xpi

chrome: clean build bundle-zip

build:
	npm run build

clean: 
	rm -rf dist

bundle-xpi:
	zip -r -FS packed/article-summarizer@nickscript0.xpi manifest.json css html dist
bundle-zip:
	zip -r -FS packed/article-summarizer@nickscript0.zip manifest.json css html dist