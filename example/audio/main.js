//NOTE: THIS EXAMPLE REQUIRED LIBVORBIS TO BE INSTALLED AND FFMPEG TO BE CONFIGURED WITH IT

var ffmpeg = require('../../src/basicFFmpeg.js'),
    util = require('util'),
    fs = require('fs');

//create input stream
var inputStream = fs.createReadStream('../../assets/inputSong.mp3');

//create output stream
var outputStream = fs.createWriteStream('./outputSong.ogg');

var processor = 
    ffmpeg.createProcessor({
        inputStream: inputStream //read from readable stream
      , outputStream: outputStream //write to writable stream
      , informInputAudioCodec: true //inputAudioCodec event will not be fired if this is not set to true
      , fireInfoEvents: true //info events will not be fired if this is not set to true
      , informProgress: true //progress events will not be fired if this is not set to true
      , niceness: 10 //set child process niceness to 10
      , timeout: 10 * 60 * 1000 //fire timeout event after 10 minutes, does not actually stop process
      , arguments: { //the arguments passed, no syntatic sugar here (ffmpeg can be used just like its documentation says)
            '-ab': '128k'
          , '-acodec': 'libvorbis'
        }
    })
    .on('info', function (infoLine) {
        util.log(infoLine);
    })
    .on('inputAudioCodec', function (codec) {
        util.debug('input audio codec is: ' + codec);
    })
    .on('success', function (retcode, signal) {
        util.debug('process finished successfully with retcode: ' + retcode + ', signal: ' + signal);
    })
    .on('failure', function (retcode, signal) {
        util.debug('process failure, retcode: ' + retcode + ', signal: ' + signal);
    })
    .on('progress', function (bytes) {
        util.debug('process event, bytes: ' + bytes);
    })
    .on('timeout', function (processor) {
        util.debug('timeout event fired, stopping process.');
        processor.terminate();
    })
    .execute();