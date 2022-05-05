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
// ffmpegQueue.on('completed', (job, result) => console.log(`${job.id}: ${progress}`))
ffmpegQueue.on('completed', result => console.log(`${result}`));

const jobData = { totalRunningTime: 10000 };
ffmpegQueue.add(
    { data: jobData }
);

try {
    ffmpegQueue.process((job, done) => {
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



process.stdin.on('data', data => {
    ffmpegQueue.add({data: {totalRunningTime: parseInt(data.toString())}});
});

