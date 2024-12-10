#!/bin/bash

version=($(jq -r '.version' package.json))

if [[ $string == *"-pre"* ]]; then
  yarn deploy:chapel --version-label $version
  yarn deploy:sepolia --version-label $version
else
  yarn deploy:bsc --version-label $version
  yarn deploy:ethereum --version-label $version
fi
