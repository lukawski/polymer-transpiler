const jsdom = require('jsdom');
const prettier = require('prettier');
const fs = require('fs');
const { JSDOM } = jsdom;
const createClass = require('./create-class');
const sampleCode = `
  <link rel="import" href="../polymer/polymer.html">
  <link rel="import" href="../iron-icon/iron-icon.html">

  <dom-module id="icon-toggle">


    <template>

      <style>
        :host {
          display: inline-block;
        }
        iron-icon {
          fill: var(--icon-toggle-color, rgba(0,0,0,0));
          stroke: var(--icon-toggle-outline-color, currentcolor);
        }
        :host([pressed]) iron-icon {
          fill: var(--icon-toggle-pressed-color, currentcolor);
        }
      </style>

      <!-- local DOM goes here -->
      <iron-icon icon="[[toggleIcon]]">
      </iron-icon>

    </template>

    <script>
    Polymer({
      is: 'icon-toggle',
      behaviors: ['Siema', 'Elo'],
      properties: {
        pressed: {
          type: Boolean,
          notify: true,
          reflectToAttribute: true,
          value: false
        },
        toggleIcon: {
          type: String
        },
      },
      listeners: {
        "tap": "toggle",
      },
      ready: function() {
        console.log('!');
      },
      created: function() {
        var s = 32;
      },
      toggle: function() {
        this.pressed = !this.pressed;
      },
    });
    </script>

  </dom-module>
`;

const staticPropsCollection = ['is', 'template', 'observers', 'properties', 'template'];
const lifecycleMethodsCollection = {
  attached: 'connectedCallback',
  detached: 'disconnectedCallback',
  created: 'constructor',
  attributeChanged: 'attributeChangedCallback',
  ready: 'ready',
};
const elToExtend = 'HubElement';
const createConfig = (classProps, template, behaviors) => {
  const staticProps = [];
  const lifecycleMethods = [];
  const lifecycleMethodsNames = Object.keys(lifecycleMethodsCollection);
  classProps.template = template;
  for (prop in classProps) {
    if (staticPropsCollection.indexOf(prop) !== -1) {
      if (prop === 'properties') {
        for (property in classProps[prop]) {
          classProps[prop][property].type = classProps[prop][property].type.name;
        }
      }

      staticProps.push({
        name: prop,
        content: classProps[prop],
      });
      continue;
    }

    if (lifecycleMethodsNames.indexOf(prop) !== -1) {
      const oldBody = classProps[prop].toString();
      const newName = lifecycleMethodsCollection[prop];
      const newBody = `${newName === 'constructor' ? 'super()' : `${newName}.super()`}  ${oldBody.slice(oldBody.indexOf('{') + 1, oldBody.lastIndexOf('}'))}`;

      lifecycleMethods.push({
        name: newName,
        content: newBody,
      });
    }
  }


  const name = classProps.is.split('-')
    .map((word) => word.slice(0,1).toUpperCase() + word.slice(1))
    .join('');


  let base = [elToExtend];
  if (behaviors !== undefined && behaviors.length) {
    base = [...base, behaviors];
  }

  return {
    name,
    staticProps,
    base,
    lifecycleMethods,
  };
}

const Polymer = (polymerObj) => polymerObj;

const extractBehaviors = (code) => {
  return code.match(/behaviors:\s?\[([^]+)\]/)[0]
    .split(':')
    .slice(1)
    .join('');
}

const dom = new JSDOM(sampleCode);
const script = dom.window.document.querySelector('script');
const template = dom.window.document.querySelector('template');
const polymerConfig = eval(script.textContent);
// console.log(createClass(createConfig(polymerConfig, template, extractBehaviors(script))));
const newTemplate = createClass(createConfig(polymerConfig, template.innerHTML, extractBehaviors(script.textContent)));
dom.window.document.querySelector('dom-module').removeChild(template);
console.log(dom.window.document.querySelector('dom-module').innerHTML);
script.textContent = prettier.format(newTemplate, {
  useTabs: true,
  tabWidth: 4,
  singleQuote: true,
});
fs.writeFileSync('./opt.html', dom.window.document.body.innerHTML);
