import { ethers } from 'hardhat'
import { Options } from '@layerzerolabs/lz-v2-utilities'

const gatewayTwoAddress = '0x54CE92Aa092e5E7e38A90bDa28928AD736A15Bb8'
const eidSepolia = 40161
const message = 'Test message.'

async function main() {
    // Build the contracts
    const GatewayTwo = await ethers.getContractFactory('GatewayTwo')

    // Connect to the contracts
    const gatewayTwo = GatewayTwo.attach(gatewayTwoAddress)

    // Set up options for the message send operation
    const callbakcOptions = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString()
    const nativeDrop = (await gatewayTwo.quote(eidSepolia, message, callbakcOptions, false)).nativeFee
    console.log('Native drop: ', nativeDrop)

    console.log('Gateway Two message: ', await gatewayTwo.data())
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
