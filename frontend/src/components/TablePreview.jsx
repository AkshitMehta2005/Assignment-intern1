import React from 'react'

const TablePreview = ({ data }) => {
  if (!data || !data.rowsParsed) {
    return (
      <div className="table-preview">
        <h3>Data Preview</h3>
        <div className="no-data">No data available for preview</div>
      </div>
    )
  }

  return (
    <div className="table-preview">
      <h3>Data Summary</h3>
      <div className="data-summary">
        <div className="summary-item">
          <span className="label">Rows Parsed:</span>
          <span className="value">{data.rowsParsed}</span>
        </div>
        <div className="summary-item">
          <span className="label">Total Lines:</span>
          <span className="value">{data.linesTotal}</span>
        </div>
        <div className="summary-item">
          <span className="label">Country:</span>
          <span className="value">{data.country}</span>
        </div>
        <div className="summary-item">
          <span className="label">ERP:</span>
          <span className="value">{data.erp}</span>
        </div>
      </div>
      <div className="preview-note">
        <em>Note: Full table preview would show first 20 rows with type badges</em>
      </div>
    </div>
  )
}

export default TablePreview