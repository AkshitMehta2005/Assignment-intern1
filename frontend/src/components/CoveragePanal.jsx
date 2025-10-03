import React from 'react'

const CoveragePanel = ({ coverage }) => {
  if (!coverage) {
    return (
      <div className="coverage-panel">
        <h3>Field Coverage</h3>
        <div className="no-data">No coverage data available</div>
      </div>
    )
  }

  const totalFields = coverage.matched.length + coverage.close.length + coverage.missing.length

  return (
    <div className="coverage-panel">
      <h3>Field Coverage vs GETS Standard</h3>
      
      <div className="coverage-stats">
        <div className="stat matched">
          <span className="count">{coverage.matched.length}</span>
          <span className="label">Matched</span>
        </div>
        <div className="stat close">
          <span className="count">{coverage.close.length}</span>
          <span className="label">Close Match</span>
        </div>
        <div className="stat missing">
          <span className="count">{coverage.missing.length}</span>
          <span className="label">Missing</span>
        </div>
        <div className="stat total">
          <span className="count">{totalFields}</span>
          <span className="label">Total Fields</span>
        </div>
      </div>

      <div className="coverage-details">
        <div className="coverage-section">
          <h4>✅ Matched Fields</h4>
          <div className="field-list">
            {coverage.matched.map((field, index) => (
              <div key={index} className="field-item matched">
                {field}
              </div>
            ))}
            {coverage.matched.length === 0 && (
              <div className="no-fields">No exact matches found</div>
            )}
          </div>
        </div>

        <div className="coverage-section">
          <h4>⚠️ Close Matches</h4>
          <div className="field-list">
            {coverage.close.map((item, index) => (
              <div key={index} className="field-item close">
                <div className="field-pair">
                  <span className="target">{item.target}</span>
                  <span className="arrow">←</span>
                  <span className="candidate">{item.candidate}</span>
                </div>
                <div className="confidence">{(item.confidence * 100).toFixed(0)}% match</div>
              </div>
            ))}
            {coverage.close.length === 0 && (
              <div className="no-fields">No close matches found</div>
            )}
          </div>
        </div>

        <div className="coverage-section">
          <h4>❌ Missing Fields</h4>
          <div className="field-list">
            {coverage.missing.map((field, index) => (
              <div key={index} className="field-item missing">
                {field}
              </div>
            ))}
            {coverage.missing.length === 0 && (
              <div className="no-fields">All fields mapped! 🎉</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CoveragePanel