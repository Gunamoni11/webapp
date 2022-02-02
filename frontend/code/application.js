// The polyfill will emulate a full ES6 environment (for old browsers)
// (including generators, which means async/await)
import 'babel-polyfill'

import { render, websocket } from 'react-isomorphic-render'
import inject_tap_event_plugin from 'react-tap-event-plugin'

import language from '../../code/language'
import settings from './react-isomorphic-render'
import internationalize, { hot_reload_translation, load_translation } from './international/loader'
import set_up_realtime_service_connection from './realtime service'

// include these assets in webpack build (styles, images)

import react_responsive_ui from 'react-responsive-ui/style.css'

import html_assets from './html assets'

for (let asset of Object.keys(html_assets))
{
	html_assets[asset]()
}

// Needed for onTouchTap
// Can go away when react 1.0 release
// Check this repo:
// https://github.com/zilverline/react-tap-event-plugin
inject_tap_event_plugin()

// load the Intl polyfill and its locale data before rendering the application
internationalize().then(() =>
{
	// renders the webpage on the client side
	return render(settings,
	{
		// internationalization
		// (this is here solely for Webpack HMR in dev mode)
		translation: process.env.NODE_ENV !== 'production' && load_translation
	})
	.then(({ store, token, rerender }) =>
	{
		// Webpack Hot Module Replacement (hot reload)
		if (module.hot)
		{
			module.hot.accept('./react-isomorphic-render', () =>
			{
				store.hotReload(settings.reducer)
				rerender()
			})

			hot_reload_translation(rerender)
		}

		// Set up WebSocket connection
		websocket
		({
			...configuration.realtime_service.websocket,
			store,
			token
		})

		// Set up realtime service connection
		set_up_realtime_service_connection()
	})
})
.catch((error) => console.error(error))