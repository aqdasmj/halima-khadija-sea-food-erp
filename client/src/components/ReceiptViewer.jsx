import React from 'react';
import { X, ExternalLink } from 'lucide-react';

export default function ReceiptViewer({ receiptUrl, onClose }) {
  if (!receiptUrl) return null;

  const fullUrl = receiptUrl.startsWith('http') ? receiptUrl : receiptUrl;
  const isPdf = receiptUrl.toLowerCase().endsWith('.pdf');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Receipt / Bill Photo (पावती / बिल फोटो)</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Uploaded local receipt document</span>
          </div>
          <button className="modal-close" onClick={onClose}><X size={24} /></button>
        </div>

        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          {isPdf ? (
            <iframe
              src={fullUrl}
              title="Receipt PDF"
              style={{ width: '100%', height: '500px', border: 'none', borderRadius: 'var(--radius-sm)' }}
            />
          ) : (
            <img
              src={fullUrl}
              alt="Uploaded Receipt"
              style={{ maxWidth: '100%', maxHeight: '550px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
            />
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
          >
            <ExternalLink size={14} /> Open in New Tab
          </a>
        </div>
      </div>
    </div>
  );
}
