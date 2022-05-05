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

const ffmpegQueue = createQueue('ffmpeg');
ffmpegQueue.on('error', error => console.log('errored:', error));
ffmpegQueue.on('waiting', jobId => console.log('waiting:', jobId));
ffmpegQueue.on('drained', () => console.log('drained'));
ffmpegQueue.on('progress', (job, progress) => console.log(`${job.jobId}: ${progress}`))
ffmpegQueue.on('completed', (jobId, result) => console.log(`${jobId}: ${result}`))

const job1 = { totalRunningTime: 20000 };
const job2 = { totalRunningTime: 10000 };

// adding job before handler should works!
ffmpegQueue.add({ data: job1 });

try {
    ffmpegQueue.process(5, (job, done) => {
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
    // ffmpegQueue.process((job, done) => {});
} catch(err) {
    console.log(err);
}


ffmpegQueue.add({ data: job2 });

process.stdin.on('data', data => {
    ffmpegQueue.add({data: {totalRunningTime: parseInt(data.toString())}});
});

