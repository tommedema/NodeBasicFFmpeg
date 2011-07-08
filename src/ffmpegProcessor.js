var spawn = require('child_process').spawn;

//generates and returns the arguments fit for given processor to spawn ffmpeg with
var genProcArgs = function (processor) {
    var args = ['-i', '-', 'pipe:1']; //make ffmpeg read from stdin, stream data to stdout
    if (processor.options.arguments) { //add additional arguments
        for (var argument in processor.options.arguments) {
            if (processor.options.arguments.hasOwnProperty(argument)) {
                args.push(argument, processor.options.arguments[argument]);
            }
        }
    }
};

//generates and returns the options fit for given processor to spawn ffmpeg with
var genProcOptions = function (processor) {
    return  {
                customFds: [-1, processor.outputStream.fd, -1] //we pipe our input stream to stdin, so that ffmpeg will write to our output stream while we control the piping process
            };
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
    process.stderr.setEncoding('utf8');
    
    //update process state
    processor.state.childProcess = process;
    
    //renice child process if applicable, fails silently if things go wrong
    if (processor.options.niceness) {
        exec('renice -n ' + processor.options.niceness + ' -p ' + process.pid);
    }
    
    //parse stdErr, emit appropriate events
    process.stderr.on('data', function (chunk) {
        //emit the info event for when clients wish to keep or output stderr feedback
        processor.emit('info', chunk);
        
        /* parsing logic:
         * no need to store all stderr data in memory
         * instead, parse line by line
         * perform regular expressions on each line to fire following events:
         *      inputAudioCodec
         *      progress
         */
        //TODO: implement parsing logic
    });
    
    //listen to process exit event: end stdin and stdout if necessary
    process.on('exit', function(exitCode, signal) {
        //clear timeout timer if applicable
        if (processor.state.timeoutTimer) clearTimeout(processor.state.timeoutTimer);
        
        //TODO: emit: success/failure
    });
    
    //start piping input stream to stdin
    processor.options.inputStream.pipe(process.stdin);
};

//terminates the given processor, which has options and state
var terminateProcessor = function (processor, signal) {    
    //set default signal if signal is not set
    if (!signal) signal = 'SIGTERM';
    
    //clear timeout timer
    if (processor.state.timeoutTimer) clearTimeout(processor.state.timeoutTimer);
    
    //end writable stream
    processor.options.outputStream.destroy(); //not using end here, as we do not want to pipe any more data
    
    //check if processor is active, if not we are done already
    if (!processor.state.childProcess) {
        return;
    }
    
    //terminate with default signal or custom signal if set
    processor.state.childProcess.kill(signal);
};

//public methods
exports.execute = executeProcessor;
exports.terminate = terminateProcessor;