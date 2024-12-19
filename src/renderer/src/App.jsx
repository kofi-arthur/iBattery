import './styles/all.css'
import './styles/index.css'
import styles from './styles/app.module.css'

import { useEffect, useState } from 'react'

import icon from './assets/icon.png'

function App() {
  const batteryAPI = navigator.getBattery()

  const [count, setCount] = useState(0)
  const [battery, setBattery] = useState({ level: 0, charging: false })

  useEffect(() => {
    const api = window.electronAPI

    batteryAPI.then((battery) => {
      setBattery({ level: Math.round(battery.level * 100), charging: battery.charging })

      battery.addEventListener('levelchange', () => {
        setBattery({ level: Math.round(battery.level * 100), charging: battery.charging })
        setCount(Math.round(battery.level * 100))
        if (api) {
          battery.charging &&
            Math.round(battery.level * 100) === 100 &&
            api.showNotification({
              body: 'Battery fully charged. Please unplug the charger.'
            })

          !battery.charging &&
            Math.round(battery.level * 100) < 30 &&
            api.showNotification({
              body: 'Battery low. Please plug in the charger.'
            })
        } else {
          console.log('Notification API not available')
        }
      })

      battery.addEventListener('chargingchange', () => {
        setBattery({ level: Math.round(battery.level * 100), charging: battery.charging })
        setCount(Math.round(battery.level * 100))
        if (api) {
          battery.charging &&
            Math.round(battery.level * 100) === 100 &&
            api.showNotification({
              body: 'Battery fully charged. Please unplug the charger.'
            })

          !battery.charging &&
            Math.round(battery.level * 100) < 30 &&
            api.showNotification({
              body: 'Battery low. Please plug in the charger.'
            })
        } else {
          console.log('Notification API not available')
        }
      })

      let current = 0
      const level = Math.round(battery.level * 100)
      const interval = setInterval(() => {
        current += 1 // Increment counter
        setCount(Math.min(current, level)) // Stop at batteryLevel
        if (current >= level) clearInterval(interval)
      }, 20) // Adjust speed of animation

      return () => clearInterval(interval)
    })
  }, [])

  // -------------------------------------------------------

  return (
    <>
      <h3 className={styles.title}>
        <img src={icon} />
      </h3>
      <div className={styles.batteryLevelContainer}>
        <div
          className={
            battery.charging && battery.level < 100
              ? styles.batteryCharging
              : battery.charging && battery.level === 100
                ? styles.batteryChargingFull
                : styles.batteryLevel
          }
          style={{
            borderColor:
              battery.charging && battery.level < 100
                ? 'var(--charging)'
                : battery.charging && battery.level === 100
                  ? 'var(--full)'
                  : !battery.charging && battery.level >= 60
                    ? 'var(--full)'
                    : !battery.charging && battery.level >= 30 && battery.level <= 60
                      ? 'var(--medium)'
                      : !battery.charging && battery.level < 30
                        ? 'var(--low)'
                        : 'var(--not-charging)'
          }}
        >
          <h1>{count}%</h1>
        </div>
      </div>
      <h2 className={styles.status}>
        {battery.charging && battery.level < 100
          ? 'Charging'
          : battery.charging && battery.level === 100
            ? 'Fully Charged'
            : !battery.charging && battery.level < 30
              ? 'Low Battery'
              : 'Charger Unplugged'}
      </h2>
      {battery.charging && (
        <>
          <div className={styles.bolt}>
            <i className="fas fa-bolt"></i>
          </div>
          <div className={styles.chargingIndicator}>
            <i className="fal fa-plug"></i>
          </div>
        </>
      )}
    </>
  )
}

export default App
