import React from 'react';
import { default as BaseLoader } from './../Loader';
import debounce from '../../lib/debounce';
import { assert, expr, isDef, range } from '../../lib/utils';
import { Property } from 'csstype';

// Load in ResizeObserver API if it's not natively supported.
// @see See [https://caniuse.com/#feat=resizeobserver]
import { ResizeObserver } from '@juggle/resize-observer';
import { flushSync } from 'react-dom';

type RecomputeKind = 'full' | 'new' | 're-use';

export type MozaikaElementStyle = {
  /**
   * The visibility of the element. This is equivalent to the CSS visibility property.
   */
  visibility: Property.Visibility;

  /**
   * The width of the element.
   */
  width: number;

  /**
   * The height of the element. This is the height of the element as it is rendered in the DOM.
   */
  height?: number;

  /**
   * The top position of the element.
   */
  top: number;

  /**
   * The left position of the element.
   */
  left: number;
};

/**
 * Function that is invoked when a layout update occurs.
 */
export type LayoutFn = (update: { height: number; width: number; computedStyles: MozaikaElementStyle[] }) => void;

/**
 * The props that are passed to the Element component.
 */
export type MozaikaElementProps<T, U> = {
  /**
   * The index of the element in the gallery.
   */
  index: number;

  /** The data that for the element. */
  data: T;

  /** A internal callback used to update gallery sizes. */
  updateCallback: () => void;

  /** The computed styles for the element based on gallery layout. */
  style: React.CSSProperties;
} & (U extends undefined ? {} : { additionalProps: U });

/**
 * The stream is used to represent a gallery stream which is used to load
 * elements into the gallery. The stream has an accompanying key which can
 * be used to reset the stream to the beginning.
 */
export type MozaikaStream<T, K> = {
  /** The data of the stream. */
  data: T[];

  /** The key which can be used to reset the stream. */
  key: K;
};

export type MozaikaProps<T, U, K = string> = typeof Mozaika.defaultProps & {
  /** The data that is used to populate the items that are loaded into the gallery. */
  stream: MozaikaStream<T, K>;

  /** The Component/Function Component that is used as an item in the gallery. */
  Element: React.ComponentType<MozaikaElementProps<T, U>> | React.FunctionComponent<MozaikaElementProps<T, U>>;

  /** The 'id' attribute of the gallery container. */
  id?: string;

  /** Function used to get a unique key from element in order for re-rendering */
  getUniqueIdFromElement: (data: T) => string;

  /** Component to use when displaying a loader. */
  Loader?: React.ComponentType<any> | React.FunctionComponent<any>;

  /** Whether the gallery should display the `loading` state */
  loading: boolean;

  /**
   * Whether the maximum number of data has been reached or not. This implies that no more
   * elements can be loaded into the gallery.
   * */
  maxDataReached: boolean;

  /**
   * Any children that should be displayed when the gallery is empty or has
   * finished loading.
   */
  children?: React.ReactNode;

  /** Any styles that should be applied to the container of the gallery */
  styles?: React.CSSProperties;

  /** Function that is invoked to load the next batch of data. This function is only
   * used in stream mode. The function should return a boolean value denoting whether
   * there is more data to come after the present batch or not. Mozaika will attempt
   * to load more data the next batch if the function true, and will assume the end of
   * stream was reached otherwise.
   */
  onNextBatch?: () => void;

  /** Function callback that is invoked when a layout cycle is complete. The width, height, and computed
   * styles of elements are piped into callback. */
  onLayout?: LayoutFn;
} & (U extends undefined ? { ElementProps?: U } : { ElementProps: U });

interface MozaikaState {
  /**
   * The total number of elements that have been loaded into the gallery.
   */
  totalElements: number;

  /**
   * The computed styles of each element in the gallery. This is used to determine
   * the position of each element in the gallery.
   */
  computedStyles: MozaikaElementStyle[];

  /**
   * Whether the gallery is currently loading more elements or not.
   *  */
  loading: boolean;

  /**
   * The height of the gallery container.
   * */
  height: number;

  /**
   * Whether the maximum number of elements has been reached or not.
   * */
  allElementsViewed: boolean;
}

class Mozaika<T, U, K = string> extends React.Component<MozaikaProps<T, U, K>, MozaikaState> {
  /**
   * The gallery container. This is used to interact with the gallery DOM.
   */
  gallery: React.RefObject<HTMLDivElement>;

