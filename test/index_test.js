const debug = require('debug')('index:test:api_test');
const helper = require('./helper');
const slugid = require('slugid');
const taskcluster = require('taskcluster-client');
const request = require('superagent');
const assume = require('assume');
const libUrls = require('taskcluster-lib-urls');
const Secrets = require('taskcluster-lib-testing');

suite('TaskQueue_test.js', function() {
  helper.withFakeQueue();

  test('check succeed worker', async function() {
    const tq = await helper.load('succeedTaskQueue');
    const taskId = slugid.nice();
    helper.claimableWork.push({
      tasks: [
        {
          status: {
            taskId: taskId,
          },
          runId: 0,
          workerGroup: 'garbage-hybrid1999',
          workerId: 'succeed',
          task: {
            provisionerId: 'garbage-hybrid1999',
            workerType: 'succeed',
            payload: {},
          },
        },
      ],
    });
    await tq.claimTask();
    helper.assertTaskResolved(taskId, {completed: true});
  });

  test('Check Fail worker', async function() {
    const tq = await helper.load('failTaskQueue');
    const taskId = slugid.nice();
    helper.claimableWork.push({
      tasks: [
        {
          status: {
            taskId: taskId,
          },
          runId: 0,
          workerGroup: 'garbage-hybrid1999',
          workerId: 'fail',
          task: {
            provisionerId: 'garbage-hybrid1999',
            workerType: 'fail',
            payload: {},
          },
        },
      ],
    });
    await tq.claimTask();
    helper.assertTaskResolved(taskId, {failed: true});
  });

  test('Check non empty payloadd for succeed', async function() {
    const tq = await helper.load('succeedTaskQueue');
    const taskId = slugid.nice();
    helper.claimableWork.push({
      tasks: [
        {
          status: {
            taskId: taskId,
          },
          runId: 0,
          workerGroup: 'garbage-hybrid1999',
          workerId: 'succeed',
          task: {
            provisionerId: 'garbage-hybrid1999',
            workerType: 'succeed',
            payload: {
              task:'put',
            },
          },
        },
      ],
    });
    await tq.claimTask();
    expectedPayload = {
      reason: 'malformed-payload',
    };
    helper.assertTaskResolved(taskId, {exception: expectedPayload});
  });

  test('Check non empty payload for fail', async function() {
    const tq = await helper.load('failTaskQueue');
    const taskId = slugid.nice();
    helper.claimableWork.push({
      tasks: [
        {
          status: {
            taskId: taskId,
          },
          runId: 0,
          workerGroup: 'garbage-hybrid1999',
          workerId: 'fail',
          task: {
            provisionerId: 'garbage-hybrid1999',
            workerType: 'fail',
            payload: {
              task:'put',
            },
          },
        },
      ],
    });
    await tq.claimTask();
    helper.assertTaskResolved(taskId, {exception: expectedPayload});
  });
});
