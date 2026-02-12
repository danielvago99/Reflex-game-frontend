import { Buffer } from 'buffer';

const globalWindow = window as Window & typeof globalThis & {
  Buffer: typeof Buffer;
  global: Window & typeof globalThis;
};

globalWindow.Buffer = Buffer;
globalWindow.global = globalWindow;

const bootstrap = async () => {
  const [{ StrictMode }, { createRoot }, { default: App }] = await Promise.all([
    import('react'),
    import('react-dom/client'),
    import('./App.tsx'),
    import('./index.css'),
  ]);

  const container = document.getElementById('root');

  if (container) {
    const root = createRoot(container);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }
};

void bootstrap();
