import { Accordion, AccordionItem } from "@nextui-org/accordion";
import { Button } from "@nextui-org/button";

import { Address, Const, Constr, Data, fromText, LucidEvolution, MintingPolicy, SpendingValidator, TxSignBuilder } from "@lucid-evolution/lucid";
import { applyDoubleCborEncoding, applyParamsToScript, mintingPolicyToId, paymentCredentialOf, validatorToAddress } from "@lucid-evolution/utils";

const Script = {
  Mint: applyDoubleCborEncoding(
    "5902750101003232323232323223222533300532323232323232323232532333010300500613232323232325333016300730173754002264a66602e601860306ea80044c8c94ccc070c07c0084c94ccc068cdc39bad301c002480044cdc780080c0a50375c60340022c603a002660160066eb8c070c064dd50008b1804980c1baa3009301837546036603860306ea8c06cc060dd50008b198039bac301a00223375e601260306ea800404cdd5980c980d180d180d180d000980a9baa00d3017301800230160013012375400e2a666020600200c2646464a66602660080022a66602c602a6ea802c540085854ccc04cc02000454ccc058c054dd50058a8010b0b18099baa00a1323232325333018301b00213232533301730083018375401e2a66602e601060306ea8cc0240148cdd79805980d1baa00101515333017300c00113371e00402a29405854ccc05ccdc3800a4002266e3c0080545281bad3018002375c602c0022c60320026600e6eacc060c064c064c064c06400800cdd6180b80098099baa00b375c602a60246ea801c58dc3a400044646600200200644a66602a0022980103d87a8000132325333014300500213374a90001980c00125eb804cc010010004c064008c05c0048c04c00488c94ccc03cc010c040dd50008a5eb7bdb1804dd5980a18089baa001323300100100322533301300114c103d87a800013232323253330143372200e0042a66602866e3c01c0084cdd2a4000660306e980052f5c02980103d87a80001330060060033756602a0066eb8c04c008c05c008c054004dc3a400460166ea8004c038c03c008c034004c034008c02c004c01cdd50008a4c26cac6eb80055cd2ab9d5573caae7d5d02ba15745"
  ),

  Spend: applyDoubleCborEncoding(
    "5902750101003232323232323223222533300532323232323232323232532333010300500613232323232325333016300730173754002264a66602e601860306ea80044c8c94ccc070c07c0084c94ccc068cdc39bad301c002480044cdc780080c0a50375c60340022c603a002660160066eb8c070c064dd50008b1804980c1baa3009301837546036603860306ea8c06cc060dd50008b198039bac301a00223375e601260306ea800404cdd5980c980d180d180d180d000980a9baa00d3017301800230160013012375400e2a666020600200c2646464a66602660080022a66602c602a6ea802c540085854ccc04cc02000454ccc058c054dd50058a8010b0b18099baa00a1323232325333018301b00213232533301730083018375401e2a66602e601060306ea8cc0240148cdd79805980d1baa00101515333017300c00113371e00402a29405854ccc05ccdc3800a4002266e3c0080545281bad3018002375c602c0022c60320026600e6eacc060c064c064c064c06400800cdd6180b80098099baa00b375c602a60246ea801c58dc3a400044646600200200644a66602a0022980103d87a8000132325333014300500213374a90001980c00125eb804cc010010004c064008c05c0048c04c00488c94ccc03cc010c040dd50008a5eb7bdb1804dd5980a18089baa001323300100100322533301300114c103d87a800013232323253330143372200e0042a66602866e3c01c0084cdd2a4000660306e980052f5c02980103d87a80001330060060033756602a0066eb8c04c008c05c008c054004dc3a400460166ea8004c038c03c008c034004c034008c02c004c01cdd50008a4c26cac6eb80055cd2ab9d5573caae7d5d02ba15745"
  ),
};