  /**
   * The width of the gallery container.
   */
  width: number = 0;

  /**
   * The number of columns currently in the gallery. This will never exceed
   * the `maxColumns` prop.
   */
  columns: number = 0;

  /** All of the loaded items that have been queued for loading. */
  loadedItems: Set<number> = new Set();

  /**
   * Whether the gallery is waiting on the next batch of elements to be loaded.
   *
   * **Note**: This specifically refers to loading an external batch, not data that
   * is stored within the gallery.
   */
  waitingOnNextBatch: boolean = false;

  /**
   * The IntersectionObserver instance that is used to determine if we should
   * attempt to load the next batch of elements.
   */
  observer?: IntersectionObserver;

  /**
   * The ResizeObserver instance that is used to determine if we should
   * attempt to load the next batch of elements.
   */
  resizeObserver?: ResizeObserver;

  /**
   * Whether the component is mounted or not.
   */
  _isMounted = false;

  /**
   * Create a new `Mozaika` instance.
   *
   * @param props
   */
  constructor(props: MozaikaProps<T, U, K>) {
    super(props);

    this.state = {
      totalElements: 0,
      computedStyles: [],
      loading: false,
      height: 0,
      allElementsViewed: false
    };

    this.gallery = React.createRef();

    this.getChildren = this.getChildren.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.computeMeasurements = this.computeMeasurements.bind(this);
    this.getNewColumnHeights = this.getNewColumnHeights.bind(this);
    this.maybeQueueNextBatch = this.maybeQueueNextBatch.bind(this);
    this.updateGalleryWith = this.updateGalleryWith.bind(this);
    this.reObserveElements = this.reObserveElements.bind(this);
    this.computeElementStyle = this.computeElementStyle.bind(this);
    this.handleLoadEvent = this.handleLoadEvent.bind(this);
  }

  static defaultProps = {
    /**
     * Whether the Y-scroll position should be automatically adjusted if the gallery
     * expands/shrinks when the window is resized.
     */
    adjustScroll: true,

    /** The number of items that is attempted to be added when the gallery attempts to append more elements
     * into the view. */
    loadBatchSize: 25,

    /** The maximum number of columns the gallery can use to display items. */
    maxColumns: 8,

    /** The width of the columns by default... */
    columnWidth: 300,

    /** The default assumed height of the child if it couldn't be computed */
    defaultChildHeight: 300,

    /**
     * The margin between each column. This is used to determine the width of each column.
     */
    columnMargin: 5,

    /**
     * The margin between each row. This is used to determine the height of each row.
     */
    rowMargin: 5,

    /** Whether the gallery has exhausted the entire data stream. */
    maxDataReached: false,

    /** Forces layout of items to be in the exact order given by the caller. No height optimisations will be
     * carried out if 'strict' order is specified. */
    strictOrder: false
  };

  /**
   * Get the top level children of the gallery.
   *
   * @returns The top level children of the gallery.
   */
  getChildren(): HTMLElement[] {
    if (this.gallery.current === null) return [];

    return Array.from(this.gallery.current.childNodes as NodeListOf<HTMLElement>);
  }

  getChild(index: number): HTMLElement | null {
    if (this.gallery.current === null) return null;
    return this.gallery.current.childNodes[index] as HTMLElement | null;
  }

  getNewColumnHeights(): number[] {
    const { columns, width } = this.computeMeasurements();
    this.columns = columns;
    this.width = width;

    return Array(columns).fill(0);
  }

