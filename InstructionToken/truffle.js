/*
 * NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a 
 * function when declaring them. Failure to do so will cause commands to hang. ex:
 * ```
 * mainnet: {
 *     provider: function() { 
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>') 
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */

module.exports = {
  networks: {
  development: {
  host: 'localhost',
  port: 7545,
  network_id: '5777' // Match any network id
  }//,
  // rinkeby: {
  //   host: "localhost", // Connect to geth on the specified
  //   port: 8545,
  //   from: "0x52f361c8bb891978aafd864b3d3761fce24ed956", // default address to use for any transaction Truffle makes during migrations
  //   network_id: 4,
  //   gas: 4612388 // Gas limit used for deploys
  // }
  }
  }