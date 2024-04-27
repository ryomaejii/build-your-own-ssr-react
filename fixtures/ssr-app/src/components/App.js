'use strict';

require('../assets/styles/global.css');

const ToyReact = require('toy-react');

const styles = {
  wrapper: {
    maxWidth: '768px',
    width: '100%',
    height: '100%',
    margin: 'auto',
    background: 'mediumslateblue',
    display: 'flex',
    placeContent: 'center',
    placeItems: 'center',
  },
  header: {
    color: 'white',
    padding: '1rem',
    margin: 0,
  },
};

export const App = () => {
  // 乱数を生成
  const random = Math.random();

  return (
    <main style={styles.wrapper}>
      <header>
        {random > 0.5 ? (
          <h1 style={styles.header}>This is h1(with SSR)!</h1>
        ) : (
          <h1 style={styles.header}>This is h2(with SSR)!</h1>
        )}
      </header>
    </main>
  );
};
