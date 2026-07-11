import {
  rpc,
  TransactionBuilder,
  Networks,
  Contract,
  scValToNative,
  nativeToScVal,
  Address,
  TimeoutInfinite,
  Account,
} from '@stellar/stellar-sdk';

const rpcUrl = import.meta.env.VITE_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const networkPassphrase = import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;

export const rpcServer = new rpc.Server(rpcUrl);

export const queryContract = async (
  contractId: string,
  method: string,
  args: any[] = []
): Promise<any> => {
  try {
    const contract = new Contract(contractId);
    const scValArgs = args.map(arg => {
      if (typeof arg === 'string' && arg.startsWith('G')) {
        return new Address(arg).toScVal();
      } else if (typeof arg === 'string') {
        return nativeToScVal(arg, { type: 'string' });
      } else if (typeof arg === 'number' || typeof arg === 'bigint') {
        return nativeToScVal(arg, { type: 'i128' });
      }
      return nativeToScVal(arg);
    });

    const dummyAddress = 'GBLRCMNZXN27HLB5XF2A66QW5K62B6M3X2Z33DIP7A3M52M5Z233DIP7';
    const tx = new TransactionBuilder(new Account(dummyAddress, '0'), {
      fee: '100',
      networkPassphrase,
    })
    .addOperation(contract.call(method, ...scValArgs))
    .setTimeout(TimeoutInfinite)
    .build();

    const simulation = await rpcServer.simulateTransaction(tx);
    
    // Check if simulation was successful
    if ('result' in simulation && simulation.result && 'retval' in simulation.result) {
      return scValToNative(simulation.result.retval);
    }
    
    throw new Error('Simulation failed or returned no value');
  } catch (error) {
    console.error(`Error querying contract (${method}):`, error);
    throw error;
  }
};

export const invokeContract = async (
  contractId: string,
  method: string,
  args: any[], // native JS types that we will convert to ScVal
  sourceAddress: string,
  signTx: (xdr: string, networkPassphrase: string) => Promise<string | null>
) => {
  try {
    // 1. Prepare arguments
    const contract = new Contract(contractId);
    
    // In our case we know the exact types for initialize and submit_proof
    // initialize: buyer(Address), seller(Address), rider(Address), otp_hash(String), amount(i128)
    // submit_proof: rider(Address), otp(String)
    
    const scValArgs = args.map(arg => {
      if (typeof arg === 'string' && arg.startsWith('G')) {
        return new Address(arg).toScVal();
      } else if (typeof arg === 'string') {
        return nativeToScVal(arg, { type: 'string' });
      } else if (typeof arg === 'number' || typeof arg === 'bigint') {
        return nativeToScVal(arg, { type: 'i128' });
      }
      return nativeToScVal(arg);
    });

    // 2. Fetch Account info
    const sourceAccount = await rpcServer.getAccount(sourceAddress);

    // 3. Build Transaction
    const tx = new TransactionBuilder(sourceAccount, {
      fee: '100', // Basic fee, will be updated from simulation
      networkPassphrase,
    })
    .addOperation(contract.call(method, ...scValArgs))
    .setTimeout(TimeoutInfinite)
    .build();

    // 4. Prepare Transaction (Simulates and assembles automatically)
    const preparedTx = await rpcServer.prepareTransaction(tx);
    
    // 6. Sign Transaction
    const signedXdr = await signTx(preparedTx.toXDR(), networkPassphrase);
    if (!signedXdr) throw new Error('Transaction signing was cancelled');

    const signedTx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);

    // 7. Submit Transaction
    const sendResponse = await rpcServer.sendTransaction(signedTx);
    
    if (sendResponse.status === 'ERROR') {
      throw new Error(`Transaction submission failed: ${sendResponse.errorResult}`);
    }

    // 8. Poll for completion
    let txResponse = await rpcServer.getTransaction(sendResponse.hash);
    
    // Wait for the transaction to be processed
    while (txResponse.status === 'NOT_FOUND') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      txResponse = await rpcServer.getTransaction(sendResponse.hash);
    }

    if (txResponse.status === 'FAILED') {
      throw new Error(`Transaction failed on-chain.`);
    }

    // SUCCESS
    let returnValue = null;
    if (txResponse.status === 'SUCCESS' && txResponse.returnValue) {
      returnValue = scValToNative(txResponse.returnValue);
    }

    return {
      hash: sendResponse.hash,
      returnValue,
    };

  } catch (error: any) {
    console.error(`Contract invocation error (${method}):`, error);
    throw error;
  }
};
