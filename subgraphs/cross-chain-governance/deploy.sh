#!/bin/bash

version=($(jq -r '.version' package.json))

if [[ $version == *"testnet"* ]]; then
  # opBNB is not supported by The Graph and zkSync has been deprecated
  yarn graph auth --studio $TESTNET_GRAPH_CLI_API_KEY
  yarn deploy:sepolia --version-label $version
  yarn deploy:arbitrumSepolia --version-label $version
  yarn deploy:optimismSepolia --version-label $version
  yarn deploy:baseSepolia --version-label $version
  yarn deploy:unichainSepolia --version-label $version
  yarn deploy:berachainBepolia --version-label $version
else
  yarn graph auth --studio $MAINNET_GRAPH_CLI_API_KEY
  yarn deploy:bsc --version-label $version
  yarn deploy:ethereum --version-label $version
  yarn deploy:arbitrum --version-label $version
  yarn deploy:optimism --version-label $version
  yarn deploy:zkSync --version-label $version
fi

