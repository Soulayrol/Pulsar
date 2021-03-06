import React, { useEffect, useState, useRef } from 'react'
import PropTypes from 'prop-types'

const Dropdown = ({ theme, primaryColor, value, options, onChange }) => {
  const node = useRef()
  const [open, setOpen] = useState(false)

  const handleClick = e => {
    if (node.current.contains(e.target)) {
      // inside click
      return
    }
    // outside click
    setOpen(false)
  }

  const handleChange = selectedValue => {
    onChange(selectedValue)
    setOpen(false)
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClick)

    return () => {
      document.removeEventListener('mousedown', handleClick)
    }
  }, [])

  return (
    <div ref={node} className={open ? 'dropdown is-active' : 'dropdown'}>
      <div className="dropdown-trigger">
        <div className={'button ' + theme} aria-haspopup="true" aria-controls="dropdown-menu" onClick={e => setOpen(!open)}>
          <h3>{value}</h3>
          <span className="icon is-small">
            <i className="las la-angle-down" aria-hidden="true"></i>
          </span>
        </div>
      </div>
      <div className="dropdown-menu" role="menu">
        <div className={'dropdown-content ' + theme}>
          {options.map((element, index) => (
            <a key={index} className={'dropdown-item ' + theme} onClick={e => handleChange(element)}>
              {element}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

Dropdown.propTypes = {
  theme: PropTypes.string.isRequired,
  primaryColor: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired
}

export default Dropdown
