'use strict';
const shim = require('fabric-shim');
const util = require('util');

let Chaincode = class {
  async Init(stub) {
    console.info('=========== Instantiated MyVote chaincode ===========');
    return shim.success();
  }

  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);

    let method = this[ret.fcn];
    if (!method) {
      console.error('no function of name:' + ret.fcn + ' found');
      throw new Error('Received unknown function ' + ret.fcn + ' invocation');
    }
    try {
      let payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  async queryVote(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting VoteNumber ex: Vote01');
    }
    let voteNumber = args[0];

    let voteAsBytes = await stub.getState(voteNumber); //get the vote from chaincode state
    if (!voteAsBytes || voteAsBytes.toString().length <= 0) {
      throw new Error(voteNumber + ' does not exist: ');
    }
    console.log(voteAsBytes.toString());
    return voteAsBytes;
  }

  async initLedger(stub, args) {
    console.info('============= START : Initialize Ledger ===========');
    let votes = [];
    votes.push({
      party: 'Party A',
      time: '11:04',
      location: 'Beliaghata'
    });
    votes.push({
      party: 'Party B',
      time: '11:02',
      location: 'Beliaghata'
    });
    votes.push({
      party: 'Party C',
      time: '11:04',
      location: 'Technopolis'
    });
    votes.push({
      party: 'Party A',
      time: '11:04',
      location: 'Phoolbagan'
    });
    votes.push({
      party: 'Party A',
      time: '11:05',
      location: 'Beliaghata'
    });
    votes.push({
      party: 'Party C',
      time: '11:04',
      location: 'Garia'
    });
    votes.push({
      party: 'Party B',
      time: '11:07',
      location: 'Beliaghata'
    });
    votes.push({
      party: 'Party C',
      time: '11:11',
      location: 'Garia'
    });
    votes.push({
      party: 'Party A',
      time: '11:10',
      location: 'Garia'
    });
    votes.push({
      party: 'Party C',
      time: '11:40',
      location: 'Beliaghata'
    });

    for (let i = 0; i < votes.length; i++) {
      votes[i].docType = 'vote';
      await stub.putState('VOTE' + i, Buffer.from(JSON.stringify(votes[i])));
      console.info('Added <--> ', votes[i]);
    }
    console.info('============= END : Initialize Ledger ===========');
  }

  async createVote(stub, args) {
    console.info('============= START : Create Vote ===========');
    if (args.length != 4) {
      throw new Error('Incorrect number of arguments. Expecting 5');
    }

    var vote = {
      docType: 'vote',
      make: args[1],
      model: args[2],
      color: args[3]
    };

    await stub.putState(args[0], Buffer.from(JSON.stringify(vote)));
    console.info('============= END : Create Vote ===========');
  }

  async queryAllVotes(stub, args) {

    let startKey = 'VOTE0';
    let endKey = 'VOTE999';

    let iterator = await stub.getStateByRange(startKey, endKey);

    let allResults = [];
    while (true) {
      let res = await iterator.next();

      if (res.value && res.value.value.toString()) {
        let jsonRes = {};
        console.log(res.value.value.toString('utf8'));

        jsonRes.Key = res.value.key;
        try {
          jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
        } catch (err) {
          console.log(err);
          jsonRes.Record = res.value.value.toString('utf8');
        }
        allResults.push(jsonRes);
      }
      if (res.done) {
        console.log('end of data');
        await iterator.close();
        console.info(allResults);
        return Buffer.from(JSON.stringify(allResults));
      }
    }
  }
};

shim.start(new Chaincode());
