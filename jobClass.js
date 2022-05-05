const { EventEmitter } = require('events');
const {JOB_STATUS, JOB_EVENTS} = require('./constants');

const getNextId = () => Date.now();

class Job extends EventEmitter {
    constructor(job){
        super();
        console.log(job)
        this.jobId = job.jobId || getNextId();
        this.data = job.data;
        this._progress = 0;
        this._logs = [];
        this._status = JOB_STATUS.WAITING;
    }
    status(status){
        if(status === undefined) return this._status;
        this._status = status;
        this.emit(this._status, this.jobId)
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

const createJob = jobInfo => {
    return new Job(jobInfo)
}

module.exports = createJob;