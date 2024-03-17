import { useEffect, useState } from 'react';

import { Mozaika, MozaikaStream } from '@feds01/mozaika';
import ExplorerElement from './components/ExplorerElement';
import { Photo, PhotoResponse } from './types';
import { expr, isDef } from './uitls';

export const DEV_API = process.env['REACT_APP_PHOTO_API'] || '';

async function getData(theme: string | null, from: string | null): Promise<PhotoResponse> {
  const themeComponent = expr(() => {
    if (theme === null) return '';
    return `&theme=${encodeURIComponent(theme)}`;
  });

  return fetch(`${DEV_API}/photo?limit=100${themeComponent}` + (isDef(from) ? `&from=${from}` : ''))
    .then((response) => response.json())
    .then((response) => {
      if (!response.status) throw new Error('Failed to load data.');

      return response as PhotoResponse;
    })
    .catch((e) => {
      return { status: false, error: e };
    });
}

type StreamKey = { pos: 'start' } | { pos: 'end' } | { pos: 'middle'; key: string };

function streamKeyAsString(streamKey: StreamKey): string | null {
  if (streamKey.pos === 'middle') return streamKey.key;
  return null;
}

const App = () => {
  const [theme, setTheme] = useState<string | null>(null);
  const [stream, setStream] = useState<MozaikaStream<Photo, string>>({data: [], key: ''});
  const [loading, setLoading] = useState(false);
  const [streamKey, setStreamKey] = useState<StreamKey>({ pos: 'start' });
  const [sidebarWidth, setSidebarWidth] = useState(0);

  const loadMore = async (streamKey: StreamKey) => {
    if (streamKey.pos === 'end') return;

    setLoading(true);

    const key = streamKeyAsString(streamKey);
    const result = await getData(theme, key);

    if (result.status) {
      const { items, from } = result.data;

      const key: StreamKey = expr(() => {
        if (from === null) {
          return { pos: 'end' };
        } else {
          return { pos: 'middle', key: from };
        }
      });

      console.log('[batch] key=', key);
      setStreamKey(key);
      setStream((s) => ({ key: theme ?? '', data: [...s.data, ...items] }));
    } else {
      console.error(result.error);
      setStreamKey({ pos: 'end' });
    }

    setLoading(false);
  };

  useEffect(() => {
    // reset the stream key
    setStream({ key: theme ?? '', data: [] });
    loadMore({ pos: 'start' });
  }, [theme]);

  const toggleSidebar = () => {
    setSidebarWidth(sidebarWidth > 0 ? 0 : 240);
  };

  return (
    <div>
      <div className={'sidebar'} style={{ width: sidebarWidth, height: '100%' }}>
        sidebar
        <button onClick={() => setTheme('Winter')}>winter theme</button>
        <button onClick={() => setTheme('Summer')}>summer theme</button>
        <button onClick={() => setTheme(null)}>All</button>
      </div>
      <div className={'main'} style={{ width: `calc(100% - ${sidebarWidth})`, marginLeft: sidebarWidth }}>
        <button onClick={toggleSidebar}>open</button>
        <Mozaika<Photo, undefined>
          stream={stream}
          loading={loading}
          getUniqueIdFromElement={(element: Photo) => element.id}
          maxDataReached={streamKey.pos === 'end'}
          onNextBatch={() => loadMore(streamKey)}
          // onLayout={(update) => {
          //   console.log("I got an update!");
          //   console.log(update);
          // }}
          Element={ExplorerElement}
          // A div which is a red circle with radius 10px
          Loader={() => (
            <div
              style={{
                width: 20,
                height: 20,
                backgroundColor: 'red',
                borderRadius: '50%',
              }}
            />
          )}
        />
      </div>
    </div>
  );
};

export default App;
