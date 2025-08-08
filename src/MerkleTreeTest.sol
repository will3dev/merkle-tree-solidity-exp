// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MerkleTree.sol";

/**
 * @title MerkleTreeTest
 * @dev Concrete implementation of MerkleTree for testing purposes
 */
contract MerkleTreeTest is AppendMerkleTree {
    
    /**
     * @dev Public function to add a leaf for testing
     */
    function addLeaf(bytes32 leaf) public {
        _addLeaf(leaf);
    }
    
    /**
     * @dev Public function to generate a merkle proof for testing
     */
    function generateMerkleProof(uint256 leafPosition) public view returns (bytes32[] memory) {
        return _generateMerkleProof(leafPosition);
    }
    
    /**
     * @dev Public function to validate a proof for testing
     */
    function validateProof(uint256 leafPosition, bytes32[] calldata merkleproof, bytes32 providedMerkleRoot) public view returns (bool) {
        return _validateProof(leafPosition, merkleproof, providedMerkleRoot);
    }
}
