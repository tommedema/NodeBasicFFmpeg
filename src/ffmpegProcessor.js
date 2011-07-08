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
    
    //create new child process with given inputStream and outputStream, set encodings, update state
    
    //renice child process
    
    //parse stdErr, emit appropriate events
    
    //pipe stdOut to outputStream
};

//terminates the given processor, which has options and state
var terminateProcessor = function (processor, signal) {
    //set default signal if signal is not set
    
    //check if processor is active
    
    //terminate with default signal or custom signal if set
};

//public methods
exports.execute = executeProcessor;
exports.terminate = terminateProcessor;