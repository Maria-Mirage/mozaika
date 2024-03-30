# mozaika

> A React component which organises an arbitrary number of elements into a neat grid.

[![NPM](https://img.shields.io/npm/v/@feds01/mozaika.svg)](https://www.npmjs.com/package/@feds01/mozaika) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save @feds01/mozaika
```

## Usage

```jsx
import React, { Component } from 'react';

import Mozaika from 'mozaika';
import ChildContainer from './../components/ChildContainer';

class Example extends Component {
  render() {
    const { data } = this.state;

    return <Mozaika data={data} ExplorerElement={ChildContainer} />;
  }
}
```

## Customise

Mozaika can be customised to a high level of degree via the component props:

| Name                 | Description                                                                                                                                                                                                                                                                                                                                                                  | Prop type      | Default Value        | Required                 |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | -------------------- | ------------------------ |
| `adjustScroll`       | Adjust the Y-scroll position when container/window gets resized                                                                                                                                                                                                                                                                                                              | `bool`         | `true`               | `false`                  |
| `backgroundColour`   | The background colour of the gallery                                                                                                                                                                                                                                                                                                                                         | `string`       | `#0f0f10`            | `false`                  |
| `children`           | Any content or React Sub-tree that is loaded after the all the content is loaded.                                                                                                                                                                                                                                                                                            | `any`          | N/A                  | `false`                  |
| `data`               | The data that is used to populate the items that are loaded into the gallery.                                                                                                                                                                                                                                                                                                | `[object]`     | N/A                  | `true`                   |
| `Element`            | The Component/Function Component that is used as an item in the gallery.                                                                                                                                                                                                                                                                                                     | `func\|object` | N/A                  | `true`                   |
| `ElementProps`       | Any props that should be passed to element objects when appending them into the view.                                                                                                                                                                                                                                                                                        | `object`       | N/A                  | `false`                  |
| `id`                 | The 'id' attribute of the gallery container.                                                                                                                                                                                                                                                                                                                                 | `string`       | N/A                  | `true`                   |
| `loadBatchSize`      | The number of items that is attempted to be added when the gallery attempts to append more elements<br> into the view.                                                                                                                                                                                                                                                       | `number`       | `15`                 | `false`                  |
| `loaderStrokeColour` | Colour of the provided loader                                                                                                                                                                                                                                                                                                                                                | `string`       | `hsl(0, 100%, 100%)` | `false`                  |
| `maxColumns`         | The maximum number of columns the gallery can use to display items.                                                                                                                                                                                                                                                                                                          | `number`       | `8`                  | `false`                  |
| `onNextBatch`        | Function that is invoked to load the next batch of data. This function is only<br>used in stream mode. The function should return a boolean vallue denoting whether<br>there is more data to come after the present batch or not. Mozaika will attempt<br>to load more data the next batch if the function true, and will assume the end of<br>stream was reached otherwise. | `func`         | N/A                  | `true` when `streamMode` |
| `onLayout`           | Function callback that is invoked when a layout cycle is complete. The width, height, and computed<br> styles of elements are piped into callback.                                                                                                                                                                                                                           | `func`         | N/A                  | `false`                  |
| `resetStreamKey`     | This key is used to reset a stream flow, if it changes at any point; Mozaika will assume that we begun<br>a new stream order                                                                                                                                                                                                                                                 | `any`          | `null`               | `false`                  |
| `streamMode`         | Flag to determine if we're expecting data to come in as a stream instead of a singular chunk                                                                                                                                                                                                                                                                                 | `bool`         | `false`              | `false`                  |
| `strictOrder`        | Forces layout of items to be in the exact order given by the caller. No height optimisations will be<br>carried out if 'strict' order is specified.                                                                                                                                                                                                                          | `bool`         | `false`              | `false`                  |

## License

MIT © [feds01](https://github.com/feds01)
