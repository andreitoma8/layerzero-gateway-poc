import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Contract, ContractFactory } from 'ethers'
import { deployments, ethers } from 'hardhat'

import { Options } from '@layerzerolabs/lz-v2-utilities'

describe('GatewayPoC Test', function () {
    // Constant representing a mock Endpoint ID for testing purposes
    const eidA = 1
    const eidB = 2
    // Declaration of variables to be used in the test suite
    let GatewayOneFactory: ContractFactory
    let GatewayTwoFactory: ContractFactory
    let EndpointV2Mock: ContractFactory
    let gatewayOne: Contract
    let gatewayTwo: Contract
    let ownerOne: SignerWithAddress
    let ownerTwo: SignerWithAddress
    let endpointOwner: SignerWithAddress
    let mockEndpointV2A: Contract
    let mockEndpointV2B: Contract

    // Before hook for setup that runs once before all tests in the block
    before(async function () {
        // Contract factory for our tested contract
        GatewayOneFactory = await ethers.getContractFactory('GatewayOne')
        GatewayTwoFactory = await ethers.getContractFactory('GatewayTwo')

        // Fetching the first three signers (accounts) from Hardhat's local Ethereum network
        const signers = await ethers.getSigners()

        ownerOne = signers.at(0)!
        ownerTwo = signers.at(1)!
        endpointOwner = signers.at(2)!

        // The EndpointV2Mock contract comes from @layerzerolabs/test-devtools-evm-hardhat package
        // and its artifacts are connected as external artifacts to this project
        //
        // Unfortunately, hardhat itself does not yet provide a way of connecting external artifacts,
        // so we rely on hardhat-deploy to create a ContractFactory for EndpointV2Mock
        //
        // See https://github.com/NomicFoundation/hardhat/issues/1040
        const EndpointV2MockArtifact = await deployments.getArtifact('EndpointV2Mock')
        EndpointV2Mock = new ContractFactory(EndpointV2MockArtifact.abi, EndpointV2MockArtifact.bytecode, endpointOwner)
    })

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async function () {
        // Deploying a mock LZ EndpointV2 with the given Endpoint ID
        mockEndpointV2A = await EndpointV2Mock.deploy(eidA)
        mockEndpointV2B = await EndpointV2Mock.deploy(eidB)

        // Deploying two instances of the Gateway contracts and linking them to the mock LZEndpoint
        gatewayOne = await GatewayOneFactory.deploy(mockEndpointV2A.address, ownerOne.address)
        gatewayTwo = await GatewayTwoFactory.deploy(mockEndpointV2B.address, ownerTwo.address)

        // Setting destination endpoints in the LZEndpoint mock for each MyOApp instance
        await mockEndpointV2A.setDestLzEndpoint(gatewayTwo.address, mockEndpointV2B.address)
        await mockEndpointV2B.setDestLzEndpoint(gatewayOne.address, mockEndpointV2A.address)

        // Setting each Gateway instance as a peer of the other
        await gatewayOne.connect(ownerOne).setPeer(eidB, ethers.utils.zeroPad(gatewayTwo.address, 32))
        await gatewayTwo.connect(ownerTwo).setPeer(eidA, ethers.utils.zeroPad(gatewayOne.address, 32))

        // Fund Gateway Two with some native token to cover the callback message sending fee
        await ownerOne.sendTransaction({ to: gatewayTwo.address, value: ethers.utils.parseEther('1') })
    })

    // A test case to verify message sending functionality
    it('should do a back and forth cross-chain call', async function () {
        // Assert initial state of data in Gateway One
        expect(await gatewayOne.data()).to.equal('Nothing received yet.')
        expect(await gatewayTwo.data()).to.equal('Nothing received yet.')
        const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString()

        // Define native fee and quote for the message send operation
        let nativeFee = 0
        ;[nativeFee] = await gatewayOne.quote(eidB, 'Test message.', options, false)

        // Execute send operation from Gateway One
        await gatewayOne.send(eidB, 'Test message.', options, { value: nativeFee.toString() })

        // Assert the resulting state of data Gateway Two
        expect(await gatewayTwo.data()).to.equal('Test message.', "Gateway Two didn't receive the message.")

        // Assert the resulting state after the callback to Gateway One
        expect(await gatewayOne.data()).to.equal('Test message.', "Gateway One didn't receive the message back.")
    })
})
