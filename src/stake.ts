import {
  Blockfrost,
  Data,
  Lucid,
  SpendingValidator,
  TxHash,
} from 'https://deno.land/x/lucid@0.10.7/mod.ts';

// import dotenv
import 'https://deno.land/x/dotenv@v3.2.2/load.ts';

// import utils
import { readStakingContract } from './utils.ts';

const testPolicyId = 'ee0bf0bab0c111dba35a6dce7f915d2e1bdada3c54aec5d9e54f5005';
const testAssetName = '4d7954657374546f6b656e';

const lucid = await Lucid.new(
  new Blockfrost(
    'https://cardano-preview.blockfrost.io/api/v0',
    Deno.env.get('BLOCKFROST_API_KEY')
  ),
  'Preview'
);

lucid.selectWalletFromPrivateKey(await Deno.readTextFile('./src/key.sk'));

const stakingContract = readStakingContract();
const ownerPublicKeyHash = lucid.utils.getAddressDetails(
  await lucid.wallet.address()
).paymentCredential?.hash!;

// declare types
const StakingDatum = Data.Object({
  staking_period: Data.Integer({
    minimum: 0,
  }),
  staker: Data.Bytes(),
  staked_token_info: Data.Object({
    policy_id: Data.Bytes(),
    asset_name: Data.Bytes(),
  }),
});

type StakingDatum = Data.Static<typeof StakingDatum>;

const datum = Data.to<StakingDatum>(
  {
    staked_token_info: {
      policy_id: testPolicyId,
      asset_name: testAssetName,
    },
    staker: ownerPublicKeyHash,
    staking_period: BigInt(3600 * 24 * 30),
  },
  StakingDatum
);

const amount = 1000000n;
const stakingTxHash = await stake(`${testPolicyId}${testAssetName}`, amount, {
  into: stakingContract,
  datum: datum,
});
console.log('Staking Tx Hash: ', stakingTxHash);
console.log('1000000 MyTestToken are staked.');

// staking function
async function stake(
  assetId: string,
  amount: bigint,
  { into, datum }: { into: SpendingValidator; datum: string }
): Promise<TxHash> {
  const contractAddress = lucid.utils.validatorToAddress(into);

  const tx = await lucid
    .newTx()
    .payToContract(
      contractAddress,
      {
        inline: datum,
      },
      {
        [assetId]: amount,
      }
    )
    .complete();

  const signedTx = await tx.sign().complete();

  return signedTx.submit();
}
