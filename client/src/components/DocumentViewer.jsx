import React from 'react'

const DocumentViewer = ({ pdfUrl, filename, bytesReceived, totalBytes, onClose }) => {
    const isComplete = !!pdfUrl
    const progress = totalBytes > 0 ? Math.min((bytesReceived / totalBytes) * 100, 100) : 0

    const handleDownload = () => {
        const a = document.createElement('a')
        a.href = pdfUrl
        a.download = filename || 'document.pdf'
        a.click()
    }

    return (
        <div style={{ background: '#1e1e1e', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', height: '100%',position:'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ color: '#fff', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    📄 {filename}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '12px',position: 'absolute',right:'8px',top:'8px' }}>
                    {isComplete && (
                        <button
                            onClick={handleDownload}
                            style={{
                                background: '#4ade80',
                                color: '#000',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 14px',
                                fontWeight: 'bold',
                                fontSize: '13px',
                                cursor: 'pointer'
                            }}
                        >
                            ⬇ Download PDF
                        </button>
                    )}
                    {onClose && (
                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                color: '#aaa',
                                border: '1px solid #555',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                fontSize: '14px',
                                cursor: 'pointer',
                                lineHeight: 1
                            }}
                            title="Close"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {!isComplete && (
                <>
                    <div style={{ color: '#aaa', fontSize: '13px', marginBottom: '8px' }}>
                        Receiving… {totalBytes > 0 ? `${Math.round(progress)}%` : ''}
                    </div>
                    <div style={{ background: '#333', borderRadius: '4px', height: '8px' }}>
                        <div style={{
                            width: `${progress}%`,
                            height: '8px',
                            background: '#4ade80',
                            borderRadius: '4px',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                </>
            )}

            {isComplete && (
                <iframe
                    src={pdfUrl}
                    title={filename}
                    style={{ flex: 1, border: 'none', borderRadius: '4px', minHeight: '500px', marginTop: '8px' }}
                />
            )}
        </div>
    )
}

export default React.memo(DocumentViewer)
