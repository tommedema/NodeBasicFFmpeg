var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    ffmpegProcessor = require('./ffmpegProcessor');

//creates a new processor object
var createProcessor = function (options) {
    //validate options such as niceness, make sure that required options are set
    if (!options.outputStream) throw 'output stream is not set';
    if (options.niceness && (options.niceness < -20 || options.niceness > 19)) throw 'niceness cannot be lower than -20 or higher than 19';
    if (!options.arguments) options.arguments = {};
    if (!options.endInputStream) options.endInputStream = true;
    if (!options.endOutputStream) options.endOutputStream = true;
    
    //create new processor, starts as an event emitter
    var processor = new EventEmitter();
    
    //set processor options
    processor.options = options;
    
    //initialize an empty state
    processor.state = {
            timeoutTimer: null
          , childProcess: null
          , inputWriteBufferEmpty: true
          , tmpStderrOutput: ''
          , emitInputAudioCodecEvent: options.emitInputAudioCodecEvent
    };
    
    //add execution and termination methods
    processor.execute = function() {
        ffmpegProcessor.execute(processor);
        
        //return processor to allow chaining
        return processor;
    };
    processor.terminate = function(signal) { //signal is optional
        ffmpegProcessor.terminate(processor, signal);
        
        //return processor to allow chaining
        return processor;
    };
    
    //return this processor
    return processor;
};

//public functions
exports.createProcessor = createProcessor;