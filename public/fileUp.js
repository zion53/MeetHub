import SocketIO from 'socket.io-client';
import SocketIOFileClient from 'socket.io-file-client';

// var socket = io();
var socket = io('http://localhost:3000');
var uploader = new SocketIOFileClient(socket);
var form = document.getElementById('form');
 
uploader.on('start', function(fileInfo) {
    console.log('Start uploading', fileInfo);
});
uploader.on('stream', function(fileInfo) {
    console.log('Streaming... sent ' + fileInfo.sent + ' bytes.');
});
uploader.on('complete', function(fileInfo) {
    console.log('Upload Complete', fileInfo);
});
uploader.on('error', function(err) {
    console.log('Error!', err);
});
uploader.on('abort', function(fileInfo) {
    console.log('Aborted: ', fileInfo);
});
 
form.onsubmit = function(ev) {
    ev.preventDefault();
    
    var fileEl = document.getElementById('inputGroupFile01');
    var uploadIds = uploader.upload(fileEl, {
        data: { /* Arbitrary data... */ }
    });
 
    // setTimeout(function() {
        // uploader.abort(uploadIds[0]);
        // console.log(uploader.getUploadInfo());
    // }, 1000);
};
