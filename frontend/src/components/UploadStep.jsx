import React, { useState } from 'react'

const UploadStep = ({ context, onUploadComplete, onBack }) => {
  const [file, setFile] = useState(null)
  const [textData, setTextData] = useState('')
  const [uploadType, setUploadType] = useState('file')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  const handleTextChange = (e) => {
    setTextData(e.target.value)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      
      if (uploadType === 'file' && file) {
        formData.append('file', file)
      } else if (uploadType === 'text' && textData.trim()) {
        formData.append('text', textData)
      } else {
        setError(uploadType === 'file' ? 'Please select a file' : 'Please enter data')
        setLoading(false)
        return
      }

      // Add context data
      formData.append('country', context.country)
      formData.append('erp', context.erp)

      console.log('Uploading file...', file ? file.name : 'text data')

      // Use absolute URL for development
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Upload failed:', errorText)
        throw new Error(`Upload failed: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      console.log('Upload successful:', result)
      onUploadComplete(result.uploadId)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message || 'Upload failed. Please check if the backend server is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="step-content">
      <h2>Upload Invoice Data</h2>
      <p className="step-description">
        Upload a CSV or JSON file with your invoice data, or paste the data directly.
      </p>

      <div className="upload-options">
        <div className="option-tabs">
          <button
            type="button"
            className={`tab ${uploadType === 'file' ? 'active' : ''}`}
            onClick={() => setUploadType('file')}
          >
            Upload File
          </button>
          <button
            type="button"
            className={`tab ${uploadType === 'text' ? 'active' : ''}`}
            onClick={() => setUploadType('text')}
          >
            Paste Data
          </button>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          {uploadType === 'file' && (
            <div className="file-upload">
              <label className="file-input-label">
                Choose File
                <input
                  type="file"
                  accept=".csv,.json,text/csv,application/json"
                  onChange={handleFileChange}
                  className="file-input"
                  disabled={loading}
                />
              </label>
              <div className="file-info">
                {file && (
                  <div className="file-details">
                    <strong>Selected:</strong> {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>
            </div>
          )}

          {uploadType === 'text' && (
            <div className="text-upload">
              <textarea
                value={textData}
                onChange={handleTextChange}
                placeholder="Paste your CSV or JSON data here..."
                rows="10"
                className="text-input"
                disabled={loading}
              />
              <div className="format-hint">
                <strong>Supported formats:</strong> CSV headers or JSON array/object
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              onClick={onBack} 
              className="btn-secondary"
              disabled={loading}
            >
              Back
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading || (uploadType === 'file' && !file) || (uploadType === 'text' && !textData.trim())}
            >
              {loading ? 'Uploading...' : 'Upload & Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UploadStep