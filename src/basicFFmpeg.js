var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    ffmpegProcessor = require('./ffmpegProcessor');

//creates a new processor object
var createProcessor = function (options) {
    //create new processor, starts as an event emitter
    var processor = new EventEmitter();
    
    //set processor options
    processor.options = options;
    
    //initialize an empty state
    processor.state = {
            timeoutTimer: null
          , childProcess: null
    };
    
    //add execution and termination methods
    processor.execute = function() {
        ffmpegProcessor.execute(processor);
    };
    processor.terminate = function() {
        ffmpegProcessor.terminate(processor);
    };
    
    //return this processor
    return processor;
};

//public functions
exports.createProcessor = createProcessor;