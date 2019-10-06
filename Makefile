all: clean build

# Build the final extensions to packed/ folder (.xpi for Firefox, .zip for Chrome)
extensions: clean build bundle-xpi bundle-zip

build: src/*
	npm run build

clean: 
	rm -rf dist

bundle-xpi:
	zip -r -FS packed/article-summarizer@nickscript0.xpi manifest.json css html dist
bundle-zip:
	zip -r -FS packed/article-summarizer@nickscript0.zip manifest.json css html dist
