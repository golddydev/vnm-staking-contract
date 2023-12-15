import { SpendingValidator } from 'https://deno.land/x/lucid@0.10.7/mod.ts';

import blueprint from '../plutus.json' assert { type: 'json' };

export function readStakingContract(): SpendingValidator {
  const validator = blueprint.validators[0];
  return {
    type: 'PlutusV2',
    script: validator.compiledCode,
  };
}
