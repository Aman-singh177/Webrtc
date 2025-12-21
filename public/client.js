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
    console.log("🎥 Starting local stream");
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream; 
    // Play this live media stream inside the video element Your camera video appears on the screen.
    localStream.getTracks().forEach(track => { 
        console.log("➕ Adding track:", track.kind);
        pc.addTrack(track, localStream)
    });
}

// pc.ontrack = (event) => {
//     console.log("🔥 Remote track received");
//     remoteVideo.srcObject = event.streams[0];
//     remoteVideo.play().catch(err => {
//         console.error("Autoplay blocked:", err);
//     });
// }

pc.ontrack = (event) => {
    console.log("🔥 Remote track received");
    console.log("Streams:", event.streams);
    console.log("Tracks:", event.streams[0].getTracks());
  
    remoteVideo.srcObject = event.streams[0];
  
    setTimeout(() => {
      remoteVideo.muted = true; // TEMP: allow autoplay
      remoteVideo.play()
        .then(() => console.log("✅ Remote video playing"))
        .catch(err => console.error("❌ Play failed:", err));
    }, 500);
  };
  
  

pc.onicecandidate = (event) => {
    if(event.candidate){
        socket.send(JSON.stringify({ice : event.candidate}));
    }
}

socket.onmessage = async (msg) => {
    let data;

    if (msg.data instanceof Blob) {
        const text = await msg.data.text(); // ✅ convert Blob → string
        data = JSON.parse(text);
    } else {
        data = JSON.parse(msg.data);
    }

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
    if (data.ice) {
        if(pc.remoteDescription){
            await pc.addIceCandidate(data.ice);
        } else {
            console.log("⏳ ICE received before remote description");
        }
    }
};

document.getElementById('start').onclick = async () => {
    await startLocalStream();

    const offer = await pc.createOffer();
    console.log("📜 OFFER SDP:\n", offer.sdp);
    await pc.setLocalDescription(offer);
    socket.send(JSON.stringify({offer}));
}