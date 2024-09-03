const socket=io('/')
const videoGrid=document.getElementById('video-grid')
const scrollableContainer=document.getElementById('scrollable-container')
const messageForm=document.getElementById('messageForm')
const messageInput=document.getElementById('messageInput')
// creating canvas for whiteboard
const canvas=document.getElementById('canvas')
const clear_canvas=document.getElementById('clear-canvas')
// without 0.98 not working can't find out why
canvas.width=window.innerWidth
// canvas.height='100px'
// canvas.height=window.innerHeight
const context=canvas.getContext('2d')

// for screen share
var local_stream;
var screenStream;
var myPeer = null;
var currentPeer = null
var screenSharing = false

myPeer=new Peer(userId,{
    host:'/',
    port:'3001'
})
const myVideo=document.createElement('video')
myVideo.muted=true

const peers = {}

navigator.mediaDevices.getUserMedia({
    video:true,
    audio:true
}).then(stream => {
  local_stream=stream

    addVideoStream(myVideo,stream)

    myPeer.on('call', call => {
        call.answer(stream)
        console.log('get a call',userId)
        const video = document.createElement('video')
        call.on('stream', userVideoStream => {
          addVideoStream(video, userVideoStream)
        })
        currentPeer = call;
        console.log(currentPeer);
    })
    socket.on('user-connected', Id => {
        alert('new user connected')
        connectToNewUser(Id, stream)
    })
})

//my peer is came to the room

myPeer.on('open', Id => {
    socket.emit('join-room', ROOM_ID, Id)
})

// some another person is disconnected
socket.on('user-disconnected', Id => {
    if (peers[Id]) peers[Id].close()
})

// another person send a message
socket.on('new-chat',message=>{
  const newChat=document.createElement('div')
  newChat.className='right-chat-bubble'
  newChat.innerText=message
  scrollableContainer.append(newChat)
  console.log('new message arrived')
})
  
// a new user come connect to that user
function connectToNewUser(Id, stream) {
    const call = myPeer.call(Id, stream)
    console.log('calling to ',Id)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
      video.remove()
    })
    currentPeer = call;
    peers[Id] = call
  }
  

// add the stream into your video-frame
function addVideoStream(video,stream){
    video.srcObject=stream
    video.addEventListener('loadedmetadata',()=>{
        video.play()
    })
    videoGrid.append(video)
}

//send a chat message
messageForm.addEventListener('submit',e=>{
  e.preventDefault()
  const message=`${name}:: ` + messageInput.value
  
  const newChat=document.createElement('div')
  newChat.className='left-chat-bubble'
  newChat.innerText=message
  scrollableContainer.append(newChat)

  socket.emit('send-chat-message',ROOM_ID,message)
  messageInput.value=''
})

// whitboard creation code
let x;
let y;

let mouseDown=false;

window.onmousedown =(e)=>{
  socket.emit('mouse-down',ROOM_ID,e.clientX,e.clientY)
  context.beginPath()
  context.moveTo(e.clientX,e.clientY)
  mouseDown=true
}
window.onmouseup =(e)=>{
  socket.emit('mouse-up',ROOM_ID)
  mouseDown=false
}

window.onmousemove =(e)=>{
  if(mouseDown){
    x=e.clientX
    y=e.clientY
    socket.emit('drawing',ROOM_ID,x,y)
    context.lineTo(x,y)
    context.stroke()
  }
}

socket.on('mousedown',(x,y)=>{
  context.beginPath()
  context.moveTo(x,y)
  mouseDown=true
})
socket.on('mouseup',()=>{
  mouseDown=false
})
socket.on('draw',(x,y)=>{
  context.lineTo(x,y)
  context.stroke()
})

clear_canvas.addEventListener('click',(e)=>{
  context.clearRect(0, 0, canvas.width, canvas.height);
  socket.emit('clear-canvas')
})
socket.on('clearCanvas',()=>{
  context.clearRect(0, 0, canvas.width, canvas.height);
})

// start screen sharing
function startScreenShare() {
  if (screenSharing) {
      stopScreenSharing()
  }
  navigator.mediaDevices.getDisplayMedia({ video: true }).then((stream) => {
      screenStream = stream;
      let videoTrack = screenStream.getVideoTracks()[0];
      videoTrack.onended = () => {
          stopScreenSharing()
      }
      if (myPeer) {
        // console.log(currentPeer.peerConnection)
          let sender = currentPeer.peerConnection.getSenders().find(function (s) {
              return s.track.kind == videoTrack.kind;
          })
          sender.replaceTrack(videoTrack)
          screenSharing = true
      }
      console.log(screenStream)
  })
}
function stopScreenSharing() {
  if (!screenSharing) return;
  let videoTrack = local_stream.getVideoTracks()[0];
  if (myPeer) {
    // in  the call object(currentPeer) it have all peerConnection
    //and by peerConnection we can get senders 
    // and now we will replace our track
      let sender = currentPeer.peerConnection.getSenders().find(function (s) {
          return s.track.kind == videoTrack.kind;
      })
      sender.replaceTrack(videoTrack)
  }
  screenStream.getTracks().forEach(function (track) {
      track.stop();
  });
  screenSharing = false
}

// start screen recording 
function startScreenRecording() {
  navigator.mediaDevices.getDisplayMedia({ video: true,audio:true})
      .then(stream => {
          const mediaRecorder = new MediaRecorder(stream);
          const chunks = [];

          mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                  chunks.push(event.data);
              }
          };

          mediaRecorder.onstop = () => {
              const blob = new Blob(chunks, { type: 'video/webm' });
              const videoUrl = URL.createObjectURL(blob);

              // Create a download link
              const a = document.createElement('a');
              a.href = videoUrl;
              a.download = 'screen-recording.webm';
              a.click();

              // Clean up
              URL.revokeObjectURL(videoUrl);
          };

          mediaRecorder.start();

          setTimeout(() => {
              mediaRecorder.stop();
          }, 5000); // Stop recording after 5 seconds (adjust as needed)
      })
      .catch(error => {
          console.error('Error accessing screen:', error);
      });
}

