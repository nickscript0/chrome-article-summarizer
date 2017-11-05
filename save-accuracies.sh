#!/bin/bash
OUTFILE='accuracies.txt'
REVISION=$(git rev-parse HEAD)
DATE=$(date +"%Y-%m-%d %H:%M:%S")

echo "\n$DATE [revision: $REVISION]" >> $OUTFILE
npm test -- -g 'accuracy' | sed -Ene '/^\*{10,}$/,/^\*{10,}$/p' >> $OUTFILE
