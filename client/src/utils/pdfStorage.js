const DB_NAME = 'heybuddy-pdfs'
const STORE   = 'pdfs'
const VERSION = 1

function openDb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, VERSION)
        req.onupgradeneeded = e => e.target.result.createObjectStore(STORE)
        req.onsuccess  = e => resolve(e.target.result)
        req.onerror    = e => reject(e.target.error)
    })
}

export async function savePdf(pdfId, blob) {
    const db = await openDb()
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).put(blob, pdfId)
        tx.oncomplete = () => resolve()
        tx.onerror    = e => reject(e.target.error)
    })
}

export async function getPdf(pdfId) {
    const db = await openDb()
    return new Promise((resolve, reject) => {
        const tx  = db.transaction(STORE, 'readonly')
        const req = tx.objectStore(STORE).get(pdfId)
        req.onsuccess = e => resolve(e.target.result ?? null)
        req.onerror   = e => reject(e.target.error)
    })
}
