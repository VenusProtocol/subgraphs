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
  uri: 'http://graph-node:8030/graphql',
});

export const fetchSubgraph = (subgraphUser: string, subgraphName: string) => {
  return createApolloFetch({
    uri: `http://graph-node:8000/subgraphs/name/${subgraphUser}/${subgraphName}`,
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
          query: `{ 
            indexingStatuses { 
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
          }`,
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

export const deploy = async ({
  root,
  packageName,
  subgraphAccount,
  subgraphName,
  syncDelay,
}: {
  root: string;
  packageName: string;
  subgraphAccount: string;
  subgraphName: string;
  syncDelay: number;
}) => {
  // Create Subgraph Connection
  const subgraph = fetchSubgraph(subgraphAccount, subgraphName);

  // Build and Deploy Subgraph
  console.log('Build and deploy subgraph...');
  exec(`yarn workspace ${packageName} run prepare:docker`, root);
  exec(`yarn workspace ${packageName} run codegen`, root);
  exec(`yarn workspace ${packageName} run build:docker`, root);
  exec(`yarn workspace ${packageName} run create:docker`, root);
  exec(`npx graph deploy ${subgraphAccount}/${subgraphName} --ipfs http://ipfs:5001 --node http://graph-node:8020/ --version-label ${Date.now().toString()}`, root);
  await waitForSubgraphToBeSynced(syncDelay);
  return { subgraph };
};

export default deploy;
