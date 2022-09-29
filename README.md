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

## Running in docker
All the required services are networked with a docker-compose and can be brought up using `docker-compose up`.

## Running all servies locally

Hardhat is used for development and testing. First start a local node. We'll also need to deploy the contracts. For debugging you may also find it useful to use a [fork](https://hardhat.org/hardhat-network/docs/guides/forking-other-networks)
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
Clone the [graph-node repo](https://github.com/graphprotocol/graph-node).

Then you can run the node.

```
cargo run -p graph-node --release -- \
  --postgres-url postgresql://<USERNAME>[:PASSWORD]@localhost:5432/graph-node \
  --ethereum-rpc <NETWORK>:http://127.0.0.1:8545/ \
  --ipfs 127.0.0.1:5001
```

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
To run the integration tests you'll need to setup a local environment and run the tests with the `test:integration` in the project or workspace that you want to test.

The required services are composed in a docker-compose file but currently there is an issue with the registrar on the graph-node that needs to be sorted.

## Debugging
To query the indexing error use a graphql explorer like [GraphiQl](https://graphiql-online.com/graphiql) to query the graph node for the status of the graph. The endpoint for the hosted service is `https://api.thegraph.com/index-node/graphql`.

Example query

```
{
  indexingStatuses(subgraphs: ["QmRY..."]) {
    subgraph
    synced
    health
    fatalError {
      handler
      message
      deterministic
      block {
        hash
        number
      }
    }
  }
}
```

### Forking

Forking the subgraph is an easy way to debug indexing errors. To deploy a forked subgraph follow the above instructions to setup a local environment wit the following adjustments

#### GraphNode
- Use the forkbase option to point towards the graph api
- Set the ethereum RPC to an archive node

#### Subgraph
Set the starting block for all handlers to at or before the erroring block.
Redploy the subgraph pointing to the deployed fork

```
graph deploy venusprotocol/venus-governance --debug-fork QmRYhnkD3vYBhsMZ7hPE1PaL19msw7xekafPndK8mDSvzZ --ipfs http://localhost:5001 --node http://localhost:8020
```

After these steps you should quickly run into the indexing error. After updating hte code you can redeploy the forked subgraph to check the fix.
