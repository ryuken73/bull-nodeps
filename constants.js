module.exports = {
    DEFAULT_CONCURRENCY: 2,
    JOB_EVENTS: {
        PROGRESS: 'progress',
        WAITING: 'waiting',
    },
    JOB_STATUS: {
        WAITING: 'waiting',
        ACTIVE: 'active',
        COMPLETED: 'completed',
        FAILED: 'faild',
        DELAYED: 'delayed'
    },
    QUEUE_EVENTS : {
        ERROR: 'error',
        WAITING: 'waiting',
        ACTIVE: 'active',
        STALLED: 'stalled',
        PROGRESS: 'progress',
        COMPLETED: 'completed',
        FAILED: 'failed',
        PAUSED: 'paused',
        RESUMED: 'resumed',
        CLEANED: 'cleaned',
        DRAINED: 'drained',
        REMOVED: 'removed'
    }
}