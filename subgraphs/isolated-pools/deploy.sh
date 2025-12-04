#!/bin/bash

version=($(jq -r '.version' package.json))

if [[ $version == *"testnet"* ]]; then
  yarn graph auth --studio $TESTNET_GRAPH_CLI_API_KEY
  yarn deploy:chapel --version-label $version
  yarn deploy:sepolia --version-label $version
  yarn deploy:arbitrumSepolia --version-label $version
  # ZKsync is deprecated in The Graph
  yarn deploy:optimismSepolia --version-label $version
  yarn deploy:baseSepolia --version-label $version
  yarn deploy:unichainSepolia --version-label $version
else
  yarn graph auth --studio $MAINNET_GRAPH_CLI_API_KEY
  yarn deploy:bsc --version-label $version
  yarn deploy:ethereum --version-label $version
  yarn deploy:arbitrum --version-label $version
  # ZKsync is deprecated in The Graph
  yarn deploy:optimism --version-label $version
  yarn deploy:base --version-label $version
  yarn deploy:unichain --version-label $version
fi
