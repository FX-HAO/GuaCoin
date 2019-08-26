var GuaCoin = artifacts.require("./GuaCoin.sol");

contract("GuaCoin", function(accounts) {
  var instance;

  it("register", async function() {
    instance = await GuaCoin.deployed();
    await instance.register(1);
    let usedCount = await instance.usedCount();
    assert.equal(usedCount, 1);
    let repositoryLength = await instance.getRepositoryLength(accounts[0]);
    assert.equal(repositoryLength, 1);
    let tokenOfOwnerByIndex = await instance.tokenOfOwnerByIndex(accounts[0], 0);
    assert.equal(tokenOfOwnerByIndex, 1);
    let ids = await instance.getPaginatedRegistrationIDs(accounts[0], 1, 100);
    assert.equal(ids.length, 1);
    assert.equal(ids[0], 1);
    let owner = await instance.ownerOf(1);
    assert.equal(owner, accounts[0]);
  });

  it("transfer", async function() {
    await instance.register(2);
    repositoryLength = await instance.getRepositoryLength(accounts[0]);
    assert.equal(repositoryLength, 2);
    await instance.transfer(accounts[1], 1);
    repositoryLength = await instance.getRepositoryLength(accounts[0]);
    assert.equal(repositoryLength, 1);
    let {0: id, 1: owner, 2: repoIndex} = await instance.getRepoRegistration(accounts[0], 0);
    assert.equal(id, 2);
    assert.equal(owner, accounts[0]);
    assert.equal(repoIndex, 0);
    let {0: id2, 1: owner2, 2: repoIndex2} = await instance.getRepoRegistration(accounts[1], 0);
    assert.equal(id2, 1);
    assert.equal(owner2, accounts[1]);
    assert.equal(repoIndex2, 0);
    let ids = await instance.getPaginatedRegistrationIDs(accounts[0], 1, 100);
    assert.equal(ids.length, 1);
    assert.equal(ids[0], 2);
    await instance.transfer(accounts[1], 2);
    repositoryLength = await instance.getRepositoryLength(accounts[0]);
    assert.equal(repositoryLength, 0);
    ids = await instance.getPaginatedRegistrationIDs(accounts[0], 1, 100);
    assert.equal(ids.length, 0);
    repositoryLength = await instance.getRepositoryLength(accounts[1]);
    assert.equal(repositoryLength, 2);
    ids = await instance.getPaginatedRegistrationIDs(accounts[1], 1, 100);
    assert.equal(ids.length, 2);
    assert.equal(ids[0], 1);
    assert.equal(ids[1], 2);
  });
});