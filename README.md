# Article Summarizer Browser Extension

## Usage
```bash
npm run build
# Then load the extension in your browser.
```

## Firefox build and publish with web-ext
```bash
# Test the extension in a browser
web-ext run

# For publishing copy the minimal extension src files to another folder otherwise the tool includes unnecessary items
# TODO: script this
make
export RELEASE_DIR=firefox-signed-release
mkdir $RELEASE_DIR
cp manifest.json $RELEASE_DIR
cp -R css $RELEASE_DIR/
cp -R html $RELEASE_DIR/
cp -R dist $RELEASE_DIR/

cd $RELEASE_DIR
web-ext build
web-ext sign --api-key=$FF_JWT_USER --api-secret=$FF_JWT_SECRET
```
