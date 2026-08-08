import * as pdfjsLib from 'pdfjs-dist'

// Use CDN URL — the local worker entry path doesn't exist in all pdfjs-dist versions
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const CHUNK_SIZE   = 64 * 1024  // 64KB — 4× bigger than before, far less loop overhead
const SCALE        = 1.2        // Was 1.5 — same readable quality, ~36% fewer pixels per page
const JPEG_QUALITY = 0.75       // Was 0.85 — smaller JPEG with no visible loss for reading

export class DocumentSplitter {
    async splitAndStream(file, peerConnection, onProgress) {
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
        const totalPages = pdf.numPages

        peerConnection.sendSignal({ type: 'TRANSFER_START', filename: file.name, totalPages })

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            const page = await pdf.getPage(pageNum)
            const viewport = page.getViewport({ scale: SCALE })

            const canvas = document.createElement('canvas')
            canvas.width  = viewport.width
            canvas.height = viewport.height
            await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise

            const blob = await new Promise(resolve =>
                canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
            )
            // Free canvas memory immediately
            canvas.width = 0
            canvas.height = 0

            const pageBuffer = await blob.arrayBuffer()
            const totalChunks = Math.ceil(pageBuffer.byteLength / CHUNK_SIZE)

            peerConnection.sendSignal({
                type: 'PAGE_BEGIN',
                pageNumber: pageNum,
                totalPages,
                totalChunks,
                width:  viewport.width,
                height: viewport.height
            })

            for (let i = 0; i < totalChunks; i++) {
                const chunk = pageBuffer.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
                peerConnection.sendChunk(chunk)
                // Event-driven backpressure — no polling, no artificial 50ms delays
                await peerConnection.waitForBuffer()
            }

            peerConnection.sendSignal({ type: 'PAGE_END', pageNumber: pageNum })
            onProgress(pageNum, totalPages)
        }

        peerConnection.sendSignal({ type: 'TRANSFER_DONE' })
    }
}