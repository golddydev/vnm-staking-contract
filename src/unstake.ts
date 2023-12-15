import {
  Blockfrost,
  Data,
  Lucid,
  SpendingValidator,
  TxHash,
  UTxO,
} from 'https://deno.land/x/lucid@0.10.7/mod.ts';

// import dotenv
import 'https://deno.land/x/dotenv@v3.2.2/load.ts';

// import utils
import { readStakingContract } from './utils.ts';

const lucid = await Lucid.new(
  new Blockfrost(
    'https://cardano-preview.blockfrost.io/api/v0',
    Deno.env.get('BLOCKFROST_API_KEY')
  ),
  'Preview'
);

lucid.selectWalletFromPrivateKey(await Deno.readTextFile('./src/key.sk'));

const stakingContract = readStakingContract();
const stakingContractAddress = lucid.utils.validatorToAddress(stakingContract);
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

// filter utxos
const scriptUtxos = await lucid.utxosAt(stakingContractAddress);

const utxos = scriptUtxos.filter((utxo) => {
  const datum = Data.from(utxo.datum!);
  if (typeof datum === 'object') {
    const realDatum = Data.castFrom<StakingDatum>(datum, StakingDatum);
    console.log(realDatum.staker, realDatum.staking_period);
    return realDatum.staker === ownerPublicKeyHash;
  }
  return false;
});

if (utxos.length > 0) {
  const unstakingTxHash = await unstake(utxos, {
    from: stakingContract,
    redeemer: Data.void(),
  });
  console.log('UnStaking Tx Hash: ', unstakingTxHash);
  console.log('2000000 MyTestToken are unstaked from contract.');
} else {
  console.log('There is no staked token.');
}

// unstaking function
async function unstake(
  utxos: UTxO[],
  { from, redeemer }: { from: SpendingValidator; redeemer: string }
): Promise<TxHash> {
  const tx = await lucid
    .newTx()
    .collectFrom(utxos, redeemer)
    .addSigner(await lucid.wallet.address())
    .attachSpendingValidator(from)
    .complete();

  const signedTx = await tx.sign().complete();

  return signedTx.submit();
}
