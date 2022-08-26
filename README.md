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
  --postgres-url postgresql://<USERNAME>[:PASSWORD]@localhost:5432/graph-node \
  --ethereum-rpc bsc-testnet:http://127.0.0.1:8545/ \
  --ipfs 127.0.0.1:5001

### Deploy your local subgraph
To build or deploy the subgraph you'll need to first compile the subgraph.yaml template and then run the build of deploy commands which can be run for all packages or individual packages.

```
$ yarn prepare:local
$ yarn deploy:local
```

## Testing
### Unit tests
Unit tests are run with `matchstick-as`. They can be run with the `test` command at the project or workspace level. Tests are organized by datasource with files for creating events and mocks. A test consists of setting up and creating an event, then passing it to the handler and asserting against changes to the document store.

### Integration tests
The integration test environment is orchestrated with containers. They can be brought up using `docker-compose up`.
