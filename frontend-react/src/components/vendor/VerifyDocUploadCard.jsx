import React from 'react';
import { FileText, BadgePercent, Shield, Upload, CheckCircle2, X } from 'lucide-react';

export default function VerifyDocUploadCard({ documents, onFileUpload, onFileRemove }) {
  const DOC_TYPES = [
    {
      id: 'license',
      title: 'Business Registration / License *',
      desc: 'Official certificate of company registration or trade permit',
      icon: FileText,
      color: 'pink',
      required: true,
    },
    {
      id: 'taxid',
      title: 'Tax ID / GST Identification *',
      desc: 'Federal EIN, VAT number, or tax registration certificate',
      icon: BadgePercent,
      color: 'blue',
      required: true,
    },
    {
      id: 'insurance',
      title: 'Commercial General Liability Insurance',
      desc: 'Proof of active public liability & property damage coverage (optional)',
      icon: Shield,
      color: 'green',
      required: false,
    },
  ];

  const handleInputChange = (e, key) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File exceeds maximum 5MB size limit.');
      e.target.value = '';
      return;
    }

    onFileUpload(key, file);
  };

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <div className="card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} className="text-pink" />
          <h3 style={{ margin: 0 }}>Required Verification Documents</h3>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Accepted formats: PDF, JPG, PNG · Max 5MB per document
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '6px 0' }}>
        {DOC_TYPES.map((doc) => {
          const uploadedFile = documents[doc.id];
          const isUploaded = Boolean(uploadedFile);
          const DocIcon = doc.icon;

          return (
            <div
              key={doc.id}
              className="doc-upload-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: isUploaded ? 'rgba(34,197,94,0.04)' : 'rgba(255,255,255,0.03)',
                border: isUploaded ? '1px solid rgba(34,197,94,0.3)' : '1px dashed var(--border)',
                borderRadius: '10px',
                padding: '16px 20px',
                transition: 'border-color 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: isUploaded ? 'rgba(34,197,94,0.15)' : 'rgba(233,30,140,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isUploaded ? '#22c55e' : 'var(--pink)',
                    flexShrink: 0,
                  }}
                >
                  {isUploaded ? <CheckCircle2 size={18} /> : <DocIcon size={18} />}
                </div>

                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {doc.title}
                  </div>
                  <div style={{ fontSize: '12px', color: isUploaded ? '#86efac' : 'var(--text-muted)', marginTop: '2px' }}>
                    {isUploaded
                      ? `Uploaded: ${uploadedFile.name || uploadedFile} (${uploadedFile.size ? (uploadedFile.size / 1024).toFixed(0) + ' KB' : 'Stored'})`
                      : doc.desc}
                  </div>
                </div>
              </div>

              <div>
                {isUploaded ? (
                  <button
                    type="button"
                    onClick={() => onFileRemove(doc.id)}
                    style={{
                      padding: '7px 12px',
                      background: 'rgba(239,68,68,0.12)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '6px',
                      color: '#fca5a5',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <X size={13} />
                    <span>Remove</span>
                  </button>
                ) : (
                  <label style={{ cursor: 'pointer', margin: 0 }}>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      style={{ display: 'none' }}
                      onChange={(e) => handleInputChange(e, doc.id)}
                    />
                    <span
                      style={{
                        padding: '8px 16px',
                        background: 'rgba(233,30,140,0.15)',
                        color: 'var(--pink)',
                        border: '1px solid rgba(233,30,140,0.3)',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Upload size={13} />
                      <span>Choose File</span>
                    </span>
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

