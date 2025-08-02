pragma solidity ^0.8.0;


/* TO DO:
Because this is all calculated on-chain there is a risk of race conditions when trying to validate merkle trees 
To mitigate this issue we will need store a history of merkle roots and leaves. This would need to be a mapping to a struct of root and leaves.


*/

/*
Must rewrite contract to store the entire tree on-chain not just the leaves

*/


contract MerkleTree {
    
    bytes32 merkleRoot;
    bytes32[] public leaves;
    mapping(bytes32 leaf => bool) leafLookup;
    uint256 public leafCount;

    error LeafExists();

    constructor() {
        merkleRoot = bytes32(0);
        //tree = new bytes32[](0);
    }

    function addLeaf(bytes32 leaf) public {
        if (leafLookup[leaf]) {
            revert LeafExists();
        }

        leaves.push(leaf);

        leafLookup[leaf] = true;
        leafCount++;

        _calculateNewMerkleRoot();
    }

    
    function _calculateNewMerkleRoot() internal {
        /*
            if there are no leaves then merkleRoot is 0

            if there is one leaf than merkleRoot is the leaf

            from here we need to calculate the merkle root by determining the number of leaves
            The number if the number of leaves is even then we need to hash the leaves in pairs and then add the result to new array
            If the number of leaves is odd, when you get to the last leaf, you hash it with itself and then add the result to the array.
            
            This process will continue until there is only one hash left in the array.

            Then the final hash is set as the merkle root.
        */
        if (leafCount == 0) {
            merkleRoot = bytes32(0);
            return;
        } 

        if (leafCount == 1) {
            merkleRoot = leaves[0];
            return;
        }

        bytes32[] memory newLeaves = leaves; // 3

        while (newLeaves.length > 1) {
            bytes32[] memory level = new bytes32[]((newLeaves.length + 1) / 2); // add the 1 to ensure that this is sized correctly. 2

            for (uint256 i = 0; i < newLeaves.length; i+=2) {
                if (i + 1 < newLeaves.length) {
                    level[i/2] = keccak256(abi.encodePacked(newLeaves[i], newLeaves[i+1]));
                } else {
                    level[i/2] = keccak256(abi.encodePacked(newLeaves[i], newLeaves[i])); // hash the odd value with itself
                }
                
            } 

            newLeaves = level;
        }

        merkleRoot = newLeaves[0];

    }

    function generateMerkleProof(uint256 leafPosition) public view returns (bytes32[] memory) {
        require(leafPosition < leaves.length, "Leaf position out of bounds");
        require(leafLookup[leaves[leafPosition]], "Leaf does not exist");  
        
        uint256 proofHeight = _getProofHeight();

        bytes32[] memory proof = new bytes32[](proofHeight);

        bytes32[] memory newLeaves = leaves;
        uint256 currentIndex = leafPosition;
        uint256 proofIndex = 0;

        while (newLeaves.length > 1) {
            // get the sibling position by determining if the value is even or odd
            // if the check results in 0 then current index is even else odd
            uint256 siblingIndex = (currentIndex & 1) == 0 ? currentIndex + 1: currentIndex - 1;

            // get the sibling hash and add to proof
            if (siblingIndex >= newLeaves.length) {
               // If sibling index is out of bounds, use the last element
               bytes32 siblingValue = newLeaves[newLeaves.length - 1];
               proof[proofIndex] = siblingValue;
            } else {
                // get the sibling's hash
                proof[proofIndex] = newLeaves[siblingIndex];
            }

            proofIndex++;

            // caluculate the index position for the sibling on the next level
            currentIndex >>= 1;

            // create the new level
            bytes32[] memory level = new bytes32[]((newLeaves.length + 1) >> 1);

            for (uint256 i = 0; i < newLeaves.length; i+=2) {
                if (i + 1 < newLeaves.length) {
                    level[i/2] = keccak256(abi.encodePacked(newLeaves[i], newLeaves[i+1]));
                } else {
                    level[i/2] = keccak256(abi.encodePacked(newLeaves[i], newLeaves[i]));
                }
            }

           newLeaves = level;
        }

        return proof;
    }

    function validateProof(uint256 leafPosition, bytes32[] calldata merkleproof) public view returns (bool) {
        require(leafPosition < leaves.length, "Leaf position out of bounds");
        uint256 proofHeight = _getProofHeight();
        bytes32 leaf = leaves[leafPosition];
        // if the proof length is not the same as the proof height then the proof is invalid and should throw an error
        require(merkleproof.length == proofHeight, "Invalid proof length");
        // if the leaf doesn't exist it means that we cannot validate the proof and should throw an error
        require(leafLookup[leaf], "Leaf does not exist");

        bytes32 hashValueToCombine = leaf;
        uint256 currentIndex = leafPosition;
        
        for (uint256 i = 0; i < merkleproof.length; i++) {
            bytes32 proofElement = merkleproof[i];
            
            // if true then the value is even, else odd. 
            // this changes the order of the hash 
            if (currentIndex & 1 == 0) {
                hashValueToCombine = keccak256(abi.encodePacked(hashValueToCombine, proofElement));
            } else {
                hashValueToCombine = keccak256(abi.encodePacked(proofElement, hashValueToCombine));
            }

            // move the next level up to the sibling index.abi
            // >>= 1 performs integer division by two more efficiently
            currentIndex >>= 1;
        }
        

        return hashValueToCombine == merkleRoot;
            
    }
    
    
    function getMerkleRoot() public view returns (bytes32) {
        return merkleRoot;
    }

    function getLeafCount() public view returns (uint256) {
        return leafCount;
    }

    function _getProofHeight() internal view returns (uint256) {
        if (leafCount == 0) return 0;
        if (leafCount == 1) return 0;
        
        uint256 height = 0;
        uint256 currentCount = leafCount;

        while (currentCount > 1) {
            currentCount = (currentCount + 1) >> 1; // Ceiling division
            height++;
        }

        return height;
    }

    
    
}