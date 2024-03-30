/**
 * src/components/Loader.js
 *
 * Module description: A simple filler loading animation for the Mozaika gallery.
 *
 * Created on 08/08/2023
 * @author Alexander. E. Fedotov
 * @email <alexander.fedotov.uk@gmail.com>
 */

import React from 'react';
import styles from './Loader.module.css';

export interface LoaderProps {
  strokeColour?: string;
}

const Loader = React.memo(function Loader({ strokeColour }: LoaderProps) {
  return (
    <div style={{ width: '100%', display: 'block', padding: '2em 0', textAlign: 'center' }}>
      <svg
        viewBox='0 0 50 50'
        style={{
          animation: `${styles['rotate']} 2s linear infinite`,
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
            animation: `${styles['dash']} 1.5s ease-in-out infinite`
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

export default Loader;
