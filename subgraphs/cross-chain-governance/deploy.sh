#!/bin/bash

version=($(jq -r '.version' package.json))

if [[ $string == *"testnet"* ]]; then
  yarn deploy:chapel --version-label $version
  yarn deploy:sepolia --version-label $version  
  yarn deploy:arbitrumSepolia --version-label $version
  yarn deploy:optimismSepolia --version-label $version
  yarn deploy:zkSyncSepolia --version-label $version
  yarn deploy:baseSepolia --version-label $version
else
  yarn deploy:bsc --version-label $version
  yarn deploy:ethereum --version-label $version
  yarn deploy:arbitrum --version-label $version
  yarn deploy:optimism --version-label $version
  yarn deploy:zkSync --version-label $version
fi

