const { assert } = require('chai');
const { network, ethers, deployments } = require('hardhat');
const { developmentChains } = require('../helper-hardhat-config');

!developmentChains.includes(network.name)
    ? describe.skip
    : describe('BasicNFT Unit Test', function () {
          let accounts, basicNFT, deployer;

          beforeEach(async function () {
              accounts = await ethers.getSigners();
              deployer = accounts[0];
              await deployments.fixture(['mocks', 'basicNFT']);
              basicNFT = await ethers.getContract('BasicNFT');
          });

          describe('constructor', function () {
              it('initializes the basicNFT', async function () {
                  const name = await basicNFT.name();
                  const symbol = await basicNFT.symbol();
                  const tokenCounter = await basicNFT.getTokenCounter();

                  assert.equal(name, 'Doggy');
                  assert.equal(symbol, 'DOG');
                  assert.equal(tokenCounter.toString(), '0');
              });
          });

          describe('mintNFT', function () {
              it('allows users to mint an NFT', async function () {
                  await basicNFT.mintNFT();
                  const tokenURI = await basicNFT.tokenURI(0);
                  const tokenCounter = await basicNFT.getTokenCounter();

                  assert.equal(tokenCounter.toString(), '1');
                  assert.equal(tokenURI, await basicNFT.TOKEN_URI());
              });
          });
      });
