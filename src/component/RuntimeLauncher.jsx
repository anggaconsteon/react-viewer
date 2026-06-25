import { useState } from 'react'

import DriverRuntimeGallery2 from './DriverRuntimeGallery2.jsx'
import DriverRuntimeGallery from './DriverRuntimeGallery.jsx'
import VehicleRuntimeGallery from './VehicleRuntimeGallery.jsx'
import AdminRuntimeGallery2 from './AdminRuntimeGallery2.jsx'
import AdminRuntimeGallery from './AdminRuntimeGallery.jsx'
import AdminRuntimeFlow from './AdminRuntimeFlow.jsx'
import WorkerShowcase from '../App.jsx'

// Single entry point. Pick a gallery from the top bar instead of editing main.jsx.
// Add a new gallery: import it, then add one { id, label, Comp } row to the right category.
const CATEGORIES = [
  {
    group: 'Driver',
    color: '#2563eb',
    items: [
      { id: 'driver-2', label: 'Driver Runtime Gallery 2', Comp: DriverRuntimeGallery2 },
      { id: 'driver-1', label: 'Driver Runtime Gallery', Comp: DriverRuntimeGallery },
    ],
  },
  {
    group: 'Gudang',
    color: '#d97706',
    items: [
      { id: 'gudang-vehicle', label: 'Vehicle Runtime Gallery', Comp: VehicleRuntimeGallery },
    ],
  },
  {
    group: 'Admin',
    color: '#7c3aed',
    items: [
      { id: 'admin-2', label: 'Admin Runtime Gallery 2', Comp: AdminRuntimeGallery2 },
      { id: 'admin-1', label: 'Admin Runtime Gallery', Comp: AdminRuntimeGallery },
      { id: 'admin-flow', label: 'Admin Runtime Flow', Comp: AdminRuntimeFlow },
    ],
  },
  {
    group: 'Lain',
    color: '#0d9488',
    items: [
      { id: 'worker', label: 'Worker Live Card', Comp: WorkerShowcase },
    ],
  },
]

const ALL = CATEGORIES.flatMap((c) => c.items)
const STORAGE_KEY = 'runtimeLauncher.active'

export default function RuntimeLauncher() {
  const [activeId, setActiveId] = useState(
    () => localStorage.getItem(STORAGE_KEY) || ALL[0].id,
  )

  const active = ALL.find((i) => i.id === activeId) || ALL[0]
  const Active = active.Comp

  const pick = (id) => {
    setActiveId(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  return (
    <div>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 16,
          padding: '10px 16px',
          background: '#0f172a',
          borderBottom: '1px solid #1e293b',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {CATEGORIES.map((cat) => (
          <div key={cat.group} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                color: cat.color,
              }}
            >
              {cat.group}
            </span>
            {cat.items.map((item) => {
              const on = item.id === active.id
              return (
                <button
                  key={item.id}
                  onClick={() => pick(item.id)}
                  style={{
                    cursor: 'pointer',
                    border: `1px solid ${on ? cat.color : '#334155'}`,
                    background: on ? cat.color : 'transparent',
                    color: on ? '#fff' : '#cbd5e1',
                    borderRadius: 6,
                    padding: '5px 11px',
                    fontSize: 12,
                    fontWeight: on ? 600 : 500,
                  }}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        ))}
      </div>
      <Active />
    </div>
  )
}
