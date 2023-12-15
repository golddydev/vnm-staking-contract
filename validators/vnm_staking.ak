use aiken/transaction.{ScriptContext, Spend}
use staking/types.{StakingDatum, StakingRedeemer}
use staking/utils.{must_be_signed_by}

validator {
  fn unstake(
    datum: StakingDatum,
    _redeemer: StakingRedeemer,
    ctx: ScriptContext,
  ) -> Bool {
    let ScriptContext { transaction, purpose } = ctx

    when purpose is {
      Spend(_) -> must_be_signed_by(transaction, datum.staker)
      _ -> False
    }
  }
}
