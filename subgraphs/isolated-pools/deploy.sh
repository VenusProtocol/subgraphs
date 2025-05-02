#!/bin/bash

version=($(jq -r '.version' package.json))
alchemy_node=https://subgraphs.alchemy.com/api/subgraphs/deploy
alchemy_ipfs=https://ipfs.satsuma.xyz

if [[ $version == *"testnet"* ]]; then
  # Alchemy backups
  yarn deploy:chapel --node $alchemy_node --ipfs $alchemy_ipfs --version-label $version --deploy-key $TESTNET_GRAPH_CLI_ALCHEMY_KEY
  yarn deploy:sepolia --node $alchemy_node --ipfs $alchemy_ipfs --version-label $version --deploy-key $TESTNET_GRAPH_CLI_ALCHEMY_KEY
  yarn deploy:arbitrumSepolia --node $alchemy_node --ipfs $alchemy_ipfs --version-label $version --deploy-key $TESTNET_GRAPH_CLI_ALCHEMY_KEY
  yarn deploy:zksyncSepolia --node $alchemy_node --ipfs $alchemy_ipfs --version-label $version --deploy-key $TESTNET_GRAPH_CLI_ALCHEMY_KEY
  yarn deploy:optimismSepolia --node $alchemy_node --ipfs $alchemy_ipfs --version-label $version --deploy-key $TESTNET_GRAPH_CLI_ALCHEMY_KEY
  yarn deploy:baseSepolia --node $alchemy_node --ipfs $alchemy_ipfs --version-label $version --deploy-key $TESTNET_GRAPH_CLI_ALCHEMY_KEY
  yarn deploy:unichainSepolia --node $alchemy_node --ipfs $alchemy_ipfs --version-label $version --deploy-key $TESTNET_GRAPH_CLI_ALCHEMY_KEY
  # The Graph
  yarn graph auth --studio $TESTNET_GRAPH_CLI_API_KEY
  yarn deploy:chapel --studio --version-label $version
  yarn deploy:sepolia --studio --version-label $version
  yarn deploy:arbitrumSepolia --studio --version-label $version
  # ZKsync is deprecated in The Graph
  yarn deploy:optimismSepolia --studio --version-label $version
  yarn deploy:baseSepolia --studio --version-label $version
  yarn deploy:unichainSepolia --studio --version-label $version
else
  # Alchemy backups
  yarn deploy:bsc --node $alchemy_node --ipfs $alchemy_ipfs --version-label $version --deploy-key $MAINNET_GRAPH_CLI_ALCHEMY_KEY
  yarn deploy:ethereum --node $alchemy_node --ipfs $alchemy_ipfs --version-label $version --deploy-key $MAINNET_GRAPH_CLI_ALCHEMY_KEY
  yarn deploy:arbitrum --node $alchemy_node --ipfs $alchemy_ipfs --version-label $version --deploy-key $MAINNET_GRAPH_CLI_ALCHEMY_KEY
  yarn deploy:zksync --node $alchemy_node --ipfs $alchemy_ipfs --version-label $version --deploy-key $MAINNET_GRAPH_CLI_ALCHEMY_KEY
  yarn deploy:optimism --node $alchemy_node --ipfs $alchemy_ipfs --version-label $version --deploy-key $MAINNET_GRAPH_CLI_ALCHEMY_KEY
  yarn deploy:base --node $alchemy_node --ipfs $alchemy_ipfs --version-label $version --deploy-key $MAINNET_GRAPH_CLI_ALCHEMY_KEY
  # The Graph
  yarn graph auth --studio $MAINNET_GRAPH_CLI_API_KEY
  yarn deploy:bsc --studio --version-label $version
  yarn deploy:ethereum --studio --version-label $version
  yarn deploy:arbitrum --studio --version-label $version
  # ZKsync is deprecated in The Graph
  yarn deploy:optimism --studio --version-label $version
  yarn deploy:base --studio --version-label $version
  yarn deploy:unichain --studio --version-label $version
fi
