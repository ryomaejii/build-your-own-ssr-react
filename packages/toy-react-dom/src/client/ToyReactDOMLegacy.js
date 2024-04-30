'use strict';

import { flushSync } from 'toy-react-reconciler/src/ToyReactFiberReconciler';

const internals = {
  nextUnitOfWork: null,
  currentRoot: null,
  wipRoot: null,
  deletions: null,
  wipFiber: null,
  hookIndex: null,
};

export function render(element, container) {
  internals.wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: internals.currentRoot,
  };
  internals.deletions = [];
  internals.nextUnitOfWork = internals.wipRoot;

  flushSync(internals);
}

export function useStateImpl(initial) {
  const oldHook =
    internals.wipFiber.alternate &&
    internals.wipFiber.alternate.hooks &&
    internals.wipFiber.alternate.hooks[internals.hookIndex];
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = action(hook.state);
  });

  const setState = (action) => {
    hook.queue.push(action);
    internals.wipRoot = {
      dom: internals.currentRoot.dom,
      props: internals.currentRoot.props,
      alternate: internals.currentRoot,
    };
    internals.nextUnitOfWork = internals.wipRoot;
    internals.deletions = [];
  };

  internals.wipFiber.hooks.push(hook);
  internals.hookIndex++;
  return [hook.state, setState];
}

function isEvent(key) {
  return key.startsWith('on');
}
function isStyle(key) {
  return key === 'style';
}
function isChildren(key) {
  return key === 'children';
}
function isProperty(key) {
  return !isChildren() && !isEvent(key) && !isStyle(key);
}

export function hydrate(element, container) {
  const prevChildren = Array.from(container.childNodes);
  const nextChildren = Array.isArray(element) ? element : [element];

  nextChildren.forEach((nextChild, index) => {
    // prevChildはnextChildの前回の状態を保持している
    const prevChild = prevChildren[index];

    // nextChildに対応するprevChildが存在する場合
    if (prevChild) {
      if (nextChild.type === 'TEXT_ELEMENT') {
        // text elementの場合、prevChildのtextContentを更新する
        // textContentは、DOMのテキストノードの中身を取得するプロパティ
        prevChild.textContent = nextChild.props.nodeValue;
      }
      // nextChildが関数コンポーネントの場合
      else if (nextChild.type instanceof Function) {
        // <App />のように渡されているので、typeは関数となる
        const component = nextChild.type(nextChild.props);

        // renderを持っているのってどんな時 ?
        // 例えば、<App />のように関数コンポーネントを定義した場合、
        // renderを持っていないので、component.renderはundefinedとなる
        // 一方、classコンポーネントの場合、renderを持っているので、component.renderは関数となる
        const child = component.render ? component.render() : component;
        // 1つずつpropsを比較していく
        for (const prop in child.props) {
          // childrenは無視する
          if (isChildren(prop)) {
            continue;
          }
          if (isStyle(prop)) {
            // styleをprevChildに適用する
            const styles = Object.entries(child.props[prop]);
            styles.forEach(([key, value]) => {
              prevChild[prop][key] = value;
            });
          }
          if (isProperty(prop)) {
            // propertyをprevChildに適用する
            prevChild[prop] = nextChild.props[prop];
          }
          if (isEvent(prop)) {
            // eventをprevChildに適用する
            const eventType = prop.toLowerCase().substring(2);
            prevChild.addEventListener(eventType, nextChild.props[prop]);
          }
        }
        // 子要素を再帰的に処理する
        hydrate(child.props.children, prevChild);
      }
      // nextChildがDOM要素の場合
      else {
        // 子要素を再帰的に処理する
        hydrate(nextChild.props.children, prevChild);
        // 1つずつpropsを比較していく
        for (const prop in nextChild.props) {
          if (isChildren(prop)) {
            continue;
          }
          if (isStyle(prop)) {
            const styles = Object.entries(nextChild.props[prop]);
            styles.forEach(([key, value]) => {
              prevChild[prop][key] = value;
            });
          }
          if (isProperty(prop)) {
            prevChild[prop] = nextChild.props[prop];
          }
          if (isEvent(prop)) {
            const eventType = prop.toLowerCase().substring(2);
            prevChild.addEventListener(eventType, nextChild.props[prop]);
          }
        }
      }
    }
    // nextChildに対応するprevChildが存在しない場合
    else {
      // nextChildをDOMに追加する
      // この条件分岐より、クライアントとサーバーに差異が生じてた場合、クライアント側で差異を吸収する
      container.appendChild(createDom(nextChild));
    }
  });

  function createDom(element) {
    const dom =
      element.type === 'TEXT_ELEMENT'
        ? document.createTextNode(element.props.nodeValue)
        : document.createElement(element.type);
    Object.keys(element.props).forEach((key) => {
      if (isChildren(key)) {
        element.props[key].forEach((child) => {
          dom.appendChild(createDom(child));
        });
      }
      if (isStyle(key)) {
        dom.style[key] = element.props[key];
      }
      if (isProperty(key)) {
        dom[key] = element.props[key];
      }
      if (isEvent(key)) {
        const eventType = key.toLowerCase().substring(2);
        dom.addEventListener(eventType, dom.props[key]);
      }
    });
    return dom;
  }
}
