'use strict';
const path = require('path');
const fs = require('fs');
const ToyReact = require('toy-react');
const ToyReactDOMServer = require('toy-react-dom/server');
const { App } = require('./components/App');

const express = require('express');
const app = express();

app.use(express.static(path.resolve(__dirname, 'public')));

app.get('*', (req, res) => {
  /** hydrateする前のhtml文字列 **/
  const content = ToyReactDOMServer.renderToString(<App />);
  // テンプレートファイルを読み込んで、<!-- app --> という文字列を content に置き換えている
  const template = fs.readFileSync(
    path.resolve(__dirname, 'public/app.html'),
    'utf-8',
  );
  const html = template.replace('<!-- app -->', content);

  // <!-- app --> が置き換わったhtmlを返す
  res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
});

app.listen(3001, () => {
  console.log('Start on http://localhost:3001');
});
