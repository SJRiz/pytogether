import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>PyTogether</h1>
      <div>
        <input type="text"/>
      </div>
    </>
  )
}

export default App
