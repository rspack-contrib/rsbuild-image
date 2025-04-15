import './App.css';
import { Image } from '@rsbuild-image/react';
// import imgCrab from './crab.jpg?image';
import { useState } from 'react';
import imgCrab from './crab.png?image';

function Paragraph() {
  return (
    <p>
      The quick brown fox jumps over the lazy dog. The quick brown fox jumps
      over the lazy dog. The quick brown fox jumps over the lazy dog. The quick
      brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy
      dog. The quick brown fox jumps over the lazy dog. The quick brown fox
      jumps over the lazy dog. The quick brown fox jumps over the lazy dog. The
      quick brown fox jumps over the lazy dog.
    </p>
  );
}

const NETWORK_THROTTLING_URL =
  'https://developer.chrome.com/docs/devtools/network/reference?hl=en#throttling';

export default function App() {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div>
      <p className="tip">
        Tip: Use Chrome DevTools and{' '}
        <a href={NETWORK_THROTTLING_URL}>emulating the "3G" slow network</a> to
        compare the &lt;Image /&gt; with &lt;img /&gt;.
      </p>
      <div className="container">
        <div>
          <Paragraph />
          <div style={{ marginBottom: '10px' }}>
            <code>
              <span className="indicator" data-loaded={imageLoaded} />
              &lt;Image /&gt;
            </code>
          </div>
          <Image
            src={imgCrab}
            alt="crab"
            width={500}
            placeholder="blur"
            onLoad={() => setImageLoaded(true)}
          />
          <Paragraph />
        </div>
        <div>
          <Paragraph />
          <div style={{ marginBottom: '10px' }}>
            <code>
              <span className="indicator" data-loaded={imgLoaded} />
              &lt;img /&gt;
            </code>
          </div>
          <img
            src={imgCrab.url}
            alt="crab"
            width={500}
            onLoad={() => setImgLoaded(true)}
          />
          <Paragraph />
        </div>
      </div>
    </div>
  );
}
