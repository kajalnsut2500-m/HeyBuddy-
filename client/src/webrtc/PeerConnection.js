const STUN_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ]
}

// Send up to 256KB before pausing; resume once the channel drains below 64KB
const HIGH_WATERMARK = 256 * 1024
const LOW_WATERMARK  =  64 * 1024

export class PeerConnection {
    constructor(socket, currentUserId, remoteUserId, onDataReceived) {
        this.socket = socket
        this.currentUserId = currentUserId
        this.remoteUserId = remoteUserId
        this.onDataReceived = onDataReceived  // callback when data arrives
        this.onOpen = null          // ✅ initialized — Chats.js sets this before createOffer
        this.dataChannel = null

        // Create the WebRTC connection object
        this.pc = new RTCPeerConnection(STUN_SERVERS)


        // When browser finds a network path, send it to the other side
        this.pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('webrtc-ice', {
                    to: this.remoteUserId,
                    candidate: event.candidate
                })
            }
        }

        // Listen for incoming ICE candidates from the other side
        this.iceHandler = async ({ candidate }) => {
            try {
                await this.pc.addIceCandidate(new RTCIceCandidate(candidate))
            } catch (err) {
                console.error('ICE candidate error:', err)
            }
        }
        this.socket.on('webrtc-ice', this.iceHandler)

    }

    // SENDER calls this to initiate the connection
    async createOffer() {
        // Sender creates the Data Channel
        this.dataChannel = this.pc.createDataChannel('fileTransfer')
        this.dataChannel.binaryType = 'arraybuffer'
        this.dataChannel.bufferedAmountLowThreshold = LOW_WATERMARK
        this.dataChannel.onmessage = (e) => this.onDataReceived(e.data)
        this.dataChannel.onopen = () => {
            if (this.onOpen) this.onOpen()
        }

        const offer = await this.pc.createOffer()
        await this.pc.setLocalDescription(offer)

        this.socket.emit('webrtc-offer', {
            to: this.remoteUserId,
            from: this.currentUserId,
            offer
        })
    }

    // RECEIVER calls this when it gets an offer
    async handleOffer(offer) {
        await this.pc.setRemoteDescription(new RTCSessionDescription(offer))

        // Receiver gets the Data Channel from the sender
        this.pc.ondatachannel = (event) => {
            this.dataChannel = event.channel
            this.dataChannel.binaryType = 'arraybuffer'
            this.dataChannel.onmessage = (e) => this.onDataReceived(e.data)
        }

        const answer = await this.pc.createAnswer()
        await this.pc.setLocalDescription(answer)

        this.socket.emit('webrtc-answer', {
            to: this.remoteUserId,
            answer
        })
    }

    // Receiver calls this when it gets the answer back
    async handleAnswer(answer) {
        await this.pc.setRemoteDescription(new RTCSessionDescription(answer))
    }

    // Send raw bytes through the Data Channel
    sendChunk(data) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(data)
        }
    }

    // Send a control message (JSON as string)
    sendSignal(obj) {
        this.sendChunk(JSON.stringify(obj))
    }

    // Event-driven backpressure — resolves immediately if buffer is fine,
    // otherwise waits for the 'bufferedamountlow' event instead of polling every 50ms
    waitForBuffer() {
        if (!this.dataChannel || this.dataChannel.bufferedAmount <= HIGH_WATERMARK) {
            return Promise.resolve()
        }
        return new Promise(resolve => {
            this.dataChannel.addEventListener('bufferedamountlow', resolve, { once: true })
        })
    }

    getBufferedAmount() {
        return this.dataChannel ? this.dataChannel.bufferedAmount : 0
    }


    close() {
          this.socket.off('webrtc-ice', this.iceHandler)
        this.pc.close()
    }
}