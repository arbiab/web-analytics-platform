import { useEffect, useState } from 'react'

export default function Notification({ message, type = 'success', onClose }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const colors = {
    success: { bg: 'rgba(0,212,170,0.12)', border: '#00d4aa', color: '#00d4aa', icon: '✅' },
    error:   { bg: 'rgba(255,107,107,0.12)', border: '#ff6b6b', color: '#ff6b6b', icon: '❌' },
    info:    { bg: 'rgba(108,99,255,0.12)', border: '#6c63ff', color: '#6c63ff', icon: 'ℹ️' },
  }
  const c = colors[type]

  return (
    <div style={{
      ...styles.toast,
      background: c.bg,
      border: `1px solid ${c.border}`,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 0.3s ease',
    }}>
      <span style={{ fontSize: '1.1rem' }}>{c.icon}</span>
      <span style={{ color: c.color, fontSize: '0.9rem', flex: 1 }}>{message}</span>
      <button style={styles.closeBtn} onClick={() => { setVisible(false); setTimeout(onClose, 300) }}>✕</button>
    </div>
  )
}

const styles = {
  toast:    { position: 'fixed', bottom: '24px', right: '24px', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', borderRadius: '10px', zIndex: 9999, minWidth: '280px', maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
  closeBtn: { background: 'none', border: 'none', color: '#7b7f96', cursor: 'pointer', fontSize: '0.9rem', padding: '2px' },
}