export default function Dashboard(props: {
  lucid: LucidEvolution;
  address: Address;
  setActionResult: (result: string) => void;
  onError: (error: any) => void;
}) {
  const { lucid, address, setActionResult, onError } = props;

  async function submitTx(tx: TxSignBuilder) {
    const txSigned = await tx.sign.withWallet().complete();
    const txHash = await txSigned.submit();

    return txHash;
  }

  type Action = () => Promise<void>;
  type ActionGroup = Record<string, Action>;

  const actions: Record<string, ActionGroup> = {
    Minting: {
      mint: async () => {
        try {

          ///////////////////////////////////////////////////////////////////////////////////////////////////////////
          // getting and setting the OREF for parameters
          const utxos = await lucid.wallet().getUtxos();
          if (!utxos) throw "Empty user wallet!";

          const nonce = utxos[0];
          // //const { txHash, outputIndex } = nonce;
          // const outputReference = {
          //   transaction_id: nonce.txHash,   
          //   output_index: nonce.outputIndex,    
          // };

          const outref = new Constr (0 ,[new Constr(0 , [nonce.txHash]), BigInt(nonce.outputIndex)])
          

          // const oRef = new Constr(0, [String(nonce.txHash), BigInt(nonce.outputIndex)]);

          //assetname
          const tokenName = "LG";
          
          // applying parameters to the script
          const giftCard = applyParamsToScript(Script.Mint, [fromText(tokenName), outref])
          //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

          const mintingValidator: MintingPolicy = { type: "PlutusV3", script: giftCard };

          const validatorAddress = validatorToAddress(lucid.config().network, mintingValidator);

          const policyID = mintingPolicyToId(mintingValidator);
          // const assetName = "Always True Token";

          const mintedAssets = { [`${policyID}${fromText(tokenName)}`]: 1n };
          const redeemer = Data.to(0n);

           const utxo = await lucid.wallet().getUtxos();
          // const utxo1 = utxo[1]
          const datum = Data.void();
          // const campaignUTxO: UTxO[] = await lucid.utxosAt(validatorAddress)

          const tx = await lucid
            .newTx()
            .collectFrom([nonce] ,redeemer)
            .attach.MintingPolicy(mintingValidator)
            .mintAssets(mintedAssets ,redeemer)
            .pay.ToContract(validatorAddress, { kind: "inline", value: datum }, { lovelace: 50n })
            .complete()

            const signedTx = await tx.sign.withWallet().complete();
            const txHash1 = await signedTx.submit();
            const success = await lucid!.awaitTx(txHash1);
            console.log(txHash1);
             setWaitingUnlockTx(false);
 
      if (success) {
        setUnlockTxHash(txHash1);
      }
        } catch (error) {
          onError(error);
        }
      },

      // burn: async () => {
      //   try {
      //     const mintingValidator: MintingPolicy = { type: "PlutusV3", script: Script.Mint };

      //     const policyID = mintingPolicyToId(mintingValidator);
      //     const assetName = "Always True Token";
      //     const assetUnit = `${policyID}${fromText(assetName)}`;
      //     const burnedAssets = { [assetUnit]: -1_000n };
      //     const redeemer = Data.void();

      //     const utxos = await lucid.utxosAtWithUnit(address, assetUnit);

      //     const tx = await lucid.newTx().collectFrom(utxos).mintAssets(burnedAssets, redeemer).attach.MintingPolicy(mintingValidator).complete();

      //     submitTx(tx).then(setActionResult).catch(onError);
      //   } catch (error) {
      //     onError(error);
      //   }
      // },
    },

    Spending: {
      deposit: async () => {
        try {
          const { network } = lucid.config();
          const pkh = String(paymentCredentialOf(address).hash);

          //#region Contract Address
         // const spendingScript = applyParamsToScript(Script.Spend, [pkh]);
          const spendingValidator: SpendingValidator = { type: "PlutusV3", script: Script.Spend
          };

          const contractAddress = validatorToAddress(network, spendingValidator);
          //#endregion

          //#region Deposit Assets
         // const mintingValidator: MintingPolicy = { type: "PlutusV3", script: Script.Mint };

         // const policyID = mintingPolicyToId(mintingValidator);
          // const assetName = "Always True Token";

          //const depositAssets = { [`${policyID}${fromText(assetName)}`]: 1_000n };
          //#endregion

          const datum = Data.void();

          const tx = await lucid.newTx()
          .pay.ToContract(contractAddress, { kind: "inline", value: datum }, { lovelace: 20_000_000n})
          .complete();

          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      // withdraw: async () => {
      //   try {
      //     const { network } = lucid.config();
      //     const pkh = String(paymentCredentialOf(address).hash);

      //     //#region Contract Address
      //     const spendingScript = applyParamsToScript(Script.Spend, [pkh]);
      //     const spendingValidator: SpendingValidator = { type: "PlutusV3", script: spendingScript };

      //     const contractAddress = validatorToAddress(network, spendingValidator);
      //     //#endregion

      //     //#region Withdraw Assets
      //     const mintingValidator: MintingPolicy = { type: "PlutusV3", script: Script.Mint };

      //     const policyID = mintingPolicyToId(mintingValidator);
      //     const assetName = "Always True Token";

      //     const assetUnit = `${policyID}.${fromText(assetName)}`;
      //     //#endregion

      //     const redeemer = Data.void();

      //     const utxos = await lucid.utxosAtWithUnit(contractAddress, assetUnit);

      //     const tx = await lucid.newTx().collectFrom(utxos, redeemer).attach.SpendingValidator(spendingValidator).addSigner(address).complete();

      //     submitTx(tx).then(setActionResult).catch(onError);
      //   } catch (error) {
      //     onError(error);
      //   }
      // },
    },
  };

  return (
    <div className="flex flex-col gap-2">
      <span>{address}</span>

      <Accordion variant="splitted">
        {/* Minting */}
        <AccordionItem key="1" aria-label="Accordion 1" title="Minting">
          <div className="flex flex-wrap gap-2 mb-2">
            <Button onClick={actions.Minting.mint} className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg" radius="full">
              Mint
            </Button>
            <Button onClick={actions.Minting.burn} className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg" radius="full">
              Burn
            </Button>
          </div>
        </AccordionItem>

        {/* Spending */}
        <AccordionItem key="2" aria-label="Accordion 2" title="Spending">
          <div className="flex flex-wrap gap-2 mb-2">
            <Button onClick={actions.Spending.deposit} className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg" radius="full">
              Deposit
            </Button>
            <Button onClick={actions.Spending.withdraw} className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg" radius="full">
              Withdraw
            </Button>
          </div>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
function setWaitingUnlockTx(arg0: boolean) {
  throw new Error("Function not implemented.");
}

function setUnlockTxHash(txHash: any) {
  throw new Error("Function not implemented.");
}