  /**
   *  Perform initial setup for the gallery layout to properly work. We must do three things to start off the gallery.
   * 1. Initialise the IntersectionObserver and attach the handleIntersection() function. This is used to determine
   *    if the we should attempt to load the next batch of elements.
   *
   * 2. Attach an event listener for window re-size events so that the gallery layout can
   *   be re-calculated when the browser window is resized.
   *
   * 3. Perform an initial layout calculation for the first group of elements to be added to the gallery.
   */
  override componentDidMount() {
    this._isMounted = true;
    const { loadBatchSize, maxColumns } = this.props;

    assert(isDef(this.gallery.current), 'Gallery container is not defined');
    const { columns, width } = this.computeMeasurements();
    this.columns = columns;
    this.width = width;

    // Check that the 'loadBatchSize' is a positive integer.
    if (!Number.isInteger(loadBatchSize) || loadBatchSize < 0) {
      throw new Error(`loadBatchSize must be a positive integer, not ${loadBatchSize}`);
    }

    // Check that the 'maxColumns' is a positive integer.
    if (!Number.isInteger(maxColumns) || maxColumns < 0) {
      throw new Error(`maxColumns must be a positive integer, not ${maxColumns}`);
    }

    this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });

    this.resizeObserver = new ResizeObserver(this.handleResize);
    this.resizeObserver.observe(this.gallery.current);
  }

  /**
   * On the Component un-mount event, we'll set '_isMounted' to false preventing any future 'resize' update
   * event and disconnect the 'IntersectionObserver' and 'ResizeObserver' components by calling 'disconnect'.
   * */
  override componentWillUnmount() {
    this._isMounted = false;

    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  /**
   * On a component update, we need to check for several things. The first thing that we need to check
   * is if the 'data' prop has changed as this means a reset of the entire state.
   *
   * We also need to check if a new batch of items has been flagged for loading, this is done by checking if
   * the 'maxElementsReached' flag is set to true. If it has been set, we don't need to observe the current items
   * in the viewport. If not set, we'll select all the items that haven't already been observed by the IntersectionObserver.
   * */
  override componentDidUpdate(prevProps: MozaikaProps<T, U, K>, _prevState: MozaikaState, _snapshot: unknown) {
    if (prevProps.stream.key !== this.props.stream.key) {
      if (this.props.loading) {
        this.setState({ totalElements: 0, computedStyles: [], height: 0, allElementsViewed: false });
      } else {
        this.setState(this.updateGalleryWith(this.props.loadBatchSize));
      }

      return;
    }

    // If layout props change, we need to re-layout the gallery.
    if (this.layoutPropsChanged(prevProps)) {
      this.setState(this.updateGalleryWith(this.state.totalElements, 'visible', 'full'));
      return;
    }

    // We can kick-start off the process of loading elements.
    this.maybeQueueNextBatch();

    // if the gallery exists within the DOM, and this is after an initial render, (first render, or after elements
    // were add to the gallery) initiate an IntersectionObserver to monitor image view-ability
    if (!this.state.allElementsViewed) {
      this.reObserveElements();
    }
  }

  layoutPropsChanged(prevProps: MozaikaProps<T, U, K>): boolean {
    return (
      prevProps.columnWidth !== this.props.columnWidth ||
      prevProps.columnMargin !== this.props.columnMargin ||
      prevProps.rowMargin !== this.props.rowMargin ||
      prevProps.maxColumns !== this.props.maxColumns ||
      prevProps.strictOrder !== this.props.strictOrder ||
      prevProps.defaultChildHeight !== this.props.defaultChildHeight
    );
  }

  /**
   *
   * @returns The gallery width and column count.
   */
  computeMeasurements() {
    assert(isDef(this.gallery.current), 'Gallery ref is not defined');

    const width = this.gallery.current.clientWidth;
    const columns = Math.min(
      Math.round(this.gallery.current.clientWidth / this.props.columnWidth),
      this.props.maxColumns
    );

    return { columns, width };
  }

  reObserveElements() {
    // Avoid making observations whilst the data
    if (this.state.loading || this.props.loading) return;

    // Check if the element has a 'viewed' data key, if not add it to the observer &
    // add the data key to element, otherwise do nothing with element, we don't need to
    // do anything, if the key is already present as this  is a guarantee that it is being
    // observer or it has been viewed.
    this.getChildren().forEach((element) => {
      element.dataset['viewed'] = element.dataset['viewed'] || 'false';

      if (this.observer && element.dataset['viewed'] === 'false') {
        this.observer.observe(element);
      }
    });
  }

  handleLoadEvent(index: number) {
    this.loadedItems.delete(index);

    if (this.loadedItems.size === 0) {
      // @@Improve: we only want to re-compute the last loaded batch...
      this.setState(
        {
          ...this.updateGalleryWith(this.state.totalElements, 'visible', 'new'),
          loading: false
        },
        () => {
          if (this.props.onLayout)
            this.props.onLayout({
              height: this.state.height,
              width: this.width,
              computedStyles: this.state.computedStyles
            });
        }
      );
    }
  }

  maybeQueueNextBatch(viewed?: number) {
    const { onNextBatch, stream, maxDataReached, loadBatchSize } = this.props;
    const { totalElements } = this.state;
    const isLoading = this.props.loading || this.state.loading;

    // If we are loading, or we have no data yet then we can't do anything.
    if (isLoading || stream.data.length === 0) {
      return;
    }

    // Initial case: if we haven't added any data at all, then queue
    // an initial batch of data.
    if (totalElements === 0) {
      this.setState(this.updateGalleryWith(loadBatchSize));
      return;
    }

    if (!this.waitingOnNextBatch && !isDef(viewed)) {
      return;
    }

    if (!this.waitingOnNextBatch && viewed === stream.data.length) {
      if (maxDataReached || typeof onNextBatch !== 'function') {
        this.setState({ loading: false, allElementsViewed: true });
        return;
      }

      console.log('invoking onNextBatch()');
      this.waitingOnNextBatch = true;
      onNextBatch();
    } else {
      console.log('loading more data');
      this.waitingOnNextBatch = false;
      this.setState({
        ...this.updateGalleryWith(this.state.totalElements + this.props.loadBatchSize),
        allElementsViewed: false
      });
    }
  }

  // updateGalleryWithHeightMap(heightMap: number[]) {
  //   const columnHeights = this.getNewColumnHeights();
  //   const computedStyles: MozaikaElementStyle[] = [];

  //   for (const index of range(0, this.state.totalElements)) {
  //     computedStyles.push(this.computeElementStyle(index, columnHeights, 'visible', heightMap[index]));
  //   }

  //   // Now add the new computed height of the 'lowest' (largest top value) element to the total height
  //   // of the gallery, plus it's height and the bottom margin
  //   const height = Math.max(...columnHeights);

  //   // Call 'onLayout' function (if defined) to notify anyone who's listening for layout updates
  //   this.setState({ height, computedStyles, loading: false }, () => {
  //     if (this.props.onLayout) this.props.onLayout({ height, width: this.width, computedStyles });
  //   });
  // }

  /**
   * This function is used to update the gallery with a new set of data. This occurs when
   * new elements should be added to the gallery, or when the gallery is reset.
   *
   * @param start - The index at which we should re-compute items from.
   * @param end - The index at which we should stop re-computing items.
   * @param forceRecompute
   * @returns
   */
  updateGalleryWith(end: number, visibility: Property.Visibility = 'hidden', forceRecompute: RecomputeKind = 're-use') {
    const columnHeights = this.getNewColumnHeights();

    // We need to clamp the `end` value to the length of the data array.
    end = Math.min(end, this.props.stream.data.length);

    const length = this.state.computedStyles.length;
    const computedStyles = range(0, end).map((index) => {
      const evaluatedVisibility = expr(() => {
        if (
          forceRecompute === 'full' ||
          length <= index ||
          (forceRecompute === 'new' && index >= length - this.props.loadBatchSize)
        ) {
          return visibility;
        } else {
          return this.state.computedStyles[index]!.visibility;
        }
      });

      return this.computeElementStyle(index, columnHeights, evaluatedVisibility);
    });

    // If we're adding new elements into the mix, i.e. `elements` < `end`, then we need to
    // add all of the ids into the `loadedItems` set.
    if (this.state.totalElements < end) {
      assert(this.loadedItems.size === 0);
      this.loadedItems = new Set([...range(this.state.totalElements, end)]);
    }

    const totalElements = end;
    const height = Math.max(...columnHeights);

    return { computedStyles, totalElements, loading: true, height };
  }

  // This method is only used for the 'onresize' listener
  handleResize = (entries: ResizeObserverEntry[], _: ResizeObserver) => {
    debounce(() => {
      assert(isDef(entries[0]), 'No observed gallery');
      console.log('resize');

      if (this._isMounted && this.width !== entries[0].contentRect.width) {
        if (this.props.adjustScroll) {
          // Essentially we are working out the ratio between the old height and
          // the new height of the container and then applying it to the current
          // pageYOffset value. So when the container is resized, the user should
          // remain where they were in relative terms.
          const heightRatio = this.state.height / entries[0].contentRect.height;
          window.scrollTo(0, window.scrollY * heightRatio);
        }

        const { width, columns } = this.computeMeasurements();
        this.width = width;
        this.columns = columns;

        // In React 18, state updates in a ResizeObserver's callback are happening after the paint which causes flickering
        // when doing some visual updates in it. Using flushSync ensures that the dom will be painted after the states updates happen
        // Related issue - https://github.com/facebook/react/issues/24331
        flushSync(() => {
          this.setState({
            ...this.updateGalleryWith(this.state.totalElements, 'visible', 'full'),
            loading: false
          });
        });
      }
    }, 500)();
  };

  computeElementStyle(index: number, columnHeights: number[], visibility: Property.Visibility): MozaikaElementStyle {
    assert(this.gallery.current);
    const columns = columnHeights.length;
    const columnWidth = Math.round(this.gallery.current.clientWidth / columns);

    // Strict order enforces that items are rendered in the order they are supplied.
    const nextColumn = expr(() => {
      if (this.props.strictOrder) {
        return index % columns;
      } else {
        // Get the smallest column height, we will be adding the image to this column
        return columnHeights.indexOf(Math.min(...columnHeights));
      }
    });

    const child = this.getChild(index);
    const elementHeight = child?.clientHeight;
    const columnHeight = columnHeights[nextColumn] || 0;
    const top = columnHeight + (columnHeight > 0 ? this.props.rowMargin : 0);
    const isLeftMost = nextColumn === 0;
    const isEdge = isLeftMost || nextColumn === columns - 1;

    const elementStyle: MozaikaElementStyle = {
      visibility,
      width: isEdge ? columnWidth : columnWidth - this.props.columnMargin,
      top,
      height: elementHeight,
      left: nextColumn * columnWidth + (!isLeftMost ? this.props.columnMargin : 0)
    };

    // Let's update the column height now & the computed styles for this element
    columnHeights[nextColumn] = top + (elementHeight ?? 300);
    return elementStyle;
  }

  handleIntersection(entries: IntersectionObserverEntry[], observer: IntersectionObserver) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.setAttribute('data-viewed', 'true');
        observer.unobserve(entry.target);
      }
    });

    // Prevent any updates while we're loading in new items.
    if (this.state.loading) return;

    // check if this is the last photo element or all elements have been viewed
    // if more elements can be retrieved; append next batch, otherwise disconnect observer
    const viewed = this.getChildren().map((node) => node.dataset['viewed']);
    const bottomElements = viewed.slice(viewed.length - this.columns, viewed.length);

    // This is a shortcut to invoking if a nextBatch update if any of the bottom elements have
    // been viewed or were present within the viewport. If this condition passes, all previous element
    // 'viewed' values are set to true to avoid future fallthrough.
    // See https://github.com/Maria-Mirage/mozaika/issues/34 for more info.
    if (bottomElements.some((element) => element === 'true')) {
      // set every 'viewed' attribute of gallery children elements to true and attempt to load next
      // data batch.
      this.getChildren().forEach((child) => {
        child.setAttribute('data-viewed', 'true');
      });

      this.maybeQueueNextBatch(viewed.length);
    }
  }

  override render() {
    const {
      children,
      Element,
      Loader,
      styles,
      stream: { data }
    } = this.props;
    const { height, totalElements, computedStyles, allElementsViewed } = this.state;
    const isLoading = this.props.loading || this.state.loading;

    // @@Hack: this shouldn't really happen, but when the gallery is reset, the
    // totalElements might not be updated in time when a re-render occurs...
    const elements = Math.min(totalElements, data.length);

    return (
      <div {...(isDef(styles) && { style: styles })}>
        <div
          {...(this.props.id && { id: this.props.id })}
          style={{
            height: isLoading || height === 0 ? '100% !important' : height,
            width: '100%',
            position: 'relative',
            boxSizing: 'content-box',
            display: 'inline-block',
            paddingBottom: '5px'
          }}
          ref={this.gallery}
        >
          {range(0, elements).map((index) => {
            if (!isDef(data[index])) {
              throw new Error(
                "Mozaika tried to load a data element that doesn't exist. This could be that the supplied stream is no longer valid."
              );
            }

            return (
              // @ts-ignore
              <Element
                {...(isDef(this.props.ElementProps)
                  ? { additionalProps: this.props.ElementProps }
                  : { additionalProps: undefined })}
                index={index}
                key={this.props.getUniqueIdFromElement(data[index]!)}
                updateCallback={() => this.handleLoadEvent(index)}
                data={data[index]}
                style={computedStyles[index] || {}}
              />
            );
          })}
        </div>
        {isLoading ? (
          isDef(Loader) ? (
            // @ts-ignore
            <Loader />
          ) : (
            <BaseLoader />
          )
        ) : (
          <div style={{ display: allElementsViewed && !isLoading ? 'block' : 'none' }}>{children}</div>
        )}
      </div>
    );
  }
}

export default Mozaika;
