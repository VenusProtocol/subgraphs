#!/bin/bash

version=($(jq -r '.version' package.json))

if [[ $version == *"testnet"* ]]; then
  yarn graph auth --studio $TESTNET_GRAPH_CLI_API_KEY
  yarn deploy:chapel --version-label $version
  yarn deploy:sepolia --version-label $version
  yarn deploy:arbitrumSepolia --version-label $version
  yarn deploy:zksyncSepolia --version-label $version
  yarn deploy:optimismSepolia --version-label $version
  yarn deploy:baseSepolia --version-label $version
else
  yarn graph auth --studio $MAINNET_GRAPH_CLI_API_KEY
  yarn deploy:bsc --version-label $version
  yarn deploy:ethereum --version-label $version
  yarn deploy:arbitrum --version-label $version
  yarn deploy:zksync --version-label $version
  yarn deploy:optimism --version-label $version
fi
