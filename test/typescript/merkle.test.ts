import { ethers } from "ethers";
import { expect, beforeEach, describe, it } from "vitest";
//import { MerkleTree__factory } from "../../types/MerkleTree.sol.js";
import MerkleTreeTestArtifact from "../../out/MerkleTreeTest.sol/MerkleTreeTest.json" with { type: "json" };
import { calculateMerkleRoot, hashValues, hashValue, generateMerkleProof} from "./helpers.js";


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
            MerkleTreeTestArtifact.abi,
            MerkleTreeTestArtifact.bytecode,
            owner
        );
        
        // Deploy without connecting again
        merkleTree = await factory.deploy();
        await merkleTree.waitForDeployment();
    });

    it("should successfully add a leaf", async function () {
        expect(await merkleTree.isValidRoot(ethers.ZeroHash)).to.equal(true);
        
        const leaf = ethers.keccak256(ethers.toUtf8Bytes("test"));
        const tx = await merkleTree.addLeaf(leaf);
        const receipt = await tx.wait();

        const leafCount = await merkleTree.getLeafCount();

        expect(await merkleTree.isValidRoot(leaf)).to.equal(true);
    });

    it("should calculate the correct merkle root - even number of leaves", async function () {
        const leaves = [];

        // calculate leaf values
        for (let i = 0; i < 4; i ++) {
            const leaf = await hashValue((i+1).toString());
            leaves.push(leaf);
        }

        // add leaves to the tree
        for (const leaf of leaves) {
            const tx = await merkleTree.addLeaf(leaf);
            const receipt = await tx.wait();
            expect(receipt.status).to.equal(1);
        }

        const leavesFromTree = await merkleTree.getLeaves();

        // manually calculate the merkleRoot
        const merkleRootManual = await calculateMerkleRoot(leavesFromTree);

        expect(await merkleTree.isValidRoot(merkleRootManual)).to.equal(true);  
        
    });

    it("should calculate the correct merkle root - odd number of leaves", async function () {
        const leaves = [];

        for (let i = 0; i < 5; i ++) {
            const leaf = await hashValue((i+1).toString());
            leaves.push(leaf);
        }

        for (const leaf of leaves) {
            const tx = await merkleTree.addLeaf(leaf);
            const receipt = await tx.wait();
            expect(receipt.status).to.equal(1);
        }

        const leavesFromTree = await merkleTree.getLeaves();
        const merkleRootManual = await calculateMerkleRoot(leavesFromTree);

        expect(await merkleTree.isValidRoot(merkleRootManual)).to.equal(true);
        
    });

    it("should fail to generate a proof for a leaf that doesn't exist", async function () {
        const leaves = [];

        for (let i = 0; i < 4; i ++) {
            const leaf = await hashValue((i+1).toString());
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
        const leavesFromTree = await merkleTree.getLeaves();
        const merkleRoot = await calculateMerkleRoot(leavesFromTree);

        // Test proof for each leaf
        for (let i = 0; i < leaves.length; i++) {
            console.log("Generating proof for leaf", i);
            const proof = await generateMerkleProof(i, leavesFromTree);

            // Convert proof to a regular array if needed
            const proofArray = Array.from(proof);
            console.log("Proof Array:", proofArray);

            const isValid = await merkleTree.validateProof(i, proofArray, merkleRoot);
            console.log("Is Valid:", isValid);
            expect(isValid).to.equal(true);
        }
    });

    it("should fail to validate a proof with an invalid leaf", async function () {
        const leaves = [];

        for (let i = 0; i < 4; i ++) {
            const leaf = await hashValue((i+1).toString());
            leaves.push(leaf);
        }

        for (const leaf of leaves) {
            const tx = await merkleTree.addLeaf(leaf);
            const receipt = await tx.wait();
            expect(receipt.status).to.equal(1);
        }

        const leavesFromTree = await merkleTree.getLeaves();
        const merkleRoot = await calculateMerkleRoot(leavesFromTree);

        // Generate a valid proof
        const proof = await generateMerkleProof(0, leavesFromTree);

        // Convert proof to a regular array if needed
        const proofArray = Array.from(proof);
        
        try {
            await merkleTree.validateProof(5, proofArray, merkleRoot);
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

        const leavesFromTree = await merkleTree.getLeaves();
        const merkleRoot = await calculateMerkleRoot(leavesFromTree);

        // Create an invalid proof (wrong length)
        const invalidProof = [ethers.ZeroHash, ethers.ZeroHash];
        
        
        const isValid = await merkleTree.validateProof(0, invalidProof, merkleRoot);
        expect(isValid).to.equal(false);
    });

    it("should fail to validate a proof with an invalid merkle root", async function () {
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

        const leavesFromTree = await merkleTree.getLeaves();
        const merkleRoot = await hashValue("invalid");

        try {
            await merkleTree.validateProof(0, invalidProof, merkleRoot);
            expect.fail("Should have reverted");
        } catch (error: any) {
            expect(error.message).to.include("RootDoesNotExist");
        }
    });
    
})