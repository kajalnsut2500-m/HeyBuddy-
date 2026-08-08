import React from 'react'

const DocumentViewer = ({ pages, totalPages, filename }) => {
    // ✅ protected against division by zero and values over 100%
    const progress = totalPages > 0
        ? Math.min((pages.length / totalPages) * 100, 100)
        : 0

    // ✅ protected against negative length if state is ever inconsistent
    const pendingCount = Math.max(0, totalPages - pages.length)



    return (
        <div style={{ background: '#1e1e1e', padding: '16px', borderRadius: '8px' }}>
            <div style={{ color: '#fff', marginBottom: '12px', fontWeight: 'bold' }}>
                📄 {filename} — {pages.length} of {totalPages} pages received
            </div>

            {/* Progress bar */}
            <div style={{ background: '#333', borderRadius: '4px', marginBottom: '16px', height: '8px' }}>
                <div style={{
                    width: `${totalPages > 0 ? Math.min((pages.length / totalPages) * 100, 100) : 0}%`,
                    height: '8px',
                    background: '#4ade80',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                }} />
            </div>

            {/* Render arrived pages */}
            {pages.map(page => (
                <div key={page.pageNumber} style={{ marginBottom: '12px' }}>
                    <div style={{ color: '#888', fontSize: '11px', marginBottom: '4px' }}>
                        Page {page.pageNumber}
                    </div>
                    <img
                        src={page.imageUrl}
                        alt={`Page ${page.pageNumber}`}
                        onLoad={() => URL.revokeObjectURL(page.imageUrl)}

                        style={{ width: '100%', borderRadius: '4px', display: 'block' }}
                    />
                </div>
            ))}

            {/* Placeholder for pages still incoming */}
            {Array.from({ length: totalPages - pages.length }).map((_, i) => (
                <div key={`loading-${i}`} style={{
                    height: '200px',
                    background: '#2a2a2a',
                    borderRadius: '4px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#555'
                }}>
                    ⏳ Page {pages.length + i + 1} loading...
                </div>
            ))}
        </div>
    )
}

export default React.memo(DocumentViewer)