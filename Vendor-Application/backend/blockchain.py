import hashlib
import json
from datetime import datetime
from typing import List, Dict, Any

class Block:
    """Represents a single block in the blockchain"""
    
    def __init__(self, index: int, timestamp: str, transactions: List[Dict], previous_hash: str):
        self.index = index
        self.timestamp = timestamp
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.merkle_root = self.calculate_merkle_root()
        self.hash = self.calculate_hash()
    
    def calculate_hash(self) -> str:
        """Calculate SHA-256 hash of the block"""
        block_string = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "transactions": self.transactions,
            "previous_hash": self.previous_hash,
            "merkle_root": self.merkle_root
        }, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()
    
    def calculate_merkle_root(self) -> str:
        """Calculate Merkle root of transactions for integrity"""
        if not self.transactions:
            return hashlib.sha256(b"").hexdigest()
        
        tx_hashes = []
        for tx in self.transactions:
            tx_string = json.dumps(tx, sort_keys=True)
            tx_hash = hashlib.sha256(tx_string.encode()).hexdigest()
            tx_hashes.append(tx_hash)
        
        while len(tx_hashes) > 1:
            if len(tx_hashes) % 2 != 0:
                tx_hashes.append(tx_hashes[-1])
            
            new_hashes = []
            for i in range(0, len(tx_hashes), 2):
                combined = tx_hashes[i] + tx_hashes[i + 1]
                new_hash = hashlib.sha256(combined.encode()).hexdigest()
                new_hashes.append(new_hash)
            
            tx_hashes = new_hashes
        
        return tx_hashes[0]
    
    def to_dict(self) -> Dict:
        """Convert block to dictionary"""
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "transactions": self.transactions,
            "previous_hash": self.previous_hash,
            "merkle_root": self.merkle_root,
            "hash": self.hash
        }

class Blockchain:
    """Manages the blockchain ledger"""
    
    def __init__(self, supabase_client, table_prefix="vendor_"):
        self.supabase = supabase_client
        self.blocks_table = f"{table_prefix}blocks"
        self.block_tx_table = f"{table_prefix}block_transactions"
    
    def create_genesis_block(self) -> Block:
        """Create the first block in the chain"""
        genesis_block = Block(
            index=0,
            timestamp=datetime.utcnow().isoformat(),
            transactions=[],
            previous_hash="0" * 64
        )
        return genesis_block
    
    def get_latest_block(self) -> Dict:
        """Get the latest block from database"""
        try:
            result = self.supabase.table(self.blocks_table).select("*").order("index", desc=True).limit(1).execute()
            if result.data:
                return result.data[0]
            return None
        except Exception as e:
            print(f"Error getting latest block: {e}")
            return None
    
    def create_block(self, transactions: List[Dict]) -> Block:
        """Create a new block with given transactions"""
        latest_block = self.get_latest_block()
        
        if latest_block is None:
            new_index = 0
            previous_hash = "0" * 64
        else:
            new_index = latest_block["index"] + 1
            previous_hash = latest_block["hash"]
        
        new_block = Block(
            index=new_index,
            timestamp=datetime.utcnow().isoformat(),
            transactions=transactions,
            previous_hash=previous_hash
        )
        
        return new_block
    
    def save_block(self, block: Block) -> bool:
        """Save block to database"""
        try:
            block_data = block.to_dict()
            result = self.supabase.table(self.blocks_table).insert(block_data).execute()
            
            if result.data:
                return True
            return False
        except Exception as e:
            print(f"Error saving block: {e}")
            return False
    
    def validate_chain(self) -> Dict:
        """Validate entire blockchain for tampering"""
        try:
            result = self.supabase.table(self.blocks_table).select("*").order("index").execute()
            blocks = result.data
            
            if not blocks:
                return {"valid": True, "message": "No blocks to validate"}
            
            validation_results = []
            
            for i, block_data in enumerate(blocks):
                block_string = json.dumps({
                    "index": block_data["index"],
                    "timestamp": block_data["timestamp"],
                    "transactions": block_data["transactions"],
                    "previous_hash": block_data["previous_hash"],
                    "merkle_root": block_data["merkle_root"]
                }, sort_keys=True)
                calculated_hash = hashlib.sha256(block_string.encode()).hexdigest()
                
                hash_valid = calculated_hash == block_data["hash"]
                
                link_valid = True
                if i > 0:
                    link_valid = block_data["previous_hash"] == blocks[i-1]["hash"]
                
                block_obj = Block(
                    index=block_data["index"],
                    timestamp=block_data["timestamp"],
                    transactions=block_data["transactions"],
                    previous_hash=block_data["previous_hash"]
                )
                merkle_valid = block_obj.merkle_root == block_data["merkle_root"]
                
                is_valid = hash_valid and link_valid and merkle_valid
                
                validation_results.append({
                    "index": block_data["index"],
                    "hash_valid": hash_valid,
                    "link_valid": link_valid,
                    "merkle_valid": merkle_valid,
                    "valid": is_valid,
                    "stored_hash": block_data["hash"],
                    "calculated_hash": calculated_hash
                })
            
            all_valid = all(result["valid"] for result in validation_results)
            
            return {
                "valid": all_valid,
                "blocks_checked": len(blocks),
                "results": validation_results,
                "message": "Blockchain is valid" if all_valid else "Blockchain tampering detected!"
            }
        except Exception as e:
            return {"valid": False, "error": str(e)}