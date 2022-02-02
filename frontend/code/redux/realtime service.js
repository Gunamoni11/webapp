import { Preload_started, Preload_finished, Preload_failed } from 'react-isomorphic-render'
import { action, create_handler } from 'react-isomorphic-render'
import settings from '../react-isomorphic-render-async'

const handler = create_handler(settings)

export const connected = action
({
	namespace: 'realtime service',
	event: 'connected',
	result: state => ({ ...state, connected: true })
},
handler)

export const disconnected = action
({
	namespace: 'realtime service',
	event: 'disconnected',
	result: state => ({ ...state, connected: false })
},
handler)

// This is the Redux reducer
export default handler.reducer()