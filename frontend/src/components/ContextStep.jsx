import React, { useState } from 'react'

const ContextStep = ({ context, onSubmit }) => {
  const [formData, setFormData] = useState({
    country: context.country || '',
    erp: context.erp || ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="step-content">
      <h2>Provide Context</h2>
      <p className="step-description">
        Tell us about your environment to help with the analysis.
      </p>
      
      <form onSubmit={handleSubmit} className="context-form">
        <div className="form-group">
          <label htmlFor="country">Country</label>
          <select
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            required
          >
            <option value="">Select Country</option>
            <option value="UAE">United Arab Emirates</option>
            <option value="KSA">Saudi Arabia</option>
            <option value="MY">Malaysia</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="erp">ERP System</label>
          <select
            id="erp"
            name="erp"
            value={formData.erp}
            onChange={handleChange}
            required
          >
            <option value="">Select ERP</option>
            <option value="SAP">SAP</option>
            <option value="Oracle">Oracle</option>
            <option value="Microsoft">Microsoft Dynamics</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Continue to Upload
          </button>
        </div>
      </form>
    </div>
  )
}

export default ContextStep