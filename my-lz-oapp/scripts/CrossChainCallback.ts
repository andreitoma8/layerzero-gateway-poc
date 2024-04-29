import { ethers } from 'hardhat'
import { Options } from '@layerzerolabs/lz-v2-utilities'

const gatewayOneAddress = '0xD62e5bBc7b4176e54D19EB65106312Dcb19DcB07'
const eidAmoy = 40267
const message = 'Test message.'
const nativeDrop = ethers.utils.parseEther('1')

async function main() {
    // Build the contracts
    const GatewayOne = await ethers.getContractFactory('GatewayOne')

    // Connect to the contracts
    const gatewayOne = GatewayOne.attach(gatewayOneAddress)

    const options = Options.newOptions().addExecutorLzReceiveOption(200000, nativeDrop.toBigInt()).toHex().toString()

    // Define native fee and quote for the message send operation
    let nativeFee = 0
    ;[nativeFee] = await gatewayOne.quote(eidAmoy, message, options, false)
    console.log('Native fee: ', nativeFee)

    // Execute send operation from Gateway One
    await gatewayOne.send(eidAmoy, message, options, { value: nativeFee.toString() })

    console.log('Gateway One message: ', await gatewayOne.data())
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
