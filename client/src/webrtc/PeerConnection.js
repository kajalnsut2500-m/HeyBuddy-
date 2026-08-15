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
        this._remoteDescriptionSet = false
        this._pendingCandidates = []

        // Create the WebRTC connection object
        this.pc = new RTCPeerConnection(STUN_SERVERS)
        console.log(`[WR] PeerConnection created — me:${currentUserId} remote:${remoteUserId}`)

        this.pc.oniceconnectionstatechange = () =>
            console.log(`[WR] iceConnectionState → ${this.pc.iceConnectionState}`)
        this.pc.onconnectionstatechange = () =>
            console.log(`[WR] connectionState → ${this.pc.connectionState}`)
        this.pc.onsignalingstatechange = () =>
            console.log(`[WR] signalingState → ${this.pc.signalingState}`)

        // When browser finds a network path, send it to the other side
        this.pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log(`[WR] sending ICE candidate to ${this.remoteUserId}`)
                this.socket.emit('webrtc-ice', {
                    to: this.remoteUserId,
                    candidate: event.candidate
                })
            } else {
                console.log('[WR] ICE gathering complete')
            }
        }

        // Listen for incoming ICE candidates from the other side.
        // Queue any that arrive before setRemoteDescription is called.
        this.iceHandler = async ({ candidate }) => {
            if (!this._remoteDescriptionSet) {
                console.log('[WR] ICE candidate queued (no remote desc yet)')
                this._pendingCandidates.push(candidate)
                return
            }
            console.log('[WR] received ICE candidate')
            try {
                await this.pc.addIceCandidate(new RTCIceCandidate(candidate))
            } catch (err) {
                console.error('[WR] ICE candidate error:', err)
            }
        }
        this.socket.on('webrtc-ice', this.iceHandler)
    }

    async _flushPendingCandidates() {
        for (const candidate of this._pendingCandidates) {
            try {
                await this.pc.addIceCandidate(new RTCIceCandidate(candidate))
            } catch (err) {
                console.error('[WR] queued ICE candidate error:', err)
            }
        }
        this._pendingCandidates = []
    }

    // SENDER calls this to initiate the connection
    async createOffer() {
        console.log('[WR] SENDER: creating DataChannel')
        // Sender creates the Data Channel
        this.dataChannel = this.pc.createDataChannel('fileTransfer')
        this.dataChannel.binaryType = 'arraybuffer'
        this.dataChannel.bufferedAmountLowThreshold = LOW_WATERMARK
        this.dataChannel.onmessage = (e) => this.onDataReceived(e.data)
        this.dataChannel.onopen = () => {
            console.log('[WR] SENDER: DataChannel open — readyState=', this.dataChannel.readyState, 'protocol=', this.dataChannel.protocol, 'bufferedAmount=', this.dataChannel.bufferedAmount)
            if (this.onOpen) this.onOpen()
        }
        this.dataChannel.onclose = () =>
            console.log('[WR] SENDER: DataChannel closed')
        this.dataChannel.onerror = (e) =>
            console.error('[WR] SENDER: DataChannel error', e)

        const offer = await this.pc.createOffer()
        console.log('[WR] SENDER: offer created, setting local description')
        await this.pc.setLocalDescription(offer)
        console.log('[WR] SENDER: emitting webrtc-offer to', this.remoteUserId)

        this.socket.emit('webrtc-offer', {
            to: this.remoteUserId,
            from: this.currentUserId,
            offer
        })
    }

    // RECEIVER calls this when it gets an offer
    async handleOffer(offer) {
        console.log('[WR] RECEIVER: handleOffer() entered')
        console.log('[WR] RECEIVER: signalingState before setRemoteDescription =', this.pc.signalingState)
        console.log('[WR] RECEIVER: iceConnectionState =', this.pc.iceConnectionState)

        // Must be assigned BEFORE setRemoteDescription: some browsers dispatch
        // ondatachannel as a microtask that can fire before the next JS line runs.
        this.pc.ondatachannel = (event) => {
            console.log('[WR] RECEIVER: ondatachannel fired — label=', event.channel.label)
            this.dataChannel = event.channel
            this.dataChannel.binaryType = 'arraybuffer'
            this.dataChannel.onmessage = (e) => {
                const isString = typeof e.data === 'string'
                console.log('[WR] RECEIVER: onmessage —', isString ? `signal: ${e.data}` : `binary chunk: ${e.data.byteLength} bytes`)
                this.onDataReceived(e.data)
            }
            this.dataChannel.onopen = () =>
                console.log('[WR] RECEIVER: DataChannel open — readyState=', this.dataChannel.readyState)
            this.dataChannel.onclose = () =>
                console.log('[WR] RECEIVER: DataChannel closed')
            this.dataChannel.onerror = (e) =>
                console.error('[WR] RECEIVER: DataChannel error', e)
        }

        try {
            await this.pc.setRemoteDescription(new RTCSessionDescription(offer))
            console.log('[WR] RECEIVER: setRemoteDescription SUCCESS, signalingState =', this.pc.signalingState)
        } catch (err) {
            console.error('[WR] RECEIVER: setRemoteDescription FAILED', err)
            return
        }

        this._remoteDescriptionSet = true
        await this._flushPendingCandidates()

        let answer
        try {
            answer = await this.pc.createAnswer()
            console.log('[WR] RECEIVER: createAnswer SUCCESS')
        } catch (err) {
            console.error('[WR] RECEIVER: createAnswer FAILED', err)
            return
        }

        try {
            await this.pc.setLocalDescription(answer)
            console.log('[WR] RECEIVER: setLocalDescription SUCCESS, signalingState =', this.pc.signalingState)
        } catch (err) {
            console.error('[WR] RECEIVER: setLocalDescription FAILED', err)
            return
        }

        console.log('[WR] RECEIVER: emitting webrtc-answer to', this.remoteUserId, '(socket connected=', this.socket.connected, ')')
        this.socket.emit('webrtc-answer', {
            to: this.remoteUserId,
            answer
        })
        console.log('[WR] RECEIVER: webrtc-answer emitted')
    }

    // Sender calls this when it gets the answer back
    async handleAnswer(answer) {
        console.log('[WR] SENDER: handleAnswer() entered, signalingState=', this.pc.signalingState)
        try {
            await this.pc.setRemoteDescription(new RTCSessionDescription(answer))
            console.log('[WR] SENDER: setRemoteDescription SUCCESS, signalingState=', this.pc.signalingState)
            console.log('[WR] SENDER: iceConnectionState=', this.pc.iceConnectionState)
            console.log('[WR] SENDER: connectionState=', this.pc.connectionState)
            this._remoteDescriptionSet = true
            await this._flushPendingCandidates()
        } catch (err) {
            console.error('[WR] SENDER: setRemoteDescription FAILED', err)
        }
    }

    // Send raw bytes through the Data Channel
    sendChunk(data) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            const isString = typeof data === 'string'
            console.log('[WR] SENDER: sendChunk —', isString ? `signal: ${data}` : `binary: ${data.byteLength} bytes, bufferedAmount=${this.dataChannel.bufferedAmount}`)
            this.dataChannel.send(data)
        } else {
            console.warn('[WR] SENDER: sendChunk SKIPPED — readyState=', this.dataChannel?.readyState)
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

    // Wait until the local send buffer is fully empty (bufferedAmount === 0).
    // Call this after the last chunk and before sending TRANSFER_DONE so the signal
    // cannot be sent while binary data is still sitting in the OS network stack.
    drainBuffer() {
        if (!this.dataChannel || this.dataChannel.bufferedAmount === 0) {
            return Promise.resolve()
        }
        return new Promise(resolve => {
            const prev = this.dataChannel.bufferedAmountLowThreshold
            this.dataChannel.bufferedAmountLowThreshold = 0
            this.dataChannel.addEventListener('bufferedamountlow', () => {
                this.dataChannel.bufferedAmountLowThreshold = prev
                resolve()
            }, { once: true })
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