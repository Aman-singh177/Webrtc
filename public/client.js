const socket = new WebSocket(
    location.protocol === "https:"
      ? "wss://" + location.host
      : "ws://" + location.host
);
  
const pc = new RTCPeerConnection({
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ]
});

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;

async function startLocalStream(){
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream; 
    // Play this live media stream inside the video element Your camera video appears on the screen.
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
}

pc.ontrack = (event) => {
    console.log("🔥 Remote track received");
    remoteVideo.srcObject = event.streams[0];
}

pc.onicecandidate = (event) => {
    if(event.candidate){
        socket.send(JSON.stringify({ice : event.candidate}));
    }
}

socket.onmessage = async (msg) => {
    const data = JSON.parse(msg.data);

    if(data.offer){ // The other peer started the call
        await startLocalStream();
        await pc.setRemoteDescription(data.offer);//This is the offer from the other peer 
        //📌Remote = coming from the other user
        const answer = await pc.createAnswer();//Generates an SDP answer This says:“Okay, I accept your offer and here is my response”
        await pc.setLocalDescription(answer); // This is how I will send/receive media
        socket.send(JSON.stringify({answer})); // Sends the answer back to the original caller
    }
    if(data.answer){
        await pc.setRemoteDescription(data.answer);
    }
    if(data.ice && pc.remoteDescription) {
        await pc.addIceCandidate(data.ice);
    }
};

document.getElementById('start').onclick = async () => {
    await startLocalStream();

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.send(JSON.stringify({offer}));
}