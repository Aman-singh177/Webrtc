const socket = new WebSocket('ws://localhost:3000');
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
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
}

pc.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
}

pc.onicecandidate = (event) => {
    if(event.candidate){
        socket.send(JSON.stringify({ice : event.candidate}));
    }
}

socket.onmessage = async msg => {
    const data = JSON.parse(msg.data);

    if(data.offer){
        await pc.setRemoteDescription(data.offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.send(JSON.stringify({answer}));
    }
    if(data.answer){
        await pc.setRemoteDescription(data.answer);
    }
    if(data.ice){
        await pc.addIceCandidate(data.ice);
    }
};

document.getElementById('start').onclick = async () => {
    await startLocalStream();

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.send(JSON.stringify({offer}));
}