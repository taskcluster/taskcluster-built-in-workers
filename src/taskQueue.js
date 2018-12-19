const iterate = require('taskcluster-lib-iterate');
class TaskQueue {
  constructor() {
    assert(cfg.workerId, 'Worker ID is required');
    assert(cfg.workerType, 'Worker type is required');
    assert(cfg.workerGroup, 'Worker group is required');
    assert(cfg.provisionerId, 'Provisioner ID is required');
    assert(cfg.queue, 'Instance of taskcluster queue is required');
    assert(cfg.log, 'Logger is required');
    this.queues = null;
    this.queue = cfg.queue;
    this.workerType = cfg.workerType;
    this.provisionerId = cfg.provisionerId;
    this.workerGroup = cfg.workerGroup;
    this.workerId = cfg.workerId;
    this.client = cfg.queue;
    this.log = cfg.log;
}

async claimTasks() {

  i = new Iterate({
    let result = await this.queue.claimWork(this.provisionerId, this.workerType, {
      tasks : 1,
      workerGroup: this.workerGroup,
      workerId: this.workerId
    });
  if(result.tasks.task.payload.length==0) {

    if(result.tasks.task.workerType=="suceed")
    {
      successResolver(result);
    }
    else if (result.tasks.task.workerType=="fail") 
    {
      failureResolver(result);
    }
  }
  else
  {
    malformedPayload(result);
  }
}
);
}

async successResolver(result) {
  reportsuccess = this.queue.reportCompleted(result.tasks.status.taskId,result.tasks.runId);
}
async failureResolver(result) {
  reportfailure = this.queue.reportFailed(result.tasks.status.taskId,result.tasks.runId);
}
async malformedPayload(result){
  payload = {
    reason:"malformed-payload"
  }
  reportmp = this.queue.reportException(result.tasks.status.taskId,result.tasks.runId,payload)
}
}
exports.TaskQueue = TaskQueue;