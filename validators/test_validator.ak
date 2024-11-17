// validator spending {
//   spend(datum: Option<Data>, _redeemer, _oref, tx: Transaction) {
//     let Transaction { inputs, id, .. } = tx
//     and {
//       must_be_signed_by(tx.extra_signatories, signer),
//       in_valid_after(validity_range, deadline),
//       match_oref(inputs.output_reference, o_ref),
//     }
//   }

//   else(_) {
//     fail
//   }
// }

// fn match_oref(oref: OutputReference, oref: OutputReference) {
//   list.has(inputs.output_reference, oref)
// }
