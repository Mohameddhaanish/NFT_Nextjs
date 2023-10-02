const fs = require('fs');
require('@nomiclabs/hardhat-waffle');


module.exports = {
  networks: {
    goerli: {
      url: 'https://eth-goerli.g.alchemy.com/v2/jLpNwcmMfQvTU6aaLUJyzVz6o5M-KyYJ',
      accounts: [
        '7cc01040714479257bf1cb80add6840d8547c212793c89f62355c7045fc1375e',
      ],
    },
  },
  solidity: '0.8.4',
};
