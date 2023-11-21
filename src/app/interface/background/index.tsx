"use client"

import { useEffect, useRef, useState } from "react"
import Snowfall from "react-snowfall"

export function Background() {
  const [itsRainingFaces, makeItRain] = useState(false)
  const [nbFaces, setNbFaces] = useState(0)
  const nbFacesRef = useRef(0)

  const [sprite, setSprite] = useState<HTMLImageElement>()
  
  useEffect(() => {
    const newSprite = document.createElement('img')
    newSprite.src = "/images/sprite.png" // '/images/hf.png'
    setSprite(newSprite)
  }, [])

  // just to delay things a bit
  useEffect(() => {
    setTimeout(() => { makeItRain(true) }, 1000)
  }, [])

  // effect is more interesting if progressive
  useEffect(() => {
   let interval = setInterval(() => {
     // if (!itsRainingFaces) { return }
      if (nbFacesRef.current > 25) {
        clearInterval(interval)
      } else {
        setNbFaces(nbFacesRef.current += 1)
      }
    }, 1000)
  }, [])

  return (
    <>{itsRainingFaces && sprite 
      ? <Snowfall
        // Applied to the canvas element.

        style={{
          background: 'transparent',
          position: 'fixed',
          width: '100vw',
          height: '100vh',
          transitionProperty: "color",
          transitionDuration: "3000ms",
          opacity: 1,
        }}
        radius={[10, 40]}
        speed={[1, 2]}
        wind={[1, 3.0]}
        // Controls the number of snowflakes that are created (defaults to 150).
        snowflakeCount={nbFaces}
        images={[sprite]}
      />
      : null}
    </>
  )
}