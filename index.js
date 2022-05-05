const createQueue = require('./queueClass');
const createStep = (totalValue, count) => {
    const stepValue = parseInt((totalValue/count).toFixed(0));
    let result = [];
    let nextStep = 0;
    while(nextStep <= totalValue){
        result = [...result, nextStep];
        nextStep += stepValue;
    }
    if(result[result.length - 1] !== totalValue){
        const lastValue = totalValue;
        result = [...result, lastValue];
    }
    return result;
}

/*
const timerQueue = createQueue('timer');
timerQueue.on('error', error => console.log('errored:', error));
timerQueue.on('waiting', jobId => console.log('waiting:', jobId));
timerQueue.on('active', job => console.log('active:', job.jobId));
timerQueue.on('drained', () => console.log('drained'));
timerQueue.on('progress', (job, progress) => console.log(`${job.jobId}: ${progress}`))
timerQueue.on('completed', (jobId, result) => console.log(`${jobId}: ${result}`))

const job1 = { totalRunningTime: 20000 };
const job2 = { totalRunningTime: 10000 };

// adding job before handler should works!
timerQueue.add({ data: job1 });

try {
    timerQueue.process(1, (job, done) => {
        console.log(job.jobId, job.data, done);
        const {totalRunningTime} = job.data;
        const stepValues = createStep(totalRunningTime, 10);
        stepValues.forEach(sleepTime => {
            (function(progress){
                setTimeout(() => {
                    job.progress(progress);
                    if(progress === totalRunningTime){
                        done(null, 'successfully done!');
                    }
                },progress)
            }
            )(sleepTime)
        })
    })
    // invoking process twice, throw error
    // timerQueue.process((job, done) => {});
} catch(err) {
    console.log(err);
}


timerQueue.add({ data: job2 });
*/


const cpQueue = createQueue('childProcess');
cpQueue.on('error', error => console.log('errored:', error));
cpQueue.on('waiting', jobId => console.log('waiting:', jobId));
cpQueue.on('active', job => console.log('active:', job.jobId));
cpQueue.on('drained', () => console.log('drained'));
cpQueue.on('progress', (job, progress) => console.log(`${job.jobId}: ${progress}`))
cpQueue.on('completed', (jobId, result) => console.log(`${jobId}: ${result}`))

const listdir1 = {cmd: 'ls', args:['-l', 'c:/']}
const listdir2 = {cmd: 'ls', args:['-l', 'd:/']}
const listdir3 = {cmd: 'ls', args:['-l', 'd:/temp']}

cpQueue.add({data: listdir1})
cpQueue.add({data: listdir2})

const cp = require('child_process');
try {
    cpQueue.process(3, (job, done) => {
        try {
            console.log('jobInfo: ', job.data);
            const listJob = cp.spawn(job.data.cmd, job.data.args);
            listJob.stdout.on('data', data => console.log(data.toString()))
            listJob.on('close', () => done(null, 'job done'))  ;
            listJob.on('error', done);
        } catch(err){
            console.log('errored:',err);
            done(err);
        }
    })
} catch(err){
    console.log(err);
}

cpQueue.add({data: listdir3})

process.stdin.on('data', data => {
    cpQueue.add({data: {totalRunningTime: parseInt(data.toString())}});
});