import React, { Component, PropTypes } from 'react'
import { connect }        from 'react-redux'
import { defineMessages } from 'react-intl'
import styler             from 'react-styling'
import { Title, preload } from 'react-isomorphic-render'
import { FormattedDate }  from 'react-intl'
import { Form, Modal, Button } from 'react-responsive-ui'
import { parse as parse_stack_trace } from 'print-error'

import { get as get_log, connector } from '../redux/log'
import log_levels         from '../../../code/log levels'

import { messages as menu_messages } from '../components/menu'

import international      from '../international/internationalize'

export const messages = defineMessages
({
	entry_message:
	{
		id             : 'log.entry.message',
		description    : 'Log entry message text',
		defaultMessage : 'Message'
	},
	entry_date:
	{
		id             : 'log.entry.date',
		description    : 'Log entry date',
		defaultMessage : 'Date'
	},
	entry_service:
	{
		id             : 'log.entry.service',
		description    : 'Log entry source service',
		defaultMessage : 'Service'
	},
	show_stack_trace:
	{
		id             : 'log.entry.show_stack_trace',
		description    : 'Log entry show stack trace button',
		defaultMessage : 'More'
	},
	hide_stack_trace:
	{
		id             : 'log.entry.hide_stack_trace',
		description    : 'Log entry stack trace modal hide button',
		defaultMessage : 'Dismiss'
	}
})

@preload(({ dispatch }) => dispatch(get_log()))
@connect
(
	state =>
	({
		...connector(state.log)
	}),
	{ get_log }
)
@international
export default class Log extends Component
{
	state =
	{
		show_stack_trace: false
	}

	constructor()
	{
		super()

		this.render_log_entry = this.render_log_entry.bind(this)
		this.hide_stack_trace = this.hide_stack_trace.bind(this)
	}

	render()
	{
		const { log, translate } = this.props

		const markup =
		(
			<div>
				<Title>{ translate(menu_messages.log) }</Title>

				<section className="content">
					<table style={ style.log }>
						<thead>
							<tr>
								<th>pid</th>
								<th>hostname</th>
								<th>{ translate(messages.entry_service) }</th>
								<th>{ translate(messages.entry_date) }</th>
								<th>{ translate(messages.entry_message) }</th>
							</tr>
						</thead>

						<tbody>
							{ log.map(this.render_log_entry) }
						</tbody>
					</table>
				</section>

				{/* Error stack trace */}
				<Modal
					isOpen={ this.state.show_stack_trace }
					close={ this.hide_stack_trace }
					closeLabel={ translate(messages.hide_stack_trace) }>

					{ this.state.stack_trace && this.state.stack_trace.map((stack, stack_index) =>
					{
						const markup =
						(
							<div key={ stack_index } style={ style.stack_trace }>
								<h1 style={ style.stack_trace.stack.title }>
									{ stack.title }
								</h1>

								<ul style={ style.stack_trace.stack}>
									{ stack.lines.map((line, line_index) =>
									{
										const markup =
										(
											<li key={ line_index } style={ style.stack_trace.stack.line }>
												{ this.render_stack_trace_line(line) }
											</li>
										)

										return markup
									}) }
								</ul>
							</div>
						)

						return markup
					}) }
				</Modal>
			</div>
		)

		return markup
	}

	render_log_entry(entry, index)
	{
		const markup =
		(
			<tr key={index} style={style.log.entry[(log_levels[entry.level] || 'generic').toLowerCase()]}>
				<td>{entry.pid}</td>
				<td>{entry.hostname || entry.ip}</td>
				<td>{entry.name}</td>
				<td>
					<FormattedDate
						value={entry.time}
						year='numeric'
						month='long'
						day='numeric'
						weekday='long'
						hour='2-digit'
						minute='2-digit'
						second='2-digit'/>
				</td>
				<td>
					{entry.msg}

					{entry.err &&
						<span>
							{' '}
							<Button
								action={() => this.show_stack_trace(parse_stack_trace(entry.err.stack), entry.msg)}>
								{this.props.translate(messages.show_stack_trace)}
							</Button>
						</span>
					}
				</td>
			</tr>
		)

		return markup
	}

	render_stack_trace_line(line_info)
	{
		if (typeof line_info === 'string')
		{
			return line_info
		}

		let line = []

		if (line_info.file_path)
		{
			line.push(<span key="file-name" style={style.stack_trace.stack.line.file_name}>{line_info.file_name}</span>)
		}

		if (line_info.file_line_number)
		{
			line.push(<span key="line-number-colon" style={style.stack_trace.stack.line.colon}>:</span>)
			line.push(<span key="line-number" style={style.stack_trace.stack.line.file_line_number}>{line_info.file_line_number}</span>)
		}

		if (line_info.method_path)
		{
			if (line.length > 0)
			{
				line.push(<span key="method-path-spacer"> </span>)
			}

			line.push(<span key="method-path" style={style.stack_trace.stack.line.method_path}>{line_info.method_path}</span>)
		}

		if (line_info.file_path)
		{
			line.push(<div key="file-path" style={style.stack_trace.stack.line.file_path}>{line_info.file_path}</div>)
		}

		return <div>{line}</div>
	}

	show_stack_trace(stack_trace, error_message)
	{
		this.setState
		({
			show_stack_trace: true,
			stack_trace,
			error_message
		})
	}

	hide_stack_trace()
	{
		this.setState({ show_stack_trace: false })
	}
}

const style = styler
`
	log
		width : 100%

		entry
			&error
				background: #FFC9C9

			&warning
				background: #FFFBC9

			&generic

	stack_trace
		font-family : Monospace

		stack
			margin-left : 1.6em

			title
				color : #C44100

			line
				margin-bottom: 1.2em

				colon
					opacity : 0.5
				file_name
					font-weight : bold
				file_path
					opacity : 0.5
					margin-top: 0.2em
				method_path
					color       : #0091C2
					font-weight : bold
				file_line_number
`