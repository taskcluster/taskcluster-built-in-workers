const iterate = require('taskcluster-lib-iterate');
const assert = require('assert');
const _ = require('lodash');
class TaskQueue {
  constructor(cfg, queue) {
    console.log(cfg);
    assert(cfg.worker.workerId, 'Worker ID is required');
    assert(cfg.worker.workerType, 'Worker type is required');
    assert(cfg.worker.workerGroup, 'Worker group is required');
    assert(cfg.worker.provisionerId, 'Provisioner ID is required');
    assert(queue, 'Instance of taskcluster queue is required');
    this.queue = queue;
    this.workerType = cfg.worker.workerType;
    this.provisionerId = cfg.worker.provisionerId;
    this.workerGroup = cfg.worker.workerGroup;
    this.workerId = cfg.worker.workerId;
  }

  async claimTasks() {
    var capacity = 1;
    let result = await this.queue.claimWork(this.provisionerId, this.workerType, {
      tasks: capacity,
      workerGroup: this.workerGroup,
      workerId: this.workerId,
    });
    console.log('result of claimWork\n', result);
    let stat = '';
    if (_.isEmpty(result.tasks.task.payload)) {
      if (result.tasks.task.workerType === 'suceed') {
        stat = await this.successResolver(result);
      } else if (result.tasks.task.workerType === 'fail') {
        stat = await this.failureResolver(result);
      }
    } else {
      stat = await this.malformedPayload(result);
    }
    return stat;
  }

  async successResolver(result) {
    let reportsuccess = await this.queue.reportCompleted(result.tasks.status.taskId, result.tasks.runId);
    return reportsuccess;
  }
  async failureResolver(result) {
    let reportfailure =  await this.queue.reportFailed(result.tasks.status.taskId, result.tasks.runId);
    return reportfailure;
  }
  async malformedPayload(result) {
    var payload = {
      reason: 'malformed-payload',
    };
    let reportmp = await this.queue.reportException(result.tasks.status.taskId, result.tasks.runId, payload);
    return reportmp;
  }
}
exports.TaskQueue = TaskQueue;