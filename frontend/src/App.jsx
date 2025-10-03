import React, { useState } from 'react'
import Wizard from './components/Wizard'
import './styles/App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>E-Invoicing Readiness Analyzer</h1>
        <p>Check your invoice data compliance with GETS standard</p>
      </header>
      <main className="app-main">
        <Wizard />
      </main>
    </div>
  )
}

export default App