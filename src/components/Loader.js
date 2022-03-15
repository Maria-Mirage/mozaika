/**
 * Module description:   /Loader.js
 *
 * Created on 16/09/2019
 * @author Alexander. E. Fedotov
 * @email <alexander.fedotov.uk@gmail.com>
 */

import React from 'react';
import PropTypes from 'prop-types';
import './Loader.module.css';

const Loader = React.memo(function Loader({ strokeColour }) {
  return (
    <div style={{ width: '100%', display: 'block', padding: '2em 0', textAlign: 'center' }}>
      <svg
        viewBox='0 0 50 50'
        style={{
          animation: 'rotate 2s linear infinite',
          zIndex: 2,
          margin: 'auto',
          width: '50px',
          height: '50px'
        }}
      >
        <circle
          style={{
            stroke: strokeColour,
            strokeLinecap: 'round',
            animation: 'dash 1.5s ease-in-out infinite'
          }}
          className='path'
          cx='25'
          cy='25'
          r='20'
          fill='none'
          strokeWidth='5'
        />
      </svg>
    </div>
  );
});

Loader.propTypes = {
  strokeColour: PropTypes.string
};

export default Loader;
