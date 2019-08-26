pragma solidity ^0.5.0;

contract GuaCoin {
    struct Registration {
        uint256 id;
        address owner;
        uint repoIndex;
        address delegator;
    }

    mapping(address => Registration[]) public repositories;
    mapping(uint256 => Registration) public registrations;

    uint256 public totalCount;
    uint256 public usedCount;
    address public president;

    event Transfer(address indexed _from, address indexed _to, uint256 _tokenId);
    event Approval(address indexed _owner, address indexed _approved, uint256 _tokenId);
    event Registered(address indexed _owner, uint256 _tokenId);

    // Constructor
    constructor() public {
        totalCount = 10;
        usedCount = 0;
        president = msg.sender;
    }

    function name() public pure returns (string memory) {
        return "GuaCoin";
    }

    function symbol() public pure returns (string memory) {
        return "GC";
    }

    function totalSupply() public view returns (uint256) {
        return totalCount;
    }

    function balanceOf(address _owner) public view returns (uint256) {
        return repositories[_owner].length;
    }

    function ownerOf(uint256 _tokenId) public view returns (address) {
        return registrations[_tokenId].owner;
    }

    function approve(address _to, uint256 _tokenId) public payable {
        require(ownerOf(_tokenId) == msg.sender, "you can't approve an registration that you don't own");
        require(_to != msg.sender, "you can't approve an registration to youself");

        registrations[_tokenId].delegator = _to;
        emit Approval(msg.sender, _to, _tokenId);
    }

    function checkRegistrationExists(uint256 _tokenId) internal view returns (bool) {
        require(_tokenId > 0, "id must be greater than 0");
        require(_tokenId <= totalCount, "exceed max number of registrations");

        return true;
    }

    function transferRegistration(address _owner, address _to, uint256 _tokenId) internal {
        Registration storage registration = registrations[_tokenId];

        registration.delegator = address(0);
        if (repositories[registration.owner].length > 1) {
            repositories[registration.owner][registration.repoIndex] = repositories[registration.owner][repositories[registration.owner].length-1];
            repositories[registration.owner][registration.repoIndex].repoIndex = registration.repoIndex;
        }
        repositories[registration.owner].length--;
        registration.owner = _to;
        registration.repoIndex = repositories[_to].length;
        repositories[_to].push(registration);

        emit Transfer(_owner, _to, _tokenId);
    }

    function takeOwnership(uint256 _tokenId) public {
        checkRegistrationExists(_tokenId);

        Registration storage reg = registrations[_tokenId];
        require(reg.delegator == msg.sender, "you can't take ownership of an registration without owner's approval");

        transferRegistration(reg.owner, reg.delegator, _tokenId);
    }

    function transfer(address _to, uint256 _tokenId) public {
        checkRegistrationExists(_tokenId);

        transferRegistration(msg.sender, _to, _tokenId);
    }

    function tokenOfOwnerByIndex(address _owner, uint256 _index) public view returns (uint256) {
        return repositories[_owner][_index].id;
    }

    function restock(uint num) public {
        require(msg.sender == president, "only the president has permission to increase total count");
        totalCount += num;
    }

    function register(uint256 _tokenId) public payable {
        checkRegistrationExists(_tokenId);
        require(registrations[_tokenId].owner == address(0), "cannot register an registration that has been registered");

        usedCount++;
        registrations[_tokenId] = Registration(_tokenId, msg.sender, repositories[msg.sender].length, address(0));
        repositories[msg.sender].push(registrations[_tokenId]);

        emit Registered(msg.sender, _tokenId);

        assert(registrations[_tokenId].id == _tokenId);
    }

    function getPaginatedRegistrationIDs(
        address owner,
        uint page,
        uint perPage
    ) public view returns (uint256[] memory) {
        require(perPage <= 100, "max number of perPage is limited to 100");

        uint startIndex = (page - 1) * perPage;
        uint256[] memory regs;

        if (
            repositories[owner].length == 0 ||
            startIndex > repositories[owner].length - 1
        ) {
            regs = new uint256[](0);
            return regs;
        }

        uint maxIndex = startIndex;
        if (repositories[owner].length > startIndex+perPage) {
            maxIndex += perPage;
        } else {
            maxIndex += repositories[owner].length - startIndex;
        }
        regs = new uint[](maxIndex - startIndex);
        for (uint i = 0; startIndex + i < maxIndex; i++) {
            regs[i] = repositories[owner][startIndex + i].id;
        }

        return regs;
    }

    function getRepositoryLength(address owner) public view returns (uint) {
        return repositories[owner].length;
    }

    function getRepoRegistration(address owner, uint index) public view returns (uint, address, uint) {
        return (repositories[owner][index].id, repositories[owner][index].owner, repositories[owner][index].repoIndex);
    }
}
