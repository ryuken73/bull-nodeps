const { EventEmitter } = require('events');
const createJob = require('./jobClass');
const { 
    DEFAULT_CONCURRENCY, 
    JOB_STATUS, 
    JOB_EVENTS, 
    QUEUE_EVENTS 
} = require('./constants');

class Queue extends EventEmitter {
    constructor(name){
        super();
        this.name = name;
        this.jobLists = {
            [JOB_STATUS.WAITING]: [],
            [JOB_STATUS.ACTIVE]: [],
            [JOB_STATUS.COMPLETED]: [],
            [JOB_STATUS.FAILED]: [],
            [JOB_STATUS.DELAYED]: [],
        }
        this._worker = null;
        this._concurrency = DEFAULT_CONCURRENCY;
    }
    _getNext = () => {
        const waitJobs = this.jobLists[JOB_STATUS.WAITING];
        const nextJob = waitJobs[0];
        this._removeJobStatus(nextJob, JOB_STATUS.WAITING);
        return nextJob;
    }
    add = job => {
        const newJob = createJob(job, this);
        this._setJobStatus(newJob, JOB_STATUS.WAITING);
        this.runNextJob();
    }
    _removeJobStatus = (job, jobStatus) => {
        const fromList = this.jobLists[jobStatus];
        this.jobLists[jobStatus] = fromList.filter(fromJob => fromJob.jobId !== job.jobId);
    }
    _setJobStatus = (job, jobStatus) => {
        const targetList = this.jobLists[jobStatus];
        this.jobLists[jobStatus] = [...targetList, job];
    }
    _moveJobStatus = (job, fromStatus, toStatus) => {
        this._removeJobStatus(job, fromStatus);
        this._setJobStatus(job, toStatus);
    }
    done = job => {
        return (error, result) => {
            if(error){
                this._moveJobStatus(job, JOB_STATUS.ACTIVE, JOB_STATUS.FAILED);
                this.emit(QUEUE_EVENTS.FAILED, job.jobId, error)
                throw new error;
            }
            this._moveJobStatus(job, JOB_STATUS.ACTIVE, JOB_STATUS.COMPLETED);
            this.emit(QUEUE_EVENTS.COMPLETED, job.jobId, result)
            this.runNextJob();
        }
    }
    runNextJob = () => {
        if(this._worker === null) return;
        console.log(`waiting: ${this.getWaitCount()} active: ${this.getActiveCount()} completed: ${this.getCompletedCount()}`)
        if(this.getActive().length >= this._concurrency) return;
        const nextJob = this._getNext();
        if(nextJob === undefined){
            this.emit('drained');
        } else {
            this._setJobStatus(nextJob, JOB_STATUS.ACTIVE);
            nextJob.on(JOB_EVENTS.PROGRESS, progress => this.emit(QUEUE_EVENTS.PROGRESS, nextJob, progress));
            this.emit('_runNextJob', nextJob, this.done(nextJob));
        }
    }
    getJob = jobId => this.jobs.find(job => job.jobId === jobId);
    getJobs = status => this.jobLists[status];
    getActive = () => this.jobLists[JOB_STATUS.ACTIVE];

    getWaitCount = () => this.jobLists[JOB_STATUS.WAITING].length;
    getActiveCount = () => this.jobLists[JOB_STATUS.ACTIVE].length;
    getCompletedCount = () => this.jobLists[JOB_STATUS.COMPLETED].length;
    getFailedCount = () => this.jobLists[JOB_STATUS.FAILED].length;

    empty = () => this.jobLists[JOB_STATUS.WAITING] = [];

    getJobLogs = jobId => {
        const job = this.getJob(jobId);
        if(job) return job.logs;
    }
    _registerWorker(worker){
        if(this._worker !== null){
            return false;
        }
        this._worker = worker;
        return true;
    }
    _parseArgs = args => {
        if(typeof(args[0]) === 'number'){
            return [args[0], args[1]]
        } else {
            return [DEFAULT_CONCURRENCY, args[0]]
        }
    }
    process(...args){
        const [concurrency, worker] = this._parseArgs(args);
        this._concurrency = concurrency;
        const registered = this._registerWorker(worker);
        if(registered){
            this.on('_runNextJob', this._worker);
            // invoke job which added before calling process()
            this.runNextJob();
        } else {
            throw new Error('duplicate processors. run Queue.clearProcessor() first')
        }
    }
}

const createQueue = queueName => {
    return new Queue(queueName)
}

module.exports = createQueue;   
