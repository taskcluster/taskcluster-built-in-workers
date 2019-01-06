const iterate = require('taskcluster-lib-iterate');
const assert = require('assert');
class TaskQueue {
  constructor(cfg, queue) {
    console.log(cfg.worker.workerId);
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
    this.client = cfg.worker.queue;
  }

  async claimTasks() {
    var capacity = 1;
    try {
      let result = await this.queue.claimWork(this.provisionerId, this.workerType, {
        tasks: capacity,
        workerGroup: this.workerGroup,
        workerId: this.workerId,
      });
    } catch (error) {
      console.log('error occured: ', error);
    }
    if (result.tasks.task.payload.length === 0) {
      if (result.tasks.task.workerType === 'suceed') {
        let stat = await successResolver(result);
      } else if (result.tasks.task.workerType === 'fail') {
        let stat = await failureResolver(result);
      }
    } else {
      let stat = await malformedPayload(result);
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
    payload = {
      reason: 'malformed-payload',
    };
    let reportmp = await this.queue.reportException(result.tasks.status.taskId, result.tasks.runId, payload);
    return reportmp;
  }
}
exports.TaskQueue = TaskQueue;