const { EventEmitter } = require('events');
const { DEFAULT_CONCURRENCY, JOB_EVENTS, QUEUE_EVENTS } = require('./constants');
const {removeFirstFromArray} = require('./utils');
const createJob = require('./jobClass');

class Queue extends EventEmitter {
    constructor(name){
        super();
        this.name = name;
        this.jobs = [];
        this._worker = null;
        this._concurrency = DEFAULT_CONCURRENCY;
    }
    _getNext(){
        const next = this.jobs[0];
        const newJobs = removeFirstFromArray(this.jobs);
        this.jobs = newJobs;
        return next;
    }
    add = job => {
        const newJob = createJob(job);
        this.jobs = [...this.jobs, newJob];
        this.runNextJob();
    }
    done = (error, result) => {
        if(error){
            throw new error;
        }
        this.emit(QUEUE_EVENTS.COMPLETED, result)
        this.runNextJob();
    }
    runNextJob = () => {
        if(this._worker === null) return;
        const nextJob = this._getNext();
        if(nextJob === undefined){
            this.emit('drained');
        } else {
            nextJob.on(JOB_EVENTS.PROGRESS, progress => this.emit(QUEUE_EVENTS.PROGRESS, nextJob, progress));
            this.emit('_nextJob', nextJob, this.done);
        }
    }
    getJob(jobId){
        return this.jobs.find(job => job.jobId === jobId);
    }
    getJobs(status){

    }
    getJobLogs(jobId){
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
    process(concurrency, callback){
        let worker;
        if(typeof(concurrency) === 'number'){
            this._concurrency = concurrency;
            worker = callback;
        } else {
            worker = concurrency;
        }
        const registered = this._registerWorker(worker);
        if(registered){
            this.on('_nextJob', this._worker);
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
