Node Basic FFmpeg
==================

Basic FFmpeg wrapper __for Linux__, see examples. For now, mostly limited to Audio purposes, although it can also be used for video (not tested). __Requires ffmpeg and all dependent codecs to be installed__.

All input should be passed using a readable stream (input stream).

Much of this code comes from node-fluent-ffmpeg, created by Schaermu (https://github.com/schaermu/node-fluent-ffmpeg).

Full usage example (convert input stream to libvorbis codec and pipe to output stream, set niceness and timeout, inform input audio codec and listen to events). 
------------------

    var ffmpeg = require('basicFFmpeg'),
        util = require('util');
        
    var processor = 
        ffmpeg.createProcessor({
            inputStream: inputStream //read from readable stream
          , outputStream: outputStream //write to writable stream
          , niceness: 10 //set child process niceness to 10
          , timeout: 10 * 60 * 1000 //fire timeout event after 10 minutes, does not actually stop process
          , arguments: { //the arguments passed, no syntatic sugar here (ffmpeg can be used just like its documentation says)
                '-ab': '128k'
              , '-acodec': 'libvorbis'
            }
        })
        .on('inputAudioCodec', function (codec) {
            util.debug('input audio codec is: ' + codec);
        })
        .on('success', function (retcode) {
            util.debug('process finished with retcode: ' + retcode);
        })
        .on('failure', function (retcode, err) {
            util.debug('the following error occured: ' + err);
        })
        .on('progress', function (bytes, percentage) {
            util.debug('process event, bytes: ' + bytes + ', percentage: ' + percentage);
        })
        .on('timeout', function (processor) {
            util.debug('timeout event fired, stopping process.');
            processor.terminate();
        })
        .execute();