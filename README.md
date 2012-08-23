[![build status](https://secure.travis-ci.org/tommedema/NodeBasicFFmpeg.png)](http://travis-ci.org/tommedema/NodeBasicFFmpeg)
Node Basic FFmpeg
==================

Basic FFmpeg wrapper __for Linux__, see examples. For now, mostly limited to Audio purposes, although it can also be used for video (not tested). __Requires ffmpeg and all dependent codecs to be installed__.

All input should be passed using a readable stream (input stream).

Much of this code comes from node-fluent-ffmpeg, created by Schaermu (https://github.com/schaermu/node-fluent-ffmpeg).

Full usage example (convert input stream to libvorbis codec and pipe to output stream, set niceness and timeout, inform input audio codec and listen to events). 
------------------

(see examples folder for complete version)

    var ffmpeg = require('basicFFmpeg'),
        util = require('util');
        
    var processor = 
        ffmpeg.createProcessor({
            inputStream: inputStream //read from readable stream
          , outputStream: outputStream //write to writable stream
          , emitInputAudioCodecEvent: true //inputAudioCodec event will not be fired if this is not set to true
          , emitInfoEvent: true //info events will not be fired if this is not set to true
          , emitProgressEvent: true //progress events will not be fired if this is not set to true
          , niceness: 10 //set child process niceness to 10
          , timeout: 10 * 60 * 1000 //fire timeout event after 10 minutes, does not actually stop process
          , arguments: { //the arguments passed, no syntatic sugar here (ffmpeg can be used just like its documentation says)
                '-ab': '128k'
              , '-acodec': 'libvorbis'
              , '-f': 'ogg'
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
            processor.terminate(); //note that this will still cause 'failure' to emit, since the process was not successful
        })
        .execute();
        
__Note 1:__ both input and output stream will be destroyed when the process terminates, fails or succeeds unless you set endInputStream and/or endOutputStream to false, respectively.
 
__Note 2:__ the reason that the 3 informative events will only emit if their booleans are set to true, is because it requires computational resources to parse this data from stderr. If all three are false, all ffmpeg output can simply be dropped. If informAudioCodec is true, output can be dropped as soon as the codec was found. The other two require constant parsing of ffmpeg output. However, NodeBasicFFmpeg does not store the entire output in memory, instead it parses line by line to reduce the memory footprint.
 
__Note 3:__ currently, due to a FFmpeg issue (https://ffmpeg.org/trac/ffmpeg/ticket/337), progress events will not fire.

__Note 4:__ inputStream is optional. If it is not provided, a writable input stream will be set as processor.options.inputStream which you can write to. When you are done, you must end the input stream, like: ```processor.options.inputStream.end()```. See the examples folder for an example.
 
Other FFmpeg Projects
----------------------
For your comparison, here is a list of other FFmpeg projects. Some are more excessive in their implementation, some have a different API and documentation while others store all ffmpeg output in memory. You can choose what best fits your preferences.
 
* node-fluent-ffmpeg (https://github.com/schaermu/node-fluent-ffmpeg, author: Schaermu)
* ffmpeg-node (https://github.com/xonecas/ffmpeg-node, author: xonecas)
* node-simple-ffmpeg (https://github.com/scopely/node-simple-ffmpeg, author: hyperlight)