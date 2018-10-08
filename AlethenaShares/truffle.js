var HDWalletProvider = require("truffle-hdwallet-provider");

const privKey = Buffer.from('A84BE9B559ABE1EC663CF4A69CDCF05ABB628793ED53535D69FA2C410D3D1FF1');
const mnemonic = 'modify rent major hazard curious strike swear struggle sweet educate finish inhale'
module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 7545,
      network_id: '*' // Match any network id
    },
    // testnets
    // properties
    // network_id: identifier for network based on ethereum blockchain. Find out more at https://github.com/ethereumbook/ethereumbook/issues/110
    // gas: gas limit
    // gasPrice: gas price in gwei
    ropsten: {
      provider: () => new HDWalletProvider(mnemonic, "https://ropsten.infura.io/v3/"),
      network_id: 3,
      gas: 3000000,
      gasPrice: 21
    },
    kovan: {
      provider: () => new HDWalletProvider(process.env.MNENOMIC, "https://kovan.infura.io/v3/" + process.env.INFURA_API_KEY),
      network_id: 42,
      gas: 3000000,
      gasPrice: 21
    },
    rinkeby: {
      provider: () => {
        return new HDWalletProvider(mnemonic, "https://www.rinkeby.infura.io/v3/e7ec903e54b9473598306368d84a517b")
      },
      network_id: 4,
      gas: 6612388, // Gas limit used for deploys
      gasPrice: 2700000
    },
    // main ethereum network(mainnet)
    main: {
      provider: () => new HDWalletProvider(process.env.MNENOMIC, "https://mainnet.infura.io/v3/" + process.env.INFURA_API_KEY),
      network_id: 1,
      gas: 3000000,
      gasPrice: 21
    }
  }

}