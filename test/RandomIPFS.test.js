const { assert, expect } = require('chai');
const { network, deployments, ethers } = require('hardhat');
const { developmentChains } = require('../helper-hardhat-config');

!developmentChains.includes(network.name)
    ? describe.skip
    : describe('RandomIPFS Unit Tests', function () {
          let randomIPFS, deployer, vrfCoordinatorV2Mock;

          beforeEach(async () => {
              accounts = await ethers.getSigners();
              deployer = accounts[0];
              await deployments.fixture(['mocks', 'randomIPFS']);
              randomIPFS = await ethers.getContract('RandomIPFS');
              vrfCoordinatorV2Mock = await ethers.getContract(
                  'VRFCoordinatorV2Mock'
              );
          });

          describe('constructor', () => {
              it('sets starting values correctly', async function () {
                  const dogTokenUriZero = await randomIPFS.getDogTokenUris(0);
                  assert(dogTokenUriZero.includes('ipfs://'));
              });
          });

          describe('requestNFT', () => {
              it("fails if payment isn't sent with the request", async function () {
                  await expect(
                      randomIPFS.requestNFT()
                  ).to.be.revertedWithCustomError(
                      randomIPFS,
                      'RandomIPFS_NeedMoreETH'
                  );
              });

              it('reverts if payment amount is less than the mint fee', async function () {
                  const fee = await randomIPFS.getMintFee();
                  await expect(
                      randomIPFS.requestNFT({
                          value: fee.sub(ethers.utils.parseEther('0.001')),
                      })
                  ).to.be.revertedWithCustomError(
                      randomIPFS,
                      'RandomIPFS_NeedMoreETH'
                  );
              });

              it('emits and event and kicks off a random word request', async function () {
                  const fee = await randomIPFS.getMintFee();

                  await expect(
                      randomIPFS.requestNFT({ value: fee.toString() })
                  ).to.emit(randomIPFS, 'NFTRequested');
              });
          });

          describe('getBreedFromModdedRng', () => {
              it('should return pug if moddedRng < 10', async function () {
                  const expectedValue = await randomIPFS.getBreedFromModdedRng(
                      7
                  );
                  assert.equal(0, expectedValue);
              });

              it('should return shiba-inu if moddedRng is between 10 - 39', async function () {
                  const expectedValue = await randomIPFS.getBreedFromModdedRng(
                      21
                  );
                  assert.equal(1, expectedValue);
              });

              it('should return st. bernard if moddedRng is between 40 - 99', async function () {
                  const expectedValue = await randomIPFS.getBreedFromModdedRng(
                      77
                  );
                  assert.equal(2, expectedValue);
              });

              it('should revert if moddedRng > 99', async function () {
                  await expect(
                      randomIPFS.getBreedFromModdedRng(1001)
                  ).to.be.revertedWithCustomError(
                      randomIPFS,
                      'RandomIPFS_RangeOutOfBounds'
                  );
              });
          });
      });
