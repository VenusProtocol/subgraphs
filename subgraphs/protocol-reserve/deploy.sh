#!/bin/bash

version=($(jq -r '.version' package.json))

if [[ $string == *"testnet"* ]]; then
  yarn graph auth --studio $TESTNET_GRAPH_CLI_API_KEY 
  yarn deploy:chapel --version-label $version
  yarn deploy:sepolia --version-label $version
else
  yarn graph auth --studio $MAINNET_GRAPH_CLI_API_KEY
  yarn deploy:bsc --version-label $version
  yarn deploy:ethereum --version-label $version
fi
