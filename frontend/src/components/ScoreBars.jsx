import React from 'react'

const ScoreBars = ({ scores }) => {
  if (!scores) {
    return (
      <div className="score-bars">
        <h3>Readiness Scores</h3>
        <div className="no-data">No score data available</div>
      </div>
    )
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }

  const getReadinessLabel = (overallScore) => {
    if (overallScore >= 80) return 'High'
    if (overallScore >= 60) return 'Medium'
    return 'Low'
  }

  const ScoreBar = ({ label, score, weight }) => (
    <div className="score-item">
      <div className="score-header">
        <span className="score-label">{label}</span>
        <span className="score-value">{score}/100</span>
      </div>
      <div className="score-bar-container">
        <div 
          className="score-bar"
          style={{ 
            width: `${score}%`,
            backgroundColor: getScoreColor(score)
          }}
        ></div>
      </div>
      <div className="score-weight">Weight: {weight}</div>
    </div>
  )

  return (
    <div className="score-bars">
      <div className="overall-score">
        <div className="overall-value">
          <span className="score-number">{scores.overall}</span>
          <span className="score-label">Overall Readiness</span>
          <span className={`readiness-label ${getReadinessLabel(scores.overall).toLowerCase()}`}>
            {getReadinessLabel(scores.overall)}
          </span>
        </div>
        <div className="score-breakdown">
          <ScoreBar label="Data Quality" score={scores.data} weight="25%" />
          <ScoreBar label="Field Coverage" score={scores.coverage} weight="35%" />
          <ScoreBar label="Rule Compliance" score={scores.rules} weight="30%" />
          <ScoreBar label="System Posture" score={scores.posture} weight="10%" />
        </div>
      </div>
    </div>
  )
}

export default ScoreBars