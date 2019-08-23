pragma solidity ^0.5.0;

contract GuaCoin {
    struct Registration {
        uint id;
        address owner;
    }

    mapping(address => mapping(uint => Registration)) public registrations;
    mapping(uint => Registration) public registrationMappings;
    uint public totalCount;
    uint public usedCount;
    address public president;

    // Constructor
    constructor() public {
        totalCount = 10;
        usedCount = 0;
        president = msg.sender;
    }

    function add(uint num) public {
        require(msg.sender == president, "only the president has permission to increase total count");
        totalCount += num;
    }

    function transfer (uint numOfRegistration, address to) public {
        require(own(numOfRegistration), "You cann't operate an registeration that you don't own");

        Registration storage registration = registrations[msg.sender][numOfRegistration];
        registration.owner = to;
        registrations[to][numOfRegistration] = registration;
        delete registrations[msg.sender][numOfRegistration];
    }

    function register (uint numOfRegistration) public payable {
        require(numOfRegistration <= totalCount, "exceed max number of registrations");
        require(registrationMappings[numOfRegistration].owner == address(0), "cannot register an registration that has been registered");

        usedCount++;
        registrationMappings[numOfRegistration] = Registration(numOfRegistration, msg.sender);
        registrations[msg.sender][] = registrationMappings[numOfRegistration];
    }

    function own(uint numOfRegistration) public view returns (bool) {
        for (uint i = 0; i<registrations[msg.sender].length; i++) {
            if (registrations[msg.sender][i].id == numOfRegistration) {
                return true;
            }
        }
        return false;
    }

    function inspectOwner(uint numOfRegistration) public view returns (address) {
        return registrationMappings[numOfRegistration].owner;
    }

}
