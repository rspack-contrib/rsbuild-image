import ReactDOMClient from 'react-dom/client';
import App from './App';

const container = document.querySelector('#root');
if (!container) throw new Error('Unable to mount React application');
ReactDOMClient.createRoot(container).render(<App />);
