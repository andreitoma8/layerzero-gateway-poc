import { EndpointId } from '@layerzerolabs/lz-definitions'

import type { OAppOmniGraphHardhat, OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat'

const sepoliaContract: OmniPointHardhat = {
    eid: EndpointId.SEPOLIA_V2_TESTNET,
    contractName: 'GatewayOne',
}

const amoyContract: OmniPointHardhat = {
    eid: EndpointId.AMOY_V2_TESTNET,
    contractName: 'GatewayTwo',
}

const config: OAppOmniGraphHardhat = {
    contracts: [
        {
            contract: sepoliaContract,
        },
        {
            contract: amoyContract,
        },
    ],
    connections: [
        {
            from: sepoliaContract,
            to: amoyContract,
        },
        {
            from: amoyContract,
            to: sepoliaContract,
        },
    ],
}

export default config
