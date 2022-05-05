const { EventEmitter } = require('events');
const { JOB_EVENTS} = require('./constants');

const getNextId = () => Date.now();

class Job extends EventEmitter {
    constructor(job, queue){
        super();
        console.log(job)
        this.jobId = job.jobId || getNextId();
        this.data = job.data;
        this._progress = 0;
        this._logs = [];
        this._ownQueue = queue;
    }
    progress(percent){
        if(percent === undefined) return this._progress;
        this._progress = percent;
        this.emit(JOB_EVENTS.PROGRESS, percent);
    }
    logs(log){
        if(log === undefined) return this._logs;
        this._logs = [...this._logs, log];
    }
}

const createJob = (jobInfo, queue) => {
    return new Job(jobInfo, queue)
}

module.exports = createJob;