import React, { useState } from 'react'
import ContextStep from './ContextStep.jsx'
import UploadStep from './UploadStep.jsx'
import ResultsStep from './ResultsStep.jsx'

const Wizard = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [context, setContext] = useState({ country: '', erp: '' })
  const [uploadId, setUploadId] = useState('')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  const steps = [
    { number: 1, title: 'Context' },
    { number: 2, title: 'Upload Data' },
    { number: 3, title: 'Results' }
  ]

  const handleContextSubmit = (contextData) => {
    setContext(contextData)
    setCurrentStep(2)
  }

  const handleUploadComplete = (newUploadId) => {
    setUploadId(newUploadId)
    setCurrentStep(3)
  }

  const handleAnalyzeComplete = (reportData) => {
    setReport(reportData)
  }

  const handleReset = () => {
    setCurrentStep(1)
    setContext({ country: '', erp: '' })
    setUploadId('')
    setReport(null)
  }

  return (
    <div className="wizard">
      <div className="wizard-header">
        <div className="step-indicator">
          {steps.map(step => (
            <div key={step.number} className={`step ${currentStep === step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}>
              <div className="step-number">{step.number}</div>
              <div className="step-title">{step.title}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="wizard-content">
        {currentStep === 1 && (
          <ContextStep 
            context={context}
            onSubmit={handleContextSubmit}
          />
        )}
        
        {currentStep === 2 && (
          <UploadStep
            context={context}
            onUploadComplete={handleUploadComplete}
            onBack={() => setCurrentStep(1)}
          />
        )}
        
        {currentStep === 3 && (
          <ResultsStep
            uploadId={uploadId}
            context={context}
            onAnalyzeComplete={handleAnalyzeComplete}
            onReset={handleReset}
            loading={loading}
            setLoading={setLoading}
          />
        )}
      </div>
    </div>
  )
}

export default Wizard