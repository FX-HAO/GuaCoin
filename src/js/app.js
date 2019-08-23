App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: async function() {
    return App.initWeb3();
  },

  initWeb3: async function() {
    if (ethereum) {
      web3 = new Web3(ethereum);
      App.web3Provider = ethereum;
      await ethereum.enable();
    } 
    else if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: async function() {
    $.getJSON("GuaCoin.json", function(election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      // App.listenForEvents();

      return App.render();
    });
  },

  render: async function() {
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.hide();
    content.show();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html(account);
      } else {
        console.err(`err: ${err}`);
      }
    });

    // Load contract data
    App.contracts.Election.deployed().then(async function(instance) {
      electionInstance = instance;
      
      let usedCount = await electionInstance.usedCount();
      let totalCount = await electionInstance.totalCount();
      let remains = totalCount.toNumber() - usedCount.toNumber();
      $('#remains').html(remains);
      
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();

      var candidatesSelect = $('#candidatesSelect');
      candidatesSelect.empty();

      var owns = [];

      for (var i = 1; i <= totalCount; i++) {
        var id = i;
        var name = `号码${i}`;

        // Render candidate Result
        var candidateTemplate;
        if (i > usedCount) {
          candidateTemplate = "<tr><th>" + id + "</th><td>" + name + `</td><td><button class="btn btn-primary" type="button" onClick="App.register(${i})">抢号</button></td></tr>`
        } else {
          let owner = await electionInstance.inspectOwner(i);
          if (owner == App.account) {
            owns.push(`挂号${i}`);
          }
          candidateTemplate = "<tr><th>" + id + "</th><td>" + name + `</td><td>拥有者: ${owner}</td></tr>`
        }
        candidatesResults.append(candidateTemplate);

        // Render candidate ballot option
        // var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
        // candidatesSelect.append(candidateOption);
      }

      var repository = $("#repository");

      repository.html(owns.join(", "))
      // let registrations = await electionInstance.registrations();
      // console.log(registrations);

      // var loader = $("#loader");
      // var content = $("#content");

      // loader.show();
      // content.hide();
    })
  },

  castVote: function() {
    // var candidateId = $('#candidatesSelect').val();
    // App.contracts.Election.deployed().then(function(instance) {
    //   return instance.vote(candidateId, { from: App.account });
    // }).then(function(result) {
    //   // Wait for votes to update
    //   $("#content").hide();
    //   $("#loader").show();
    // }).catch(function(err) {
    //   console.error(err);
    // });
  },

  listenForEvents: function() {
    App.contracts.Election.deployed().then(function(instance) {
      instance.votedEvent({}, {
        // fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });

      instance.bankEvent({}, {
        // fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event);
        App.render();
      })
    });
  },

  deposit: function() {
    let amount = +$("#amount").val();
    App.contracts.Election.deployed().then(function(instance) {
      return instance.deposit(amount, {from: App.account, value: amount});
    });
  },

  withdraw: function() {
    let amount = +$("#amount").val();
    App.contracts.Election.deployed().then(function(instance) {
      instance.withdraw(amount, {from: App.account});
    });
  },

  register: function(i) {
    App.contracts.Election.deployed().then(function(instance) {
      instance.register(i);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});