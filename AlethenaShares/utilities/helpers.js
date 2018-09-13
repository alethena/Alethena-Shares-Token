//Used to increase time in simulated EVM

Object.assign(exports, require('ethjs-util'));

exports.increaseTime = async function (duration) {
    const id = Date.now();
  
    return new Promise((resolve, reject) => {
      web3.currentProvider.sendAsync({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [duration],
        id: id,
      }, err1 => {
        if (err1) return reject(err1);
  
        web3.currentProvider.sendAsync({
          jsonrpc: '2.0',
          method: 'evm_mine',
          id: id + 1,
        }, (err2, res) => {
          return err2 ? reject(err2) : resolve(res);
        });
      });
    });
  }
  
  //Used to check that EVM reverts when we expect it
  exports.shouldRevert = async function (promise) {
    try {
        await promise;
    } catch (error) {
        const revert = error.message.search('revert') >= 0;
        assert(
            revert,
            'Expected throw, got \'' + error + '\' instead',
        );
        return;
    }
    assert.fail('Expected throw not received');
  }


