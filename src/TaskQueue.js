const iterate = require('taskcluster-lib-iterate');
const assert = require('assert');
class TaskQueue {
  constructor(cfg, queue) {
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
  async startWorker() {

    while (true) {
      await this.claimTasks();
    }
  }

  async claimTasks() {
    let result = await this.queue.claimWork(this.provisionerId, this.workerType, {
      tasks: 1,
      workerGroup: this.workerGroup,
      workerId: this.workerId,
    });
    let stat = '';
    if (Object.keys(result.tasks[0].task.payload).length===0) {
      if (result.tasks[0].task.workerType === 'succeed') {
        return await this.queue.reportCompleted(result.tasks[0].status.taskId, result.tasks[0].runId);
      } else if (result.tasks[0].task.workerType === 'fail') {
        return await this.queue.reportFailed(result.tasks[0].status.taskId, result.tasks[0].runId);
      }
    } else {
      var payload = {
        reason: 'malformed-payload',
      };
      return await this.queue.reportException(result.tasks[0].status.taskId, result.tasks[0].runId, payload);
    }
  }
}
exports.TaskQueue = TaskQueue;