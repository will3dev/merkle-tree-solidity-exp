import { ethers } from "ethers";

// this is used when calculating the hash of two leaves that are extracted from the tree
export const hashLeaves = async (
    leafOne: string, 
    leafTwo: string
): Promise<string> => {

    return ethers.keccak256(ethers.concat([leafOne, leafTwo]));
}

// This is to be used to calculate a hash of a value that will be inserted as a leaf
export const hashValue = async (
    value: string
): Promise<string> => {
    return ethers.keccak256(ethers.toUtf8Bytes(value));
}

// This is used when calculating the hash of two values NOT from the tree
export const hashValues = async (
    valueOne: string, 
    valueTwo: string,
): Promise<string> => {

    const valOneHash = ethers.keccak256(ethers.toUtf8Bytes(valueOne));
    const valTwoHash = ethers.keccak256(ethers.toUtf8Bytes(valueTwo));

    return ethers.keccak256(ethers.concat([valOneHash, valTwoHash]));
}

/**
 *  This is used to calculate the expected height of the merkle tree
 * @param leaves - the leaves to calculate the merkle root of
 * @returns the merkle root
*/
export const calculateMerkleTreeHeight = async (
    leafCount: number
): Promise<number> => {
    if (leafCount === 0) {
        return 0;
    }

    let height = 0;
    let currentCount = leafCount;

    while (currentCount > 1) {
        currentCount = (currentCount + 1) >> 1;
        height++;
    }
    return height;
}

/**
 *  This is used to calculate the merkle root of a set of leaves
 *  It will traverse the leaf set calculating the parents at each level
 *  The final value should be the merkle root
 * @param leaves - the leaves to calculate the merkle root of
 * @returns the merkle root
*/
export const calculateMerkleRoot = async (
    leaves: string[]
): Promise<string> => {
    if (leaves.length === 0) {
        return ethers.ZeroHash;
    }

    // if there is one leaf, then the merkle root is the leaf
    if (leaves.length === 1) {
        return leaves[0];
    }

    let newLeaves = leaves;

    while (newLeaves.length > 1) {
        const level = [];
        
        for (let i = 0; i < newLeaves.length; i += 2) {
            if (i + 1 < newLeaves.length) {
                level.push(await hashLeaves(newLeaves[i], newLeaves[i + 1]));
            } else {
                level.push(await hashLeaves(newLeaves[i], newLeaves[i]));
            }
        }
        
        newLeaves = level;
    }

    return newLeaves[0];
}


/**
 *  This is used to generate a merkle proof for a given leaf position
 * @param leafPosition - the position of the leaf to generate a proof for
 * @param leaves - the leaves to generate a proof for
 * @returns the merkle proof
 */
export const generateMerkleProof = async (
    leafPosition: number, 
    leaves: string[]
): Promise<string[]> => {
    // this checks to see that the leaf position is within bounds of the leaf array
    if (leafPosition >= leaves.length) {
        throw new Error("Leaf position out of bounds");
    }

    // this calculates the height of the merkle tree
    const height = await calculateMerkleTreeHeight(leaves.length);

    // this initializes the proof array
    const proof = [];
    let newLeaves = leaves;
    let currentIndex = leafPosition;
    let proofIndex = 0;

    for (let i = 0; i < height; i++) {
        // determine the position of the sibling index that will need to be extracted for the proof
        const siblingIndex = currentIndex ^ 1;

        if (siblingIndex >= newLeaves.length) {
            // if the sibling index is out of bounds, then copy the last position value
            proof.push(newLeaves[newLeaves.length - 1]);
        } else {
            // if the sibling index is within bounds, then get the value
            proof.push(newLeaves[siblingIndex]);
        }

        // this shifts the current index to the right by 1 bit
        // practically this determines the expected index position 
        // on the next level of the tree where we will need to determine 
        // the sibling
        currentIndex >>= 1;

        // this creates the next level of the tree
        const level = [];

        for (let i = 0; i < newLeaves.length; i += 2) {
            if (i + 1 < newLeaves.length) {
                level.push(await hashLeaves(newLeaves[i], newLeaves[i + 1]));
            } else {
                level.push(await hashLeaves(newLeaves[i], newLeaves[i]));
            }
        }

        newLeaves = level;
    }

    // check that the proof length is the expected length
    if (proof.length !== height) {
        throw new Error("Invalid proof length");
    }

    // then the proof is valid
    return proof;
} 