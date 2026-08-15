export class DocumentReceiver {
    constructor(onTransferStart, onProgress, onTransferComplete) {
        this.onTransferStart = onTransferStart
        this.onProgress = onProgress
        this.onTransferComplete = onTransferComplete
        this.chunks = []
        this.totalBytes = 0
        this.receivedBytes = 0
        this.filename = ''
    }

    handleMessage(data) {
        if (typeof data === 'string') {
            try {
                this.handleSignal(JSON.parse(data))
            } catch (err) {
                console.error('Invalid signal received:', err)
            }
        } else {
            this.handleChunk(data)
        }
    }

    handleSignal(signal) {
        if (signal.type === 'TRANSFER_START') {
            this.chunks = []
            this.receivedBytes = 0
            this.totalBytes = signal.totalBytes
            this.filename = signal.filename
            this.onTransferStart(signal.filename, signal.totalBytes)
        }

        if (signal.type === 'TRANSFER_DONE') {
            const blob = new Blob(this.chunks, { type: 'application/pdf' })
            const url = URL.createObjectURL(blob)
            this.onTransferComplete(url, this.filename)
        }
    }

    handleChunk(arrayBuffer) {
        this.chunks.push(arrayBuffer)
        this.receivedBytes += arrayBuffer.byteLength
        this.onProgress(this.receivedBytes, this.totalBytes)
    }
}
