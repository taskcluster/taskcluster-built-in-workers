const iterate = require('taskcluster-lib-iterate');
const assert = require('assert');
class TaskQueue {
    constructor(cfg) {
        assert(cfg.workerId, 'Worker ID is required');
        assert(cfg.workerType, 'Worker type is required');
        assert(cfg.workerGroup, 'Worker group is required');
        assert(cfg.provisionerId, 'Provisioner ID is required');
        assert(cfg.queue, 'Instance of taskcluster queue is required');
        this.queues = null;
        this.queue = cfg.worker.queue;
        this.workerType = cfg.worker.workerType;
        this.provisionerId = cfg.worker.provisionerId;
        this.workerGroup = cfg.worker.workerGroup;
        this.workerId = cfg.worker.workerId;
        this.client = cfg.worker.queue;
    }

    async claimTasks() {
            var capacity = 1;
            var result;          
            let result = await this.queue.claimWork(this.provisionerId, this.workerType, {
                tasks: capacity,
                workerGroup: this.workerGroup,
                workerId: this.workerId
            });
            if (result.tasks.task.payload.length == 0) {

                if (result.tasks.task.workerType == "suceed") {
                    successResolver(result);
                } else if (result.tasks.task.workerType == "fail") {
                    failureResolver(result);
                }
            } else {
                malformedPayload(result);
            }
    }

    async successResolver(result) {
        reportsuccess = this.queue.reportCompleted(result.tasks.status.taskId, result.tasks.runId);
    }
    async failureResolver(result) {
        reportfailure = this.queue.reportFailed(result.tasks.status.taskId, result.tasks.runId);
    }
    async malformedPayload(result) {
        payload = {
            reason: "malformed-payload"
        }
        reportmp = this.queue.reportException(result.tasks.status.taskId, result.tasks.runId, payload)
    }
}
exports.TaskQueue = TaskQueue;