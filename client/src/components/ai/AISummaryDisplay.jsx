// client/src/components/ai/AISummaryDisplay.jsx
import React from 'react';
import Swal from 'sweetalert2';

const AISummaryDisplay = ({ summary, onClose, isStale, lastGeneratedAt }) => {
    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(summary);
        Swal.fire({ icon: 'success', title: 'Copied!', text: 'Summary copied to clipboard!' });
    };

    return (
        <div className="ai-summary-box" style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', margin: '15px 0', backgroundColor: '#f9f9f9' }}>
            <h4>AI-Generated Summary {isStale && <span style={{ color: 'orange', fontSize: '0.8em', marginLeft: '5px' }}>(Outdated)</span>}</h4>
            {lastGeneratedAt && <p style={{ fontSize: '0.75em', color: '#888' }}>Last generated: {new Date(lastGeneratedAt).toLocaleString()}</p>}
            <p>{summary}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button onClick={handleCopyToClipboard} style={{ padding: '8px 12px', cursor: 'pointer', border: '1px solid #007bff', borderRadius: '5px', background: 'white', color: '#007bff' }}>Copy Summary</button>
                <button onClick={onClose} style={{ padding: '8px 12px', cursor: 'pointer', border: 'none', borderRadius: '5px', background: '#e0e0e0', color: '#333' }}>Close</button>
            </div>
        </div>
    );
};

export default AISummaryDisplay;