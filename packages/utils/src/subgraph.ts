import { createApolloFetch } from 'apollo-fetch';
import { execSync } from 'child_process';

// Types
interface SyncedSubgraphType {
  synced: boolean;
}

// Execute Child Processes
export const exec = (cmd: string, srcDir: string) => {
  try {
    return execSync(cmd, { cwd: srcDir, stdio: 'inherit' });
  } catch (e) {
    throw new Error(`Failed to run command \`${cmd}\``);
  }
};

// Subgraph Support
export const fetchSubgraphs = createApolloFetch({
  uri: 'http://localhost:8030/graphql',
});

export const fetchSubgraph = (subgraphUser: string, subgraphName: string) => {
  return createApolloFetch({
    uri: `http://localhost:8000/subgraphs/name/${subgraphUser}/${subgraphName}`,
  });
};

const checkIfAllSynced = (subgraphs: SyncedSubgraphType[]) => {
  const result = subgraphs.find((el: SyncedSubgraphType) => el.synced === false);
  return Boolean(!result);
};

export const waitForSubgraphToBeSynced = async (delay: number) =>
  new Promise<{ synced: boolean }>((resolve, reject) => {
    // Wait for 5s
    const deadline = Date.now() + 60 * 1000;

    // Function to check if the subgraph is synced
    const checkSubgraphSynced = async () => {
      try {
        const result = await fetchSubgraphs({
          query: `{ indexingStatuses { synced } }`,
        });

        if (checkIfAllSynced(result.data.indexingStatuses)) {
          resolve({ synced: true });
        } else {
          throw new Error('reject or retry');
        }
      } catch (e) {
        if (Date.now() > deadline) {
          console.log('The error: ', e);
          reject(new Error(`Timed out waiting for the subgraph to sync`));
        } else {
          setTimeout(checkSubgraphSynced, delay);
        }
      }
    };

    // Periodically check whether the subgraph has synced
    setTimeout(checkSubgraphSynced, delay);
  });
