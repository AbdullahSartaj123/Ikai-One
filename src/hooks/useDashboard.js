import { useState } from 'react'
export function usePersistentToggle(initial=false) {
  const [value,setValue] = useState(initial)
  return [value,()=>setValue(current=>!current),setValue]
}
// Backwards-compatible alias; the shared provider owns authentication state.
export { useAuth as useDemoSession } from '../context/AuthContext.jsx'
