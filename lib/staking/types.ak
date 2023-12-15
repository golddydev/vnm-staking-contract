use aiken/hash.{Blake2b_224, Hash}
use aiken/time.{PosixTime}
use aiken/transaction/credential.{VerificationKey}
use aiken/transaction/value.{AssetName, PolicyId}

pub type StakedTokenInformation {
  policy_id: PolicyId,
  asset_name: AssetName,
}

pub type StakingDatum {
  /// POSIX time in second for staking period, e.g. 1 month, 3 momnths, ...
  staking_period: PosixTime,
  /// Staker credential: Staker's public key hash
  staker: VerificationKeyHash,
  /// staked asset information (policy id, asset name)
  staked_token_info: StakedTokenInformation,
}

pub type VerificationKeyHash =
  Hash<Blake2b_224, VerificationKey>

pub type StakingRedeemer {
  SpendRedeemer
}
