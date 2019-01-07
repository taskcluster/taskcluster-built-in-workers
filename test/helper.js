const assert = require('assert');
const _ = require('lodash');
const taskcluster = require('taskcluster-client');
const load = require('../src/main');
const slugid = require('slugid');
const worker = require('../src/taskQueue.js');
const libUrls = require('taskcluster-lib-urls');
const {fakeauth, stickyLoader, Secrets} = require('taskcluster-lib-testing');

const helper = module.exports;

exports.load = stickyLoader(load);

suiteSetup(async function() {
  exports.load.inject('profile', 'test');
  exports.load.inject('process', 'test');
});

// set up the testing secrets
exports.secrets = new Secrets({
  secretName: 'project/taskcluster/testing/taskcluster-index',
  secrets: {
    taskcluster: [
      {env: 'TASKCLUSTER_ROOT_URL', cfg: 'taskcluster.rootUrl', name: 'rootUrl',
        mock: libUrls.testRootUrl()},
      {env: 'TASKCLUSTER_CLIENT_ID', cfg: 'taskcluster.credentials.clientId', name: 'clientId'},
      {env: 'TASKCLUSTER_ACCESS_TOKEN', cfg: 'taskcluster.credentials.accessToken', name: 'accessToken'},
    ],
  },
  load: exports.load,
});

helper.rootUrl = 'http://localhost:60020';
/**
 * Set up a fake tc-queue object that supports only the `task` method,
 * and inject that into the loader.  This is injected regardless of
 * whether we are mocking.
 *
 * The component is available at `helper.queue`.
 */
exports.withFakeQueue = (mock, skipping) => {
  suiteSetup(function() {
    if (skipping()) {
      return;
    }

    helper.queue = stubbedQueue();
    helper.load.inject('queue', helper.queue);
  });
};

exports.withWorker = (mock, skipping) => {
  suiteSetup(function() {
    if (skipping()) {
      return;
    }
    helper.worker = new worker.TaskQueue();
    helper.load.inject('worker', helper.worker);
  });
};
/**
 * make a queue object with the `task` method stubbed out, and with
 * an `addTask` method to add fake tasks.
 */
const stubbedQueue = () => {
  const tasks = {};
  // responses from claimWork
  exports.claimableWork = [];
  // {taskId: resolution}
  exports.taskResolutions = {};
  const queue = new taskcluster.Queue({
    rootUrl: helper.rootUrl,
    credentials:      {
      clientId: 'index-server',
      accessToken: 'none',
    },
    fake: {
      task: async (taskId) => {
        const task = tasks[taskId];
        assert(task, `fake queue has no task ${taskId}`);
        return task;
      },
      claimWork: async (provisionerId, workerType, payload) => {
        return exports.claimableWork.pop();
      },
      reportCompleted: async (taskId, runId) => {
        exports.taskResolutions[taskId] = {completed: true};
        return {};
      },
      reportFailed: async (taskId, runId) => {
        exports.taskResolutions[taskId] = {failed: true};
        return {};
      },
      reportException: async (taskId, runId, payload) => {
        exports.taskResolutions[taskId] = {exception: payload};
        return {};
      },
    },
  });

  queue.addTask = function(taskId, task) {
    tasks[taskId] = task;
  };

  return queue;
};