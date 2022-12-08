# Venus Subgraphs

[Venus](https://venus.io/) is an open-source protocol for algorithmic, efficient Money Markets on the Binance Smart Chain. The Subgraphs ingest events sent by the Venus protocol and make the queryable.

## Integration tests were temporarily disabled during CI
This is due to issues caused when trying to run them using docker containers. For now, we can run the integration tests locally using the steps described below.

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
### IPFS local
First start by initializing ipfs with the test profile and run offline to avoid connecting to the external network. When running the daemon check the port the API server is listening on.

```
$ ipfs init --profile=test
$ ipfs config Addresses.API /ip4/0.0.0.0/tcp/5001
$ ipfs daemon --offline
```

### Running hardhat

Hardhat is used for development and testing. First start a local node. We'll also need to deploy the contracts. For debugging you may also find it useful to use a [fork](https://hardhat.org/hardhat-network/docs/guides/forking-other-networks)
```
$ yarn hardhat node
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

Replace `<NETWORK>` with the network indicated by your subgraph.yaml (usually bsc).

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
To run the integration tests, first you'll need to run a node with the contracts properly deployed. For that, you can use the `node:integraton` command. Make sure to have ipfs running. Then use the `test:integration` command in the project or workspace that you want to test.

The required services for the graph-node are composed in a docker-compose file inside `<graph_node_repo>\docker\docker-compose.yml`. Currently there is an issue with the registrar on the graph-node that needs to be sorted. You can replace the `ethereum` env var with the corresponding URI for the ethereum node running in your setup (usually `bsc:http://127.0.0.1:8545`).

If you run into additional issues, you might try to recreate your graph-node db:
```
dropdb graph-node
createdb graph-node
```

Also, you might want to make sure test assertions are not being made against a state that was previously mutated by other test runs. To avoid this scenario, you will want to also recreate your Postgres DB and restart your ipfs and eth node services.

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
graph deploy <SUBGRAPH_NAME> --debug-fork <SUBGRAPH_ID> --ipfs http://localhost:5001 --node http://localhost:8020
```

After these steps you should quickly run into the indexing error. After updating the code you can redeploy the forked subgraph to check the fix.
