const loader = require('taskcluster-lib-loader');
const monitor = require('taskcluster-lib-monitor');
const docs = require('taskcluster-lib-docs');
const taskcluster = require('taskcluster-client');
const config = require('typed-env-config');

const load = loader({
  cfg: {
    requires: ['profile'],
    setup: ({profile}) => config({profile}),
  },

  monitor: {
    requires: ['process', 'profile', 'cfg'],
    setup: ({process, profile, cfg}) => monitor({
      rootUrl: cfg.taskcluster.rootUrl,
      projectName: 'taskcluster-built-in-workers',
      enable: cfg.monitoring.enable,
      credentials: cfg.taskcluster.credentials,
      mock: profile !== 'production',
      process,
    }),
  },

  docs: {
    requires: ['cfg'],
    setup: ({cfg}) => docs.documenter({
      credentials: cfg.taskcluster.credentials,
      tier: 'core',
      publish: cfg.app.publishMetaData,
      references: [],
    }),
  },

  writeDocs: {
    requires: ['docs'],
    setup: ({docs}) => docs.write({docsDir: process.env['DOCS_OUTPUT_DIR']}),
  },

  server: {
    requires: ['cfg', 'docs'],
    setup: ({cfg, docs}) => {
      console.log('Hello, world.');
    },
  },
}, ['process', 'profile']);

// If this file is executed launch component from first argument
if (!module.parent) {
  load(process.argv[2], {
    process: process.argv[2],
    profile: process.env.NODE_ENV,
  }).catch(err => {
    console.log(err.stack);
    process.exit(1);
  });
}

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
    let result = await this.queue.claimWork(this.provisionerId, this.workerType, {
      tasks : 1,
      workerGroup: this.workerGroup,
      workerId: this.workerId
    });

  }
async taskResolver(result) {
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

// Export load for tests
module.exports = load;
