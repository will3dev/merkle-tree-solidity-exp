import { ethers } from "ethers";
import { expect } from "chai";
import { beforeEach } from "node:test";

describe("MerkleTree", function () {

    let merkleTree: any;
    let provider: ethers.JsonRpcProvider;
    let owner: any;

    beforeEach(async function () {
        provider = new ethers.JsonRpcProvider("http://localhost:8545");
        owner = provider.getSigner();

        const merkleTreeFactory = await ethers.getContractFactory("MerkleTree");
        merkleTree = await merkleTreeFactory.deploy();
    })

})