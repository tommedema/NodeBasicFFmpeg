var spawn = require('child_process').spawn;

//generates and returns the arguments fit for given processor to spawn ffmpeg with
var genProcArgs = function (processor) {
    //TODO: genProcArgs
};

//generates and returns the options fit for given processor to spawn ffmpeg with
var genProcOptions = function (processor) {
    //TODO: genProcOptions
};

//executes the given processor, which has options and state
var executeProcessor = function (processor) {
    //check if processor is not already active
    if (processor.state.childProcess) throw 'processor.execute called while processor has already been executed';
    
    //set timeout event if applicable
    if (processor.options.timeout) {
        processor.state.timeoutTimer = setTimeout(function() {
            processor.state.timeoutTimer = null;
            processor.emit('timeout', processor);
        }, processor.options.timeout);
    }
    
    //create new child process with given inputStream and outputStream
    process = spawn('ffmpeg', genProcArgs(processor), genProcOptions(processor));
    
    //set stderr encoding to make it parseable
    if (process.stderr) {
        process.stderr.setEncoding('utf8');
    }
    
    //update process state
    processor.state.childProcess = process;
    
    //renice child process if applicable, fails silently if things go wrong
    if (processor.options.niceness) {
        exec('renice -n ' + processor.options.niceness + ' -p ' + process.pid);
    }
    
    //TODO: parse stdErr, emit appropriate events
    
    //TODO: listen to process exit event
};

//terminates the given processor, which has options and state
var terminateProcessor = function (processor, signal) {
    //TODO: implement termination
    
    //set default signal if signal is not set
    
    //check if processor is active
    
    //terminate with default signal or custom signal if set
};

//public methods
exports.execute = executeProcessor;
exports.terminate = terminateProcessor;