# Venus Subgraphs

[Venus](https://venus.io/) is an open-source protocol for algorithmic, efficient Money Markets on the Binance Smart Chain. The Subgraphs ingest events sent by the Venus protocol and make the queryable.

## Networks and Performance
The following subgraphs are deployed to the BSC mainnet
[Markets](https://thegraph.com/explorer/subgraph/venusprotocol/venus-subgraph)

You can also run this subgraph locally, if you wish. Instructions for that can be found in [The Graph Documentation](https://thegraph.com/docs/quick-start).

### ABI

The ABI used is `vtoken.json`. It is a stripped down version of the full abi provided by Venus, that satisfies the calls we need to make for both vBNB and vBEP20 contracts. This way we can use 1 ABI file, and one mapping for vBNB and vBEP20.

## Getting started with querying

Below are a few ways to show how to query the Venus V2 Subgraph for data. The queries show most of the information that is queryable, but there are many other filtering options that can be used, just check out the [querying api](https://github.com/graphprotocol/graph-node/blob/master/docs/graphql-api.md).

You can also see the saved queries on the hosted service for examples.

# Development / Testing

Hardhat is used for development and testing. First start a local node. We'll also need to deploy the contracts.
```
$ yarn hardhat node
$ yarn hardhat run --network localhost scripts/deploy.ts  
```

### IPFS local
Initialize ipfs with the test profile and run offline to avoid connecting to the external network. When running the daemon check the port the API server is listening on.

```
$ ipfs init --profile=test
$ ipfs config Addresses.API /ip4/0.0.0.0/tcp/5001
$ ipfs daemon --offline
```

### Graph Node
cargo run -p graph-node --release -- \
  --postgres-url postgresql://corey:password@localhost:5432/graph-node \
  --ethereum-rpc bsc-testnet:http://127.0.0.1:8545/ \
  --ipfs 127.0.0.1:5001

### Deploy your local subgraph

```
$ yarn deploy-local
```