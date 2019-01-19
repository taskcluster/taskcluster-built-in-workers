const debug = require('debug')('index:test:api_test');
const helper = require('./helper');
const slugid = require('slugid');
const taskcluster = require('taskcluster-client');
const request = require('superagent');
const assume = require('assume');
const libUrls = require('taskcluster-lib-urls');
const Secrets = require('taskcluster-lib-testing');

suite('TaskQueue_test.js', ['taskcluster'], function(mock, skipping) {
  helper.withFakeQueue(mock, skipping);

  test('check succeed worker', async function() {
    const tq = await helper.load('taskqueue');
    var taskId = slugid.nice();
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
    console.log(taskResolution[taskId]);
    helper.assertTaskResolved(taskId, {completed: true});
  });
  taskId = slugid.nice();
  test('Check Fail worker', async function() {
    const tq = await helper.load('taskqueue');
    helper.claimableWork.push({
      tasks: [
        {
          status: {
            taskId: 1,
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
  test('Check non empty paylof for succeed', async function() {
    const tq = await helper.load('taskqueue');
    taskId = slugid.nice();
    helper.claimableWork.push({
      tasks: [
        {
          status: {
            taskId: 2,
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
    const tq = await helper.load('taskqueue');
    taskId = slugid.nice();
    helper.claimableWork.push({
      tasks: [
        {
          status: {
            taskId: 3,
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