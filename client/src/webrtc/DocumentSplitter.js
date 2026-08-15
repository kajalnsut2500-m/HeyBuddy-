const CHUNK_SIZE = 64 * 1024  // 64KB per chunk

export class DocumentSplitter {
    async splitAndStream(file, peerConnection, onProgress) {
        const arrayBuffer = await file.arrayBuffer()
        const totalBytes = arrayBuffer.byteLength
        const totalChunks = Math.ceil(totalBytes / CHUNK_SIZE)

        peerConnection.sendSignal({ type: 'TRANSFER_START', filename: file.name, totalBytes })

        for (let i = 0; i < totalChunks; i++) {
            const chunk = arrayBuffer.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
            peerConnection.sendChunk(chunk)
            await peerConnection.waitForBuffer()
            onProgress(i + 1, totalChunks)
        }

        await peerConnection.drainBuffer()
        peerConnection.sendSignal({ type: 'TRANSFER_DONE' })
    }
}
