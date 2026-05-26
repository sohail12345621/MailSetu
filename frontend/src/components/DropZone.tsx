import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileIcon } from 'lucide-react'

interface Props {
  files: File[]
  onChange: (files: File[]) => void
}

export default function DropZone({ files, onChange }: Props) {
  const onDrop = useCallback((accepted: File[]) => {
    onChange([...files, ...accepted])
  }, [files, onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const remove = (i: number) => onChange(files.filter((_, idx) => idx !== i))

  const fmt = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`

  return (
    <div>
      <div {...getRootProps()} className={`drop-zone ${isDragActive ? 'drag-over' : ''}`}>
        <input {...getInputProps()} />
        <Upload size={22} style={{ margin: '0 auto 8px', display: 'block' }} />
        <p style={{ fontSize: 14 }}>
          {isDragActive ? 'Drop files here…' : 'Drag & drop files, or click to select'}
        </p>
        <p style={{ fontSize: 12, marginTop: 4, color: 'var(--text-muted)' }}>PDF, DOC, XLS, PNG, ZIP — max 10MB each</p>
      </div>
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {files.map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', background: 'var(--bg-hover)',
              borderRadius: 8, border: '1px solid var(--border)',
            }}>
              <FileIcon size={15} color="var(--accent)" />
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{f.name}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmt(f.size)}</span>
              <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
