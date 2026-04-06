#!/bin/bash
export PATH="/Users/abishaigeorgegosula/.nvm/versions/node/v22.5.1/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
cd /Users/abishaigeorgegosula/GMV.LIVE_codebase
exec node node_modules/vite/bin/vite.js "$@"
