import React, { useState, useEffect } from 'react'
import TablePreview from './TablePreview.jsx'
import CoveragePanel from './CoveragePanal.jsx'
import ScoreBars from './ScoreBars.jsx'
import RuleFindings from './RuleFindings.jsx'

const ResultsStep = ({ uploadId, context, onAnalyzeComplete, onReset, loading, setLoading }) => {
  const [report, setReport] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (uploadId && !report) {
      analyzeData()
    }
  }, [uploadId])

  const analyzeData = async () => {
    setAnalyzing(true)
    setError('')
    
    try {
      const questionnaire = {
        webhooks: true,
        sandbox_env: true,
        retries: false
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uploadId,
          questionnaire
        })
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const result = await response.json()
      setReport(result)
      onAnalyzeComplete(result)
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const downloadReport = () => {
    if (!report) return
    
    const dataStr = JSON.stringify(report, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `e-invoicing-report-${report.reportId}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getShareableLink = () => {
    if (!report) return ''
    return `${window.location.origin}/api/report/${report.reportId}`
  }

  const copyShareableLink = async () => {
    const link = getShareableLink()
    try {
      await navigator.clipboard.writeText(link)
      alert('Shareable link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  if (analyzing) {
    return (
      <div className="step-content">
        <div className="loading-state">
          <h2>Analyzing Your Data</h2>
          <div className="spinner"></div>
          <p>Processing your invoice data and checking GETS compliance...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="step-content">
        <div className="error-state">
          <h2>Analysis Failed</h2>
          <p>{error}</p>
          <button onClick={analyzeData} className="btn-primary">
            Try Again
          </button>
          <button onClick={onReset} className="btn-secondary">
            Start Over
          </button>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="step-content">
        <div className="error-state">
          <h2>No Report Available</h2>
          <button onClick={onReset} className="btn-primary">
            Start Over
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="step-content">
      <div className="results-header">
        <h2>Analysis Results</h2>
        <div className="result-actions">
          <button onClick={downloadReport} className="btn-secondary">
            Download JSON Report
          </button>
          <button onClick={copyShareableLink} className="btn-secondary">
            Copy Shareable Link
          </button>
          <button onClick={onReset} className="btn-primary">
            Analyze New Data
          </button>
        </div>
      </div>

      <ScoreBars scores={report.scores} />

      <div className="results-grid">
        <div className="results-column">
          <CoveragePanel coverage={report.coverage} />
          <RuleFindings findings={report.ruleFindings} />
        </div>
        
        <div className="results-column">
          <TablePreview data={report.meta} />
          
          <div className="gaps-panel">
            <h3>Key Gaps & Issues</h3>
            <div className="gaps-list">
              {report.gaps.map((gap, index) => (
                <div key={index} className="gap-item">
                  {gap}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="meta-info">
        <h4>Analysis Details</h4>
        <div className="meta-grid">
          <div><strong>Report ID:</strong> {report.reportId}</div>
          <div><strong>Country:</strong> {report.meta.country}</div>
          <div><strong>ERP:</strong> {report.meta.erp}</div>
          <div><strong>Rows Analyzed:</strong> {report.meta.rowsParsed}</div>
          <div><strong>Database:</strong> {report.meta.db}</div>
        </div>
      </div>
    </div>
  )
}

export default ResultsStep