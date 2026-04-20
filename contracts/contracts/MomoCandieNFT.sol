// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title  MomoCandieNFT
 * @notice 5,250-supply ERC-721 collection with phased minting, merkle-tree
 *         presale allowlist, gemstone-tier traits, and DAO ownership handoff.
 *
 * Lifecycle:
 *   PAUSED  →  PRESALE  →  PUBLIC  →  CLOSED
 *
 * After CLOSED the owner calls reveal() to set the base URI, then
 * daoHandoff() to transfer ownership to the Gnosis Safe multisig.
 */
contract MomoCandieNFT is ERC721, ERC721Enumerable, Ownable, ReentrancyGuard {

    // ── Constants ──────────────────────────────────────────────────
    uint256 public constant MAX_SUPPLY    = 5_250;
    uint256 public constant RESERVE_LIMIT = 250;   // team / DAO reserve cap
    uint256 public constant MAX_PER_WALLET_PRESALE = 2;
    uint256 public constant MAX_PER_WALLET_PUBLIC  = 5;
    uint256 public constant MAX_PER_TX             = 5;

    // ── Pricing ────────────────────────────────────────────────────
    uint256 public presalePrice = 0.055 ether;
    uint256 public publicPrice  = 0.075 ether;

    // ── Phase ──────────────────────────────────────────────────────
    enum Phase { PAUSED, PRESALE, PUBLIC, CLOSED }
    Phase public currentPhase = Phase.PAUSED;

    // ── Metadata ───────────────────────────────────────────────────
    string private _baseTokenURI;
    bool   public  revealed = false;
    string public  unrevealedURI;

    // ── Merkle tree (presale allowlist) ───────────────────────────
    bytes32 public merkleRoot;

    // ── Tracking ───────────────────────────────────────────────────
    uint256 private _nextTokenId = 1;
    uint256 public  reserveMinted = 0;
    mapping(address => uint256) public presaleMinted;
    mapping(address => uint256) public publicMinted;

    // ── Events ─────────────────────────────────────────────────────
    event PhaseChanged(Phase indexed previous, Phase indexed next);
    event Revealed(string baseURI);
    event DaoHandoff(address indexed previousOwner, address indexed dao);
    event MerkleRootUpdated(bytes32 root);
    event Withdrawn(address indexed to, uint256 amount);

    // ── Constructor ────────────────────────────────────────────────
    constructor(
        string memory _unrevealedURI,
        address       initialOwner
    )
        ERC721("Momo Candie", "MOMO")
        Ownable(initialOwner)
    {
        unrevealedURI = _unrevealedURI;
    }

    // ═══════════════════════════════════════════════════════════════
    // PHASE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    function setPhase(Phase _phase) external onlyOwner {
        require(uint8(_phase) == uint8(currentPhase) + 1, "Must advance phase in order");
        emit PhaseChanged(currentPhase, _phase);
        currentPhase = _phase;
    }

    function setMerkleRoot(bytes32 _root) external onlyOwner {
        merkleRoot = _root;
        emit MerkleRootUpdated(_root);
    }

    function setPrices(uint256 _presale, uint256 _public) external onlyOwner {
        presalePrice = _presale;
        publicPrice  = _public;
    }

    // ═══════════════════════════════════════════════════════════════
    // MINTING
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Presale mint — requires a valid Merkle proof for msg.sender.
     */
    function mintPresale(
        uint256          quantity,
        bytes32[] calldata proof
    )
        external
        payable
        nonReentrant
    {
        require(currentPhase == Phase.PRESALE,           "Presale not active");
        require(quantity > 0 && quantity <= MAX_PER_TX,  "Invalid quantity");
        require(msg.value >= presalePrice * quantity,    "Insufficient payment");
        require(
            presaleMinted[msg.sender] + quantity <= MAX_PER_WALLET_PRESALE,
            "Presale wallet limit exceeded"
        );
        require(_nextTokenId + quantity - 1 <= MAX_SUPPLY - RESERVE_LIMIT, "Exceeds presale supply");

        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender))));
        require(MerkleProof.verify(proof, merkleRoot, leaf), "Invalid merkle proof");

        presaleMinted[msg.sender] += quantity;
        _mintBatch(msg.sender, quantity);
    }

    /**
     * @notice Public mint — open to anyone once PUBLIC phase is active.
     */
    function mint(uint256 quantity) external payable nonReentrant {
        require(currentPhase == Phase.PUBLIC,            "Public mint not active");
        require(quantity > 0 && quantity <= MAX_PER_TX,  "Invalid quantity");
        require(msg.value >= publicPrice * quantity,     "Insufficient payment");
        require(
            publicMinted[msg.sender] + quantity <= MAX_PER_WALLET_PUBLIC,
            "Public wallet limit exceeded"
        );
        require(_nextTokenId + quantity - 1 <= MAX_SUPPLY - RESERVE_LIMIT, "Exceeds public supply");

        publicMinted[msg.sender] += quantity;
        _mintBatch(msg.sender, quantity);
    }

    /**
     * @notice Reserve mint — owner only, up to RESERVE_LIMIT tokens.
     *         Callable in any phase so the team can reserve before/after sale.
     */
    function reserveMint(address to, uint256 quantity) external onlyOwner nonReentrant {
        require(reserveMinted + quantity <= RESERVE_LIMIT, "Reserve limit exceeded");
        require(_nextTokenId + quantity - 1 <= MAX_SUPPLY, "Exceeds max supply");

        reserveMinted += quantity;
        _mintBatch(to, quantity);
    }

    function _mintBatch(address to, uint256 quantity) internal {
        for (uint256 i = 0; i < quantity; i++) {
            _safeMint(to, _nextTokenId++);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // REVEAL
    // ═══════════════════════════════════════════════════════════════

    function reveal(string calldata baseURI) external onlyOwner {
        require(!revealed, "Already revealed");
        require(currentPhase == Phase.CLOSED, "Must be CLOSED phase");
        _baseTokenURI = baseURI;
        revealed = true;
        emit Revealed(baseURI);
    }

    // ═══════════════════════════════════════════════════════════════
    // DAO HANDOFF
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Transfer ownership to the Gnosis Safe / DAO multisig.
     *         Can only be called after reveal.
     */
    function daoHandoff(address dao) external onlyOwner {
        require(revealed, "Must reveal before handoff");
        require(dao != address(0), "Invalid DAO address");
        emit DaoHandoff(owner(), dao);
        transferOwnership(dao);
    }

    // ═══════════════════════════════════════════════════════════════
    // FINANCIALS
    // ═══════════════════════════════════════════════════════════════

    function withdraw(address payable to) external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "Nothing to withdraw");
        (bool ok,) = to.call{value: balance}("");
        require(ok, "Transfer failed");
        emit Withdrawn(to, balance);
    }

    // ═══════════════════════════════════════════════════════════════
    // VIEWS
    // ═══════════════════════════════════════════════════════════════

    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - (_nextTokenId - 1);
    }

    // ═══════════════════════════════════════════════════════════════
    // METADATA
    // ═══════════════════════════════════════════════════════════════

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        if (!revealed) return unrevealedURI;
        return string(abi.encodePacked(_baseTokenURI, _toString(tokenId), ".json"));
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    // ── Required overrides (ERC721 + ERC721Enumerable) ─────────────
    function _update(address to, uint256 tokenId, address auth)
        internal override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
