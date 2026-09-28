import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Keep mocked HTTP deterministic regardless of a developer's local API URL.
vi.stubEnv('VITE_API_BASE_URL', '/api/v1')

afterEach(() => { cleanup(); sessionStorage.clear(); localStorage.clear() })
