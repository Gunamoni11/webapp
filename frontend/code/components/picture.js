import React, { PropTypes, PureComponent } from 'react'
import ReactDOM from 'react-dom'
import classNames from 'classnames'

const transparent_pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

export default class Picture extends PureComponent
{
	static propTypes =
	{
		type          : PropTypes.string,
		maxWidth      : PropTypes.number,
		// defaultWidth  : PropTypes.number,
		frameless     : PropTypes.bool.isRequired,
		children      : PropTypes.node,
		pattern       : PropTypes.bool.isRequired,

		sizes : PropTypes.arrayOf(PropTypes.shape
		({
			// `width` is not required for vector graphics
			width : PropTypes.number,
			file  : PropTypes.string.isRequired
		}))
	}

	static defaultProps =
	{
		pattern : false,
		frameless : false
	}

	state = {}

	componentDidMount()
	{
		const { sizes } = this.props

		// When the DOM node has been mounted
		// its width in pixels is known
		// so an appropriate size can now be picked.
		if (sizes)
		{
			this.refresh_size(sizes)
		}

		this.unregister_picture = register_picture(this)
	}

	componentWillUnmount()
	{
		this.unregister_picture()
	}

	componentWillReceiveProps(next_props)
	{
		if (next_props.sizes !== this.props.sizes)
		{
			this.refresh_size(next_props.sizes, true)
		}
	}

	render()
	{
		let
		{
			pattern,
			frameless,
			style,
			className,
			children
		}
		= this.props

		if (pattern)
		{
			style =
			{
				...style,
				backgroundImage: `url(${ this.url() || transparent_pixel })`
			}
		}

		const markup =
		(
			<div
				ref={ ref => this.container = ref }
				style={ style }
				className={ classNames('picture',
				{
					'picture--pattern'   : pattern,
					'picture--frameless' : frameless
				},
				className) }>

				{ !pattern &&
					<img
						ref={ ref => this.picture = ref }
						src={ typeof window === 'undefined' ? transparent_pixel : (this.url() || transparent_pixel) }
						style={ styles.image }
						className="picture__image"/>
				}

				{ children }
			</div>
		)

		return markup
	}

	refresh_size(sizes, force)
	{
		const { size } = this.state
		const preferred_size = this.get_preferred_size(sizes)

		if (force ||
			!size ||
			(preferred_size && preferred_size.width > size.width))
		{
			this.setState({ size: preferred_size })
		}
	}

	container_height()
	{
		return ReactDOM.findDOMNode(this.container).offsetHeight
	}

	width()
	{
		return ReactDOM.findDOMNode(this.picture).offsetWidth
	}

	get_preferred_size(sizes)
	{
		const { maxWidth, pattern } = this.props

		if (!sizes)
		{
			return
		}

		let width

		if (!pattern)
		{
			width = this.width()
		}

		// If the picture size is height-driven
		// (e.g. poster profile background pattern, poster profile banner)
		// then calculate width from height.
		if (!width)
		{
			const aspect_ratio = sizes.last().width / sizes.last().height
			width = this.container_height() * aspect_ratio
		}

		return get_preferred_size(sizes, width, maxWidth)
	}

	url()
	{
		const { type } = this.props
		const { size } = this.state

		if (!size)
		{
			return
		}

		return url(size, type)
	}
}

export function url(size, type)
{
	let subpath = ''

	switch (type)
	{
		// Temporarily uploaded pictures (before saving them)
		case 'uploaded':
			subpath = `uploaded/`
			break

		case 'asset':
			return size.file
	}

	return `${_image_service_url_}/${subpath}${size.file}`
}

export function get_preferred_size(sizes, width, max_width)
{
	if (!width)
	{
		return sizes.first()
	}

	let device_pixel_ratio = 1

	if (typeof(window) !== 'undefined' && window.devicePixelRatio !== undefined)
	{
		device_pixel_ratio = window.devicePixelRatio
	}

	width *= device_pixel_ratio

	let previous_size
	for (let size of sizes)
	{
		if (size.width > max_width)
		{
			return previous_size || sizes.first()
		}

		if (size.width >= width)
		{
			return size
		}

		previous_size = size
	}

	return sizes.last()
}

const styles =
{
	image:
	{
		maxWidth     : '100%',
		maxHeight    : '100%',
		borderRadius : 'inherit'
	}
}

function register_picture(component)
{
	if (!get_pictures_controller())
	{
		create_pictures_controller()
	}

	get_pictures_controller().register(component)

	return () => unregister_picture(component)
}

function unregister_picture(component)
{
	get_pictures_controller().unregister(component)
}

function get_pictures_controller()
{
	return window._responsive_images
}

function create_pictures_controller()
{
	const images =
	{
		components : [],
		register(component)
		{
			this.components.push(component)
		},
		unregister(component)
		{
			this.components.remove(component)
		},
		on_resize()
		{
			if (this.debounce_timer)
			{
				clearTimeout(this.debounce_timer)
			}

			this.debounce_timer = setTimeout(this.resize, 500)
		},
		resize()
		{
			this.debounce_timer = undefined

			for (const component of this.components)
			{
				component.refresh_size()
			}
		},
		destroy()
		{
			for (const component of this.components)
			{
				this.unregister(component)
			}

			window.removeEventListener('resize', this.on_resize)
		}
	}

	images.resize    = images.resize.bind(images)
	images.on_resize = images.on_resize.bind(images)

	window.addEventListener('resize', images.on_resize)

	window._responsive_images = images
}