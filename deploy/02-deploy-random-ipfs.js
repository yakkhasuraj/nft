const { network, ethers } = require('hardhat');
const {
    developmentChains,
    networkConfig,
} = require('../helper-hardhat-config');
const { verify } = require('../utils/verify');

const tokenUris = [
    'ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo',
    'ipfs://QmYQC5aGZu2PTH8XzbJrbDnvhj3gVs7ya33H9mqUNvST3d',
    'ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm',
];

const FUND_AMOUNT = '1000000000000000000000';

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const { chainId } = network.config;

    let vrfCoordinatorV2Mock, vrfCoordinatorV2Address, subscriptionId;

    if (developmentChains.includes(network.name)) {
        vrfCoordinatorV2Mock = await ethers.getContract('VRFCoordinatorV2Mock');
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
        const transactionResponse =
            await vrfCoordinatorV2Mock.createSubscription();
        const transactionReceipt = await transactionResponse.wait();
        subscriptionId = transactionReceipt.events[0].args.subId;

        await vrfCoordinatorV2Mock.fundSubscription(
            subscriptionId,
            FUND_AMOUNT
        );
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2;
        subscriptionId = networkConfig[chainId].subscriptionId;
    }

    const { mintFee, keyHash, callbackGasLimit } = networkConfig[chainId];

    const args = [
        vrfCoordinatorV2Address,
        subscriptionId,
        keyHash,
        mintFee,
        tokenUris,
        callbackGasLimit,
    ];

    const waitConfirmations = developmentChains.includes(network.name) ? 1 : 6;

    const randomIPFS = await deploy('RandomIPFS', {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: waitConfirmations,
    });

    if (developmentChains.includes(network.name)) {
        await vrfCoordinatorV2Mock.addConsumer(
            subscriptionId,
            randomIPFS.address
        );
    }

    if (!developmentChains.includes(network.name) && ETHERSCAN_API_KEY) {
        await verify(randomIPFS.address, args);
    }
};

module.exports.tags = ['all', 'randomIPFS'];
