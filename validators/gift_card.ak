use aiken/collection/dict
use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/address.{Address, Script}
use cardano/assets.{AssetName, PolicyId, from_asset_list, zero}
use cardano/transaction.{
  Input, NoDatum, Output, OutputReference, Transaction, placeholder,
}

// use mocktail/virgin_address.{mock_verfication_key_credential}
// use mocktail/virgin_key_hash.{mock_policy_id}
// use mocktail/virgin_output_reference.{mock_utxo_ref}

pub type Action {
  CheckMint
  CheckBurn
}

validator gift_card(token_name: ByteArray, utxo_ref: OutputReference) {
  spend(_d: Option<Data>, _r: Data, _o: Data, tx: Transaction) {
    let Transaction { mint, inputs, .. } = tx
    expect Some(own_input) =
      list.find(inputs, fn(input) { input.output_reference == utxo_ref })

    expect Script(policy_id) = own_input.output.address.payment_credential
    expect [Pair(asset_name, amount)] =
      mint
        |> assets.tokens(policy_id)
        |> dict.to_pairs()

    amount == -1 && asset_name == token_name
  }

  mint(rdmr: Action, policy_id: PolicyId, tx: Transaction) {
    let Transaction { inputs, mint, .. } = tx
    expect [Pair(asset_name, amount)] =
      mint
        |> assets.tokens(policy_id)
        |> dict.to_pairs()
    when rdmr is {
      CheckMint -> {
        expect Some(_input) =
          list.find(inputs, fn(input) { input.output_reference == utxo_ref })
        amount == 1 && asset_name == token_name
      }
      CheckBurn -> amount == -1 && asset_name == token_name
    }
  }

  else(_) {
    fail
  }
}
// fn get_tx(mint, sign: List<VerificationKeyHash>) {
//   let tx_input =
//     Input {
//       output_reference: mock_utxo_ref(1, 2),
//       output: Output {
//         address: Address {
//           payment_credential: mock_verfication_key_credential(variation: 1),
//           stake_credential: None,
//         },
//         value: zero,
//         datum: NoDatum,
//         reference_script: None,
//       },
//     }
//   let tx_inputs = [tx_input]

//   Transaction {
//     ..placeholder,
//     mint: mint,
//     inputs: tx_inputs,
//     extra_signatories: sign,
//   }
// }

// test gift_test() {
//   let token_name: AssetName = "gift"
//   let utxo_ref = mock_utxo_ref(1, 2)
//   let policy_id = mock_policy_id(1)

//   let mint = from_asset_list([Pair(policy_id, [Pair(token_name, 1)])])

//   let tx = get_tx(mint, [])
//   gift_card.mint(token_name, utxo_ref, CheckMint, policy_id, tx)
// }
// test gift_spend_test() {
//   let token_name: AssetName = "gift"
//   let utxo_ref = mock_utxo_ref(1, 2)
//   let policy_id = mock_policy_id(1)

//   // Create a "burn" mint by setting the amount to -1 for the asset
//   let mint = from_asset_list([Pair(policy_id, [Pair(token_name, -1)])])

//   // Construct the transaction with the mint field and inputs
//   let tx = get_tx(mint, [])

//   // Run the `spend` validator, which should return true for the valid burn
//   gift_card.spend(token_name, utxo_ref, None, None, None, tx)
// }
