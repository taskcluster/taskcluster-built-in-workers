const assert = require('assert');
const debug = require('debug')('index:test:api_test');
const helper = require('./helper');
const slugid = require('slugid');
const taskcluster = require('taskcluster-client');
const request = require('superagent');
const assume = require('assume');
const libUrls = require('taskcluster-lib-urls');

helper.secrets.mockSuite('taskQueue_test.js', ['taskcluster'], function(mock, skipping) {
  helper.withFakeQueue(mock, skipping);
  const makeTask = function() {
    return {
      provisionerId: 'garbage-hybrid1999',
      workerType: 'fail',
      scopes: [],
      retries: 3,
      created: (new Date()).toJSON(),
      deadline: (new Date()).toJSON(),
      expires: taskcluster.fromNow('1 day'),
      payload: {},
      tags: {
        objective: 'Test task indexing',
      },
    };
  };

  test('Run task and test indexing', async function() {
    const taskId = slugid.v4();
    const task = makeTask();
    helper.queue.createTask(taskId, task);
    const tq = await helper.load('taskqueue');
    const res = await tq.claimTasks();
  });
});