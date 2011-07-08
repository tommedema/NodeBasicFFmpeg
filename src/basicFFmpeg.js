var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    ffmpegProcessor = require('./ffmpegProcessor');

//creates a new processor object
var createProcessor = function (options) {
    //validate options such as niceness, make sure that required options are set
    if (!options.inputStream) throw 'input stream is not set';
    if (!options.outputStream) throw 'output stream is not set';
    if (options.niceness && (options.niceness < -20 || options.niceness > 19)) throw 'niceness cannot be lower than -20 or higher than 19';
    if (!options.arguments) options.arguments = {};
    
    //create new processor, starts as an event emitter
    var processor = new EventEmitter();
    
    //set processor options
    processor.options = options;
    
    //initialize an empty state
    processor.state = {
            timeoutTimer: null
          , childProcess: null
          , tmpStderrOutput: ''
    };
    
    //add execution and termination methods
    processor.execute = function() {
        ffmpegProcessor.execute(processor);
    };
    processor.terminate = function(signal) { //signal is optional
        ffmpegProcessor.terminate(processor, signal);
    };
    
    //return this processor
    return processor;
};

//public functions
exports.createProcessor = createProcessor;