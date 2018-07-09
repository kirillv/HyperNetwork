/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
/**
 * Write your transction processor functions here
 */

/**
 * Sample transaction
 * @param {org.pone.network.SampleTransaction} sampleTransaction
 * @transaction
 */
async function sampleTransaction(tx) {
    // Save the old value of the asset.
    const oldValue = tx.asset.value;

    // Update the asset with the new value.
    tx.asset.value = tx.newValue;

    // Get the asset registry for the asset.
    const assetRegistry = await getAssetRegistry('org.pone.network.PoneUser');
    // Update the asset in the asset registry.
    await assetRegistry.update(tx.asset);

    // Emit an event for the modified asset.
    let event = getFactory().newEvent('org.pone.network', 'SampleEvent');
    event.asset = tx.asset;
    event.oldValue = oldValue;
    event.newValue = tx.newValue;
    emit(event);
}

function createUser(transaction) {
  // Creates user and wallet

  let userEmail = tx.email;
  let userName = tx.userName;
  let userUniq = tx.uniqId;

  let participantRegistry = await getParticipantRegistry('org.pone.network');
  let factory = getFactory();

  // Add check on query

  let participant = factory.newResource('org.pone.network', 'PoneUser', userUniq);

  participant.email = userEmail;
  participant.userName = userName;

  await participantRegistry.add(participant);
}

function onDepositCoin(transaction) {
    validateAmount(transaction.amount)
  
    var vault = transaction.vault
    vault.amount += transaction.amount
  
    var newTransaction = getFactory().newConcept('org.pone.network', 'CoinTransaction')
    newTransaction.amount = transaction.amount
    newTransaction.type = "DEPOSIT"
  
    if (vault.transactions) {
      vault.transactions.push(newTransaction)
    } else {
      vault.transactions = [newTransaction]
    }
  
    return getAssetRegistry('org.pone.network.Wallet')
      .then(function (assetRegistry) {
        return assetRegistry.update(vault)
      })
      .then(function () {
        sendEvent("Transfer complete");
      })
  }
  
  function onWithdrawCoin(transaction) {
    validateAmount(transaction.amount)
  
    var vault = transaction.vault
  
    if (vault.amount < transaction.amount) {
      throw new Error('Insufficient fund')
    }
  
    vault.amount -= transaction.amount
  
    var newTransaction = getFactory().newConcept('org.pone.network', 'CoinTransaction')
    newTransaction.amount = transaction.amount
    newTransaction.type = "WITHDRAW"
  
    if (vault.transactions) {
      vault.transactions.push(newTransaction)
    } else {
      vault.transactions = [newTransaction]
    }
  
    return getAssetRegistry('org.pone.network.Wallet')
      .then(function (assetRegistry) {
        return assetRegistry.update(vault)
      })
      .then(function () {
        sendEvent("Transfer complete");
      })
  }
  
  function onTransferCoin(transaction) {
    validateAmount(transaction.amount)
  
    if (transaction.sender.amount < transaction.amount) {
      throw new Error('Insufficient fund')
    }
  
    transaction.sender.amount -= transaction.amount
    transaction.receiver.amount += transaction.amount
    
    var sendTransaction = getFactory().newConcept('org.pone.network', 'CoinTransaction')
    sendTransaction.amount = transaction.amount
    sendTransaction.type = "SEND"
    if (transaction.sender.transactions) {
      transaction.sender.transactions.push(sendTransaction)
    } else {
      transaction.sender.transactions = [sendTransaction]
    }
    var receiveTransaction = getFactory().newConcept('org.pone.network', 'CoinTransaction')
    receiveTransaction.amount = transaction.amount
    receiveTransaction.type = "RECEIVE"
    if (transaction.receiver.transactions) {
      transaction.receiver.transactions.push(receiveTransaction)
    } else {
      transaction.receiver.transactions = [receiveTransaction]
    }
    
    return getAssetRegistry('org.pone.network.Wallet')
      .then(function (assetRegistry) {
        return assetRegistry.updateAll([transaction.sender, transaction.receiver])
      })
      .then(function () {
        sendEvent("Transfer complete")
      })
  }
  
  function validateAmount(amount) {
    if (amount < 0) {
      throw new Error('Invalid amount')
    }
  }
  
  function sendEvent(msg) {
    var coinEvent = getFactory().newEvent('org.pone.network', 'TransactionCompleted')
    coinEvent.msg = msg
    emit(coinEvent)
  }
