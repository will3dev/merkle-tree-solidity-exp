import { ethers } from "ethers";
import { expect, beforeEach, describe, it } from "vitest";
//import { MerkleTree__factory } from "../../types/MerkleTree.sol.js";
import MerkleTreeArtifact from "../../out/MerkleTree.sol/MerkleTree.json" with { type: "json" };

describe("MerkleTree", function () {

    let merkleTree: any;
    let provider: ethers.JsonRpcProvider;
    let owner: any;

    beforeEach(async function () {
        // Connect to Anvil
        provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
        
        // Get the first account from Anvil
        const accounts = await provider.getSigner();
        owner = accounts;
        
        const factory = new ethers.ContractFactory(
            MerkleTreeArtifact.abi,
            MerkleTreeArtifact.bytecode,
            owner
        );
        
        // Deploy without connecting again
        merkleTree = await factory.deploy();
        await merkleTree.waitForDeployment();
    });

    it("should successfully add a leaf", async function () {
        const merkleRootBefore = await merkleTree.getMerkleRoot();
        expect(merkleRootBefore).to.equal(ethers.ZeroHash);
        
        const leaf = ethers.keccak256(ethers.toUtf8Bytes("test"));
        const tx = await merkleTree.addLeaf(leaf);
        const receipt = await tx.wait();

        const leafCount = await merkleTree.getLeafCount();

        const merkleRootAfter = await merkleTree.getMerkleRoot();

        expect(merkleRootAfter).to.not.equal(merkleRootBefore);
        expect(merkleRootAfter).to.equal(ethers.keccak256(ethers.toUtf8Bytes("test")));
    });

    it("should calculate the correct merkle root", async function () {
        const leaves = [];

        for (let i = 0; i < 4; i ++) {
            const leaf = ethers.keccak256(ethers.toUtf8Bytes((i+1).toString()));
            leaves.push(leaf);
        }

        for (const leaf of leaves) {
            const tx = await merkleTree.addLeaf(leaf);
            const receipt = await tx.wait();
            expect(receipt.status).to.equal(1);
        }

        const merkleRoot = await merkleTree.getMerkleRoot();
        console.log("Merkle Root:", merkleRoot);

        const levelOneLeft = ethers.keccak256(ethers.concat([leaves[0], leaves[1]]));

        const levelOneRight = ethers.keccak256(ethers.concat([leaves[2], leaves[3]]));
        const merkleRootManual = ethers.keccak256(ethers.concat([levelOneLeft, levelOneRight]));

        expect(merkleRoot).to.equal(merkleRootManual);  
        
    });

    it("should fail to generate a proof for a leaf that doesn't exist", async function () {
        const leaves = [];

        for (let i = 0; i < 4; i ++) {
            const leaf = ethers.keccak256(ethers.toUtf8Bytes((i+1).toString()));
            leaves.push(leaf);
        }

        for (const leaf of leaves) {
            const tx = await merkleTree.addLeaf(leaf);
            const receipt = await tx.wait();
            expect(receipt.status).to.equal(1);
        }
        
        try {
            const proof = await merkleTree.generateMerkleProof(5);
            expect.fail("Should have reverted");
        } catch (error: any) {
            expect(error.message).to.include("Leaf position out of bounds");
        }

    });

    it("should validate a proof successfully", async function () {
        const leaves = [];

        for (let i = 0; i < 4; i ++) {
            const leaf = ethers.keccak256(ethers.toUtf8Bytes((i+1).toString()));
            leaves.push(leaf);
        }

        for (const leaf of leaves) {
            const tx = await merkleTree.addLeaf(leaf);
            const receipt = await tx.wait();
            expect(receipt.status).to.equal(1);
        }

        // Debug: Check leaf count and merkle root
        const leafCount = await merkleTree.getLeafCount();
        const merkleRoot = await merkleTree.getMerkleRoot();

        // Test proof for each leaf
        for (let i = 0; i < leaves.length; i++) {
            console.log("Generating proof for leaf", i);
            const proof = await merkleTree.generateMerkleProof(i);

            // Convert proof to a regular array if needed
            const proofArray = Array.from(proof);
            console.log("Proof Array:", proofArray);

            const isValid = await merkleTree.validateProof(i, proofArray);
            console.log("Is Valid:", isValid);
            expect(isValid).to.equal(true);
        }
    });

    it("should fail to validate a proof with an invalid leaf", async function () {
        const leaves = [];

        for (let i = 0; i < 4; i ++) {
            const leaf = ethers.keccak256(ethers.toUtf8Bytes((i+1).toString()));
            leaves.push(leaf);
        }

        for (const leaf of leaves) {
            const tx = await merkleTree.addLeaf(leaf);
            const receipt = await tx.wait();
            expect(receipt.status).to.equal(1);
        }

        // Generate a valid proof
        const proof = await merkleTree.generateMerkleProof(0);

        // Convert proof to a regular array if needed
        const proofArray = Array.from(proof);
        
        try {
            await merkleTree.validateProof(5, proofArray);
            expect.fail("Should have reverted");
        } catch (error: any) {
            console.log(error.message);
            expect(error.message).to.include("Leaf position out of bounds");
        }
    });

    it("should fail to validate a proof with an invalid proof", async function () {
        const leaves = [];

        for (let i = 0; i < 4; i ++) {
            const leaf = ethers.keccak256(ethers.toUtf8Bytes((i+1).toString()));
            leaves.push(leaf);
        }

        for (const leaf of leaves) {
            const tx = await merkleTree.addLeaf(leaf);
            const receipt = await tx.wait();
            expect(receipt.status).to.equal(1);
        }

        // Create an invalid proof (wrong length)
        const invalidProof = [ethers.ZeroHash, ethers.ZeroHash];
        
        
        const isValid = await merkleTree.validateProof(0, invalidProof);
        expect(isValid).to.equal(false);
    });

    it("should fail to validate a proof with an invalid proof length", async function () {
        const leaves = [];

        for (let i = 0; i < 4; i ++) {
            const leaf = ethers.keccak256(ethers.toUtf8Bytes((i+1).toString()));
            leaves.push(leaf);
        }

        for (const leaf of leaves) {
            const tx = await merkleTree.addLeaf(leaf);
            const receipt = await tx.wait();
            expect(receipt.status).to.equal(1);
        }

        // Create an invalid proof (wrong length)
        const invalidProof = [ethers.ZeroHash];
        
        try {
            await merkleTree.validateProof(0, invalidProof);
            expect.fail("Should have reverted");
        } catch (error: any) {
            expect(error.message).to.include("Invalid proof length");
        }
    });
    
})