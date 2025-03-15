import React, { useState, useEffect } from 'react'

function App() {
  const [messege, setData] = useState([{}])
  
  useEffect(() => {
    fetch("/members").then(
        res => res.json()).then(
          data => {
            setData(data)
            console.log(data)
          }
        )
  }
  , [])

  return (
    <div>
      <h1>Kochamy Czarnych Ludzi</h1>
      <h2>Lista Czarnych Ludzi</h2>
      {(typeof messege.members === 'undefined') ? (
        <h3>Wczytywanie</h3>
      ):(
        messege.members.map((messege, i) => (
          <p key = {i}>{messege}</p>
        ))
      )}
    </div>
  )
}

export default App