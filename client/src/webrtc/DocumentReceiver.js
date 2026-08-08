export class DocumentReceiver {
    constructor(onTransferStart, onPageReady, onTransferComplete) {
        this.onTransferStart = onTransferStart
        this.onPageReady = onPageReady
              // called when a page is assembled
        this.onTransferComplete = onTransferComplete
        this.pages = []
        this.currentPageChunks = []             // chunks collected so far
        this.currentPageMeta = null             // metadata for current page
        this.receivedChunks = 0
    }

    // Called every time a message arrives on the Data Channel
    handleMessage(data) {
        // String = JSON control signal
    if (typeof data === 'string') {
        try {
            const signal = JSON.parse(data)   // ✅
            this.handleSignal(signal)
        } catch (err) {
            console.error('Invalid signal received:', err)
        }
    } else {
        this.handleChunk(data)
    }

    }

    handleSignal(signal) {
        if (signal.type === 'TRANSFER_START') {
            // New transfer beginning — reset state
            this.pages = []
            this.onTransferStart(signal.filename, signal.totalPages)
        }

        if (signal.type === 'PAGE_BEGIN') {
            // New page starting — reset chunk collection
            this.currentPageMeta = signal
            this.currentPageChunks = []
            this.receivedChunks = 0
        }

        if (signal.type === 'PAGE_END') {
            // All chunks for this page have arrived — assemble and render
            const combined = this.assembleChunks()
            const blob = new Blob([combined], { type: 'image/jpeg' })
            const url = URL.createObjectURL(blob)

            // Fire callback — UI renders this page immediately
            this.onPageReady({
                pageNumber: signal.pageNumber,
                imageUrl: url,
                width: this.currentPageMeta.width,
                height: this.currentPageMeta.height
            })
        }

        if (signal.type === 'TRANSFER_DONE') {
            this.onTransferComplete()
        }
    }

    handleChunk(arrayBuffer) {
        this.currentPageChunks.push(arrayBuffer)
        this.receivedChunks++
    }

    assembleChunks() {
        // Measure total size
        const totalSize = this.currentPageChunks.reduce(
            (sum, chunk) => sum + chunk.byteLength, 0
        )
        // Combine all chunks into one ArrayBuffer
        const combined = new Uint8Array(totalSize)
        let offset = 0
        for (const chunk of this.currentPageChunks) {
            combined.set(new Uint8Array(chunk), offset)
            offset += chunk.byteLength
        }
        return combined.buffer
    }

}
