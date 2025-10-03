import React from 'react'

const RuleFindings = ({ findings }) => {
  if (!findings || findings.length === 0) {
    return (
      <div className="rule-findings">
        <h3>Rule Validation</h3>
        <div className="no-data">No rule validation data available</div>
      </div>
    )
  }

  const getRuleDescription = (rule) => {
    const descriptions = {
      TOTALS_BALANCE: 'Total amounts must balance: total_excl_vat + vat_amount = total_incl_vat',
      LINE_MATH: 'Line item calculations must be correct: qty * unit_price = line_total',
      DATE_ISO: 'Dates must be in ISO format (YYYY-MM-DD)',
      CURRENCY_ALLOWED: 'Currency must be one of: AED, SAR, MYR, USD',
      TRN_PRESENT: 'Both buyer and seller TRN must be present'
    }
    return descriptions[rule] || rule
  }

  const getFixTip = (finding) => {
    if (finding.ok) return null

    switch (finding.rule) {
      case 'TOTALS_BALANCE':
        return 'Check your total amount calculations'
      case 'LINE_MATH':
        return `Verify line ${finding.exampleLine} calculations: qty × unit_price should equal line_total`
      case 'DATE_ISO':
        return 'Use ISO date format: YYYY-MM-DD (e.g., 2025-01-31)'
      case 'CURRENCY_ALLOWED':
        return `Change currency "${finding.value}" to one of: AED, SAR, MYR, USD`
      case 'TRN_PRESENT':
        return 'Ensure both buyer.trn and seller.trn fields are populated'
      default:
        return 'Review field values and formatting'
    }
  }

  return (
    <div className="rule-findings">
      <h3>Rule Validation Results</h3>
      
      <div className="rules-list">
        {findings.map((finding, index) => (
          <div key={index} className={`rule-item ${finding.ok ? 'passed' : 'failed'}`}>
            <div className="rule-header">
              <div className="rule-status">
                {finding.ok ? '✅' : '❌'}
              </div>
              <div className="rule-name">{finding.rule}</div>
            </div>
            
            <div className="rule-description">
              {getRuleDescription(finding.rule)}
            </div>

            {!finding.ok && (
              <div className="rule-details">
                {finding.exampleLine && (
                  <div className="detail">
                    <strong>Example issue at line:</strong> {finding.exampleLine}
                  </div>
                )}
                {finding.value && (
                  <div className="detail">
                    <strong>Invalid value:</strong> {finding.value}
                  </div>
                )}
                {finding.expected && finding.got && (
                  <div className="detail">
                    <strong>Expected:</strong> {finding.expected} | <strong>Got:</strong> {finding.got}
                  </div>
                )}
                
                <div className="fix-tip">
                  💡 <strong>Fix:</strong> {getFixTip(finding)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rules-summary">
        <div className="summary-stats">
          Passed: {findings.filter(f => f.ok).length} / {findings.length}
        </div>
      </div>
    </div>
  )
}

export default RuleFindings