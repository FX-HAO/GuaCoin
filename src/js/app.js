App = new Vue({
  el: '#app',
  data: {
    web3Provider: null,
    contracts: {},
    account: '0x0',
    remains: '?',
    balance: '?',
    loaded: false,
    registrations: [],
    repository: [],
    transferTo: '',
    transferredRegistrationId: 0,
  },

  created: function() {
    this.init();
  },

  methods: {
    init: async function() {
      return this.initWeb3();
    },

    initWeb3: async function() {
      if (ethereum) {
        web3 = new Web3(ethereum);
        this.web3Provider = ethereum;
        await ethereum.enable();
      } 
      else if (typeof web3 !== 'undefined') {
        // If a web3 instance is already provided by Meta Mask.
        this.web3Provider = web3.currentProvider;
        web3 = new Web3(web3.currentProvider);
      } else {
        // Specify default instance if no web3 instance provided
        this.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        web3 = new Web3(this.web3Provider);
      }
      return this.initContract();
    },

    initContract: async function() {
      $.getJSON("GuaCoin.json", function(guaCoin) {
        // Instantiate a new truffle contract from the artifact
        App.contracts.GuaCoin = TruffleContract(guaCoin);
        // Connect provider to interact with contract
        App.contracts.GuaCoin.setProvider(App.web3Provider);

        App.listenForEvents();

        return App.render();
      });
    },

    render: async function() {
      App.registrations = [];
      App.repository = [];

      // Load account data
      web3.eth.getCoinbase(function(err, account) {
        if (err === null) {
          App.account = account;
          $("#accountAddress").html(account);

          web3.eth.getBalance(account, (err, balance) => App.balance = web3.fromWei(balance, "ether") + " ETH");
        } else {
          console.err(`err: ${err}`);
        }
      });


      // Load contract data
      this.contracts.GuaCoin.deployed().then(async function(instance) {
        let usedCount = await instance.usedCount();
        let totalCount = await instance.totalCount();
        let remains = totalCount.toNumber() - usedCount.toNumber();
        App.remains = remains;

        for (var i = 1; i <= totalCount; i++) {
          var id = i;
          var name = `号码${i}`;

          // Render candidate Result
          var candidateTemplate;
          let owner = await instance.ownerOf(i);
          if (/^0x0+$/.test(owner)) {
            candidateTemplate = "<th>" + id + "</th><td>" + name + `</td><td><button class="btn btn-primary" type="button" onClick="App.register(${i})">抢号</button></td>`;
          } else {
            candidateTemplate = "<th>" + id + "</th><td>" + name + `</td><td>拥有者: ${owner}</td>`
          }
          App.registrations.push(candidateTemplate);
        }

        let ids = await instance.getPaginatedRegistrationIDs(App.account, 1, 100);
        for (id of ids) {
          App.repository.push(`挂号${id}`);
        }

        App.loaded = true;
      })
    },

    register: function(i) {
      this.contracts.GuaCoin.deployed().then(function(instance) {
        instance.register(i);
      });
    },
    
    doTransfer: function() {
      this.contracts.GuaCoin.deployed().then(function(instance) {
        instance.transfer(App.transferTo, App.transferredRegistrationId);
      });
    },

    listenForEvents: async function() {
      var eventBlocks = new Set();

      web3.eth.getBlockNumber((err, currentBlock) => {
        console.log(currentBlock);
        App.contracts.GuaCoin.deployed().then(function(instance) {
          instance.Registered({}, {
            fromBlock: currentBlock,
            toBlock: 'latest'
          }).watch(function(error, event) {
            // possibly duplicate events here
            let blockNumber = event.blockNumber;
            if (blockNumber <= currentBlock || eventBlocks.has(blockNumber)) return;
            eventBlocks.add(blockNumber);
            console.log("event triggered", event);
            App.render();
          });
    
          instance.Transfer({}, {
            // fromBlock: 0,
            fromBlock: currentBlock,
            toBlock: 'latest'
          }).watch(function(error, event) {
            // possibly duplicate events here
            let blockNumber = event.blockNumber;
            if (blockNumber <= currentBlock || eventBlocks.has(blockNumber)) return;
            eventBlocks.add(blockNumber);
            console.log("event triggered", event);
            App.render();
          })
        });
      });
    },
  },
});
