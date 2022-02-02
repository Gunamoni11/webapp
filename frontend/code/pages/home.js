import React, { Component, PropTypes } from 'react'
import { Title }                       from 'react-isomorphic-render'
import { connect }                     from 'react-redux'
import styler                          from 'react-styling'
import { defineMessages }              from 'react-intl'

import international from '../international/internationalize'

import default_messages from '../components/messages'

const messages = defineMessages
({
	header:
	{
		id             : 'home.header',
		description    : 'Home page header',
		defaultMessage : 'A dawg'
	}
})

@international
export default class Home extends Component
{
	render()
	{
		const { translate } = this.props

		const husky = require('../../assets/images/husky.jpg')

		const markup =
		(
			<section className="content" style={ style.content }>
				<Title>{ translate(default_messages.title) }</Title>

				<h1 style={ style.header }>
					{ translate(messages.header) }
				</h1>

				<img src={ husky } style={ style.image }/>
			</section>
		)

		return markup
	}
}

const style = styler
`
	content
		padding: 1em

	header
		text-align: center

	image
		display: block

		margin-left  : auto
		margin-right : auto

		border-width : 1px
		border-style : solid
		border-color : #7f7f7f

		border-radius : 0.5em
`