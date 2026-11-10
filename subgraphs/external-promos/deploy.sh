#!/bin/bash

version=($(jq -r '.version' package.json))

if [[ $version != *"testnet"* ]]; then
  yarn graph auth --studio $MAINNET_GRAPH_CLI_API_KEY
  yarn deploy:bsc --version-label $version
  yarn deploy:ethereum --version-label $version
  yarn deploy:arbitrum --version-label $version
  yarn deploy:unichain --version-label $version
fi
