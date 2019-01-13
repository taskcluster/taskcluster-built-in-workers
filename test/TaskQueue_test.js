const assert = require('assert');
const debug = require('debug')('index:test:api_test');
const helper = require('./helper');
const slugid = require('slugid');
const taskcluster = require('taskcluster-client');
const request = require('superagent');
const assume = require('assume');
const libUrls = require('taskcluster-lib-urls');

helper.secrets.mockSuite('TaskQueue_test.js', ['taskcluster'], function(mock, skipping) {
  helper.withFakeQueue(mock, skipping);

  test('Run task and test indexing', async function() {
    const tq = await helper.load('taskqueue');
    helper.claimableWork.push({
      tasks: {
        status: {
          taskId:0,
        },
        runId:0,
        workerGroup:'garbage-hybrid1999',
        workerId:'succeed',
        task: {
          provisionerId: 'garbage-hybrid1999',
          workerType:'succeed',
          payload:{},
        },
      },
    });
    await tq.claimTasks();
    assert.deepEqual(helper.taskResolutions[0], {completed: true});
    helper.claimableWork.push({
      tasks: {
        status: {
          taskId:1,
        },
        runId:0,
        workerGroup:'garbage-hybrid1999',
        workerId:'fail',
        task: {
          provisionerId: 'garbage-hybrid1999',
          workerType:'fail',
          payload:{},
        },
      },
    });
    await tq.claimTasks();
    assert.deepEqual(helper.taskResolutions[1], {failed: true});
    expectedPayload = {
      reason: 'malformed-payload',
    };
    helper.claimableWork.push({
      tasks: {
        status: {
          taskId:2,
        },
        runId:0,
        workerGroup:'garbage-hybrid1999',
        workerId:'garbage',
        task: {
          provisionerId: 'garbage-hybrid1999',
          workerType:'garbage',
          payload:{
            task:'something',
          },
        },
      },
    });
    await tq.claimTasks();
    assert.deepEqual(helper.taskResolutions[2], {exception: expectedPayload});
  });
});