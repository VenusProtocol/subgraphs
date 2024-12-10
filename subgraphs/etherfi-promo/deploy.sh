#!/bin/bash

version=($(jq -r '.version' package.json))

if [[ $string == *"testnet"* ]]; then
  yarn deploy:sepolia --version-label $version
else
  yarn deploy:bsc --version-label $version
  yarn deploy:ethereum --version-label $version
  yarn deploy:arbitrum --version-label $version
fi



