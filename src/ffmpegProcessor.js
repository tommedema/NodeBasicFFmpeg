//references
var spawn = require('child_process').spawn,
    exec = require('child_process').exec;

//generates and returns the arguments fit for given processor to spawn ffmpeg with
var genProcArgs = function (processor) {
    var args = ['-i', 'pipe:0']; //make ffmpeg read from stdin
    if (processor.options.arguments) { //add additional arguments
        for (var argument in processor.options.arguments) {
            if (processor.options.arguments.hasOwnProperty(argument)) {
                args.push(argument);
                if (processor.options.arguments[argument]) args.push(processor.options.arguments[argument]);
            }
        }
    }
    args.push('pipe:1'); //stream data to stdout
    return args;
};

//generates and returns the options fit for given processor to spawn ffmpeg with
var genProcOptions = function (processor) {
    return  {
                customFds: [-1, -1, -1] //create new stdin, stdout and stderr file descriptors
            };
};

//ends input and/or output stream for given processor, if desired
var endStreamsIfDesired = function (processor) {
    //end input stream if applicable
    if (processor.options.endInputStream && processor.options.inputStream) {
        if (processor.options.inputStream.end) {
            processor.options.inputStream.end();
        }
        if (processor.options.inputStream.destroy && processor.options.inputStream.socket) { //perform another check in case end was instantaneous
            processor.options.inputStream.destroy();
        }
    }
    
    //end output stream if applicable
    if (processor.options.endOutputStream && processor.options.outputStream && processor.options.outputStream.writable) {
        if (processor.options.outputStream.end) {
            processor.options.outputStream.end();
        }
        if (processor.options.outputStream.destroy && processor.options.outputStream.socket) { //perform another check in case end was instantaneous
            processor.options.outputStream.destroy();
        }
    }
};

//terminates the given processor, which has options and state
var terminateProcessor = function (processor, signal) {    
    //set default signal if signal is not set
    if (!signal) signal = 'SIGTERM';
    
    //clear timeout timer
    if (processor.state.timeoutTimer) clearTimeout(processor.state.timeoutTimer);
    
    //end streams if desired
    endStreamsIfDesired(processor);
    
    //handle leftover output
    if (processor.options.emitInfoEvent && processor.state.tmpStderrOutput) processor.emit('info', processor.state.tmpStderrOutput);
    processor.state.tmpStderrOutput = '';
    
    //if processor is active, terminate it with default signal or custom signal if set
    if (processor.state.childProcess) {
        processor.state.childProcess.kill(signal); 
    }
    
    //return processor to allow chaining
    return processor;
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
    var proc = spawn('ffmpeg', genProcArgs(processor), genProcOptions(processor));
    
    //set stderr encoding to make it parseable
    proc.stderr.setEncoding('utf8');
    
    //update child process state
    processor.state.childProcess = proc;
    
    //renice child process if applicable, fails silently if things go wrong
    if (processor.options.niceness) {
        exec('renice -n ' + processor.options.niceness + ' -p ' + proc.pid);
    }
    
    //set regular expressions for this processor
    processor.regExps = {
            line: /^([^\n]*\n)/
          , audioCodec: /Audio: ([A-Za-z0-9]+),/ //Stream #0.0: Audio: mp3, 44100 Hz, stereo, s16, 186 kb/s
          , progress: /size=[\b]*([0-9]+)kB/ //size=      52kB time=00:00:11.43 bitrate=  37.4kbits/s  
    };
    
    /* parse stdErr, emit appropriate events - parsing logic:
     * no need to store all stderr data in memory
     * instead, parse line by line
     * perform regular expressions on each line to emit the following events:
     *      > inputAudioCodec
     *      > progress
     *      > info
     */
    if (processor.options.emitInfoEvent || processor.state.emitInputAudioCodecEvent || processor.options.emitProgressEvent) {
        proc.stderr.on('data', function (chunk) {      
            //update temporary output for line checks
            processor.state.tmpStderrOutput += chunk;
            
            //for each line
            var lineResults;
            while (lineResults = processor.regExps.line.exec(processor.state.tmpStderrOutput)) {
                var line = lineResults[1];
                
                //update tmp output
                processor.state.tmpStderrOutput = processor.state.tmpStderrOutput.slice(line.length);
                
                //emit the info event for when clients wish to keep or output stderr feedback (per line)
                if (processor.options.emitInfoEvent) processor.emit('info', line);
                
                //if we need to inform about input audio codec used
                if (processor.state.emitInputAudioCodecEvent) {
                    var audioResult = processor.regExps.audioCodec.exec(line);
                    if (audioResult) {
                        processor.emit('inputAudioCodec', audioResult[1]);
                        processor.state.emitInputAudioCodecEvent = false; //only inform once
                        
                        //stop listening for stderr if we can
                        if (!processor.state.emitInfoEvent && !processor.options.emitProgressEvent) {
                            proc.stderr.removeAllListeners('data');
                            processor.state.tmpStderrOutput = '';
                        }
                    }
                }
                
                //if we need to inform about progress
                if (processor.options.emitProgressEvent) {
                    var progressResult = processor.regExps.progress.exec(line);
                    if (progressResult) {
                        processor.emit('progress', parseInt(progressResult[1]) * 1000);
                    }
                }
            }
        });
    }
    
    //listen to process exit event: end stdin and stdout if necessary
    proc.on('exit', function(exitCode, signal) {        
        //terminate the processor
        terminateProcessor(processor);
        
        //failure if exitCode is not 0 or signal is set
        if (exitCode !== 0 || signal) {
            processor.emit('failure', exitCode, signal);
        }
        else { //normal termination equals success
            processor.emit('success', exitCode, signal);
        }
    });
    
    //pipe stdout to output stream
    proc.stdout.pipe(processor.options.outputStream);
    
    //start piping input stream to stdin if set, otherwise set stdin as input stream
    if (processor.options.inputStream) {
        processor.options.inputStream.pipe(proc.stdin);
    }
    else {
        processor.options.inputStream = proc.stdin;
    }
    
    //return processor to allow chaining
    return processor;
};

//public methods
exports.execute = executeProcessor;
exports.terminate = terminateProcessor;