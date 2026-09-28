import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ManualLocation } from './ManualLocation'

let succeed: PositionCallback
let fail: PositionErrorCallback
const getCurrentPosition = vi.fn((success: PositionCallback, error: PositionErrorCallback) => { succeed = success; fail = error })
function Controls() {
  const location = useLocation()
  const navigate = useNavigate()
  return <><output aria-label="URL">{location.search}</output><button onClick={() => navigate('?q=changed')}>Navigate</button></>
}
function setup() {
  return render(<MemoryRouter initialEntries={['/artisans?q=repair&categoryId=plumber&page=3&radiusKm=12&latitude=1&longitude=2']}><ManualLocation /><Controls /></MemoryRouter>)
}
function position(latitude = 6.5, longitude = 3.4): GeolocationPosition {
  return { coords: { latitude, longitude, accuracy: 20, altitude: null, altitudeAccuracy: null, heading: null, speed: null, toJSON: () => ({}) }, timestamp: 1, toJSON: () => ({}) }
}
function start() { fireEvent.click(screen.getByRole('button', { name: 'Use my location' })) }
beforeEach(() => {
  getCurrentPosition.mockClear()
  vi.stubGlobal('isSecureContext', true)
  vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

it('requests only on activation, fills drafts, and applies with preserved filters and radius', async () => {
  setup()
  expect(getCurrentPosition).not.toHaveBeenCalled()
  start()
  expect(screen.getByRole('button', { name: 'Finding your location…' })).toBeDisabled()
  expect(getCurrentPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 })
  act(() => succeed(position(0, -180)))
  expect(screen.getByRole('textbox', { name: 'Latitude' })).toHaveValue('0')
  expect(screen.getByRole('textbox', { name: 'Longitude' })).toHaveValue('-180')
  expect(screen.getByLabelText('Search radius (km)')).toHaveValue('12')
  expect(screen.getByLabelText('URL')).toHaveTextContent('latitude=1&longitude=2')
  expect(screen.getByText(/Browser location filled in/)).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Apply location' }))
  await waitFor(() => expect(screen.getByLabelText('URL')).toHaveTextContent('?q=repair&categoryId=plumber&radiusKm=12&latitude=0&longitude=-180'))
  expect(screen.getByLabelText('URL')).not.toHaveTextContent('page=')
})

it.each([[1, /permission was denied/], [2, /could not determine/], [3, /timed out/]])('handles location error %s and supports retry/manual fallback', (code, message) => {
  setup(); start()
  act(() => fail({ code: Number(code), message: 'Private browser detail', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }))
  expect(screen.getByText(message)).toHaveTextContent('Enter coordinates manually')
  expect(screen.queryByText('Private browser detail')).not.toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'Latitude' })).toHaveValue('1')
  start()
  act(() => succeed(position()))
  expect(screen.getByRole('textbox', { name: 'Latitude' })).toHaveValue('6.5')
})

it.each(['insecure', 'unsupported'])('keeps manual entry available when %s', mode => {
  if (mode === 'insecure') vi.stubGlobal('isSecureContext', false)
  else vi.stubGlobal('navigator', {})
  setup(); start()
  expect(getCurrentPosition).not.toHaveBeenCalled()
  expect(screen.getByText(/Enter coordinates manually below/)).toBeVisible()
  expect(screen.getByRole('textbox', { name: 'Latitude' })).toBeEnabled()
})

it.each([NaN, Infinity, 91])('rejects invalid browser latitude %s', latitude => {
  setup(); start()
  act(() => succeed(position(latitude)))
  expect(screen.getByText(/invalid location/)).toBeVisible()
  expect(screen.getByRole('textbox', { name: 'Latitude' })).toHaveValue('1')
})

it('handles synchronous browser errors', () => {
  getCurrentPosition.mockImplementationOnce(() => { throw new Error('blocked') })
  setup(); start()
  expect(screen.getByText(/could not request your location/)).toBeVisible()
})

it.each(['edit', 'clear', 'cancel', 'navigate', 'unmount'])('ignores callbacks after %s', action => {
  const view = setup(); start()
  if (action === 'edit') fireEvent.change(screen.getByRole('textbox', { name: 'Latitude' }), { target: { value: '8' } })
  if (action === 'clear') fireEvent.click(screen.getByRole('button', { name: 'Clear location' }))
  if (action === 'cancel') fireEvent.click(screen.getByRole('button', { name: 'Cancel location request' }))
  if (action === 'navigate') fireEvent.click(screen.getByRole('button', { name: 'Navigate' }))
  if (action === 'unmount') view.unmount()
  act(() => succeed(position()))
  expect(screen.queryByText(/Browser location filled in/)).not.toBeInTheDocument()
  if (action !== 'unmount') expect(screen.getByRole('textbox', { name: 'Latitude' })).toHaveValue(action === 'edit' ? '8' : action === 'cancel' ? '1' : '')
})

it('ignores an older callback after retry starts', () => {
  setup(); start()
  const oldSuccess = succeed
  fireEvent.click(screen.getByRole('button', { name: 'Cancel location request' }))
  start()
  act(() => oldSuccess(position()))
  expect(screen.getByRole('button', { name: 'Finding your location…' })).toBeDisabled()
  act(() => succeed(position(9, 4)))
  expect(screen.getByRole('textbox', { name: 'Latitude' })).toHaveValue('9')
})
