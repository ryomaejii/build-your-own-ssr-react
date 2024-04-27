'use strict';

function isEvent(key) {
  return key.startsWith('on');
}
function isStyle(key) {
  return key === 'style';
}
function isProperty(key) {
  return key !== 'children' && !isEvent(key) && !isStyle(key);
}

class ToyReactPartialRenderer {
  constructor(children, options) {
    this.stack = children;
    this.options = options;
    this.exhausted = false;
  }

  destroy() {
    if (!this.exhausted) {
      this.exhausted = true;
    }
  }

  read() {
    if (this.exhausted) {
      return null;
    }

    // elementはhydrateする前のhtml文字列
    // ex: <main ><header ><h1 >This is h1(with SSR)!</h1></header></main>
    const element = this.renderElement(this.stack);
    console.log(element);
    return element;
  }

  renderElement(element) {
    if (element.type === 'TEXT_ELEMENT') {
      return element.props.nodeValue;
    }

    if (element.type instanceof Function) {
      const component = element.type(element.props || {});
      const child = component.render ? component.render() : component;
      return this.renderElement(child);
    }

    const props = element.props || {};
    const attributes = Object.keys(props)
      .filter(isProperty)
      .map((key) => `${key}="${props[key]}"`)
      .join(' ');
    const children = (props.children || [])
      .map((child) => this.renderElement(child))
      .join('');

    return `<${element.type} ${attributes}>${children}</${element.type}>`;
  }
}

export default ToyReactPartialRenderer;
