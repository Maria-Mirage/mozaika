import { MozaikaElementProps } from '@feds01/mozaika';
import { ImageSources, Photo, SourceSet } from '../types';
import styles from './Element.module.css';
import React, { useEffect, useState } from 'react';

/**
 * Function which is used to build an src and src set for an <img> element based
 * on metadata returned from the API service in the format of an Array of objects
 * describing the size of the image with the source url.
 *
 * @param {SourceSet} src - The set of image sources including height and an 'original' flag.
 * @return {ImageSources} - Returns an object with two parameters; 'src' which is the original source of the
 * image, and 'srcset' which is a string that combines all the provided source to form a srcset string
 * for an <img> element.
 */
export const buildSourceSet = (src: SourceSet): ImageSources => {
  return {
    src: src.original,
    srcset: src.set
      .map((item) => {
        return `${item.url} ${item.width}w`;
      })
      .join(', ')
  };
};

/**
 * Promises wrapper for loading in an image and determining the orientation of the
 * image. This will accept any 'loadable' image source and return the standardised
 * source and the sizeType of the image
 *
 * @param {Array<{}>} src Image source to be loaded.
 * @returns {Promise<String>} Image source (loaded) or error message if image loading fails.
 * */
const loadImage = (src: SourceSet): Promise<ImageSources> => {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve({ src: image.src, srcset: image.srcset });
    };

    image.onerror = () => {
      reject('Failed to load image from server.');
    };

    image.oncancel = () => {
      resolve({ src: '', srcset: '' });
    };

    // build srcset from provided metadata
    const imageSources = buildSourceSet(src);
    image.src = imageSources.src;
    image.srcset = imageSources.srcset;
  });
};

const ExplorerElement = React.memo(function GalleryElement({
  style,
  updateCallback,
  data
}: MozaikaElementProps<Photo, undefined>) {
  const [image, setImage] = useState<ImageSources | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    if (loaded) updateCallback();
  }, [loaded]);

  if (image === null && !error) {
    loadImage(data.source)
      .then((result) => {
        setImage(result);
      })
      .catch(() => {
        // If an error occurs during an attempted image load, we can simply use
        // the wire-frame to display a placeholder image.
        setError(true);
      });
  }

  return (
    <div
      className={
        styles['element'] + (loaded ? ' ' + styles['visible'] : '') + (selected ? ' ' + styles['selected'] : '')
      }
      style={style}
      onClick={() => setSelected(!selected)}
    >
      <img
        src={!error ? image?.src : require('../static/images/not-found.png')}
        {...(image?.srcset && { srcSet: image.srcset })}
        onLoad={() => {
          setLoaded(true);
        }}
        sizes={`(max-width:${style.width}px) 100vw, ${style.width}px`}
        alt={''}
      />
    </div>
  );
});

export default ExplorerElement;
