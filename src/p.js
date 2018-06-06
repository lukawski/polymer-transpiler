const { JSDOM } = require('jsdom');
const prettier = require('prettier');
const pretty = require('pretty');
const Polymer = require('./polymer-mock');
const createClass = require('./create-class');
const window = {};

const staticPropsCollection = ['is', 'template', 'observers', 'properties', 'template'];
const lifecycleMethodsCollection = {
	attached: 'connectedCallback',
	detached: 'disconnectedCallback',
	created: 'constructor',
	attributeChanged: 'attributeChangedCallback',
	ready: 'ready',
};

const createConfig = (classProps, template, behaviors, elToExtend) => {
	const staticProps = [];
	const lifecycleMethods = [];
	const methods = [];
	const lifecycleMethodsNames = Object.keys(lifecycleMethodsCollection);
	classProps.template = template;
	for (prop in classProps) {
		if (prop === undefined) continue;
		if (staticPropsCollection.indexOf(prop) !== -1) {
			if (prop === 'properties') {
				for (property in classProps[prop]) {
					if (classProps[prop][property].type) classProps[prop][property].type = classProps[prop][property].type.name;
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
			const newBody = `${newName === 'constructor' ? 'super()' : `super.${newName}()`}  ${oldBody.slice(oldBody.indexOf('{') + 1, oldBody.lastIndexOf('}'))}`;

			if (prop === 'ready') {
				const [ready] = lifecycleMethods.filter(method => method.name === 'ready');
				if (ready) {
					ready.content += oldBody.slice(oldBody.indexOf('{') + 1, oldBody.lastIndexOf('}'));
				} else {
					lifecycleMethods.push({
						name: newName,
						content: newBody,
					});
				};
				continue;
			}

			lifecycleMethods.push({
				name: newName,
				content: newBody,
			});
			continue;
		}

		if (prop === 'listeners') {
			const [ready] = lifecycleMethods.filter(method => method.name === 'ready');
			if (ready) {
				let body = '';
				for (listener in classProps[prop]) {
					body += `this.addEventListener('${listener}', this.${classProps[prop][listener]});\n`;
				}
				ready.content += body;
			} else {
				let body = 'super.ready();';
				for (listener in classProps[prop]) {
					body += `this.addEventListener('${listener}', this.${classProps[prop][listener]});\n`;
				}

				lifecycleMethods.push({
					name: 'ready',
					content: body,
				});
			}
			continue;
		}

		const obm = classProps[prop].toString();
		methods.push({
			name: prop,
			content: obm.slice(obm.indexOf('('), obm.lastIndexOf('}') + 1),
		});
	}


	const name = classProps.is.split('-')
		.map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
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
		methods,
	};
}

const extract = (code, pattern) => {
	[match] = code.match(pattern);
	return match ? match.split(':').slice(1).join('') : '';
}

const extractBehaviors = (code) => {
	return code.match(/behaviors:\s?\[([^]+?)\]/) ? code.match(/behaviors:\s?\[([^]+?)\]/)[0]
		.split(':')
		.slice(1)
		.join('') : '';
}

const changePolymerImport = (head, dom) => {
	const imports = head.querySelectorAll('link');
	for (let i = 0; i < imports.length; i++) {
		if (imports[i].href.indexOf('polymer.html') !== -1) {
			imports[i].href = imports[i].href.replace('polymer.html', 'polymer-element.html');
			break;
		}
	}

	const newImport = dom.window.document.createElement('link');
	newImport.rel = 'import';
	newImport.href = '../../src/common/hub-cms-element.html'
	head.prepend(newImport);
}

const transpile = (code, elToExtend = 'Polymer.Element') => {
  const dom = new JSDOM(code);
	const script = dom.window.document.querySelector('script');
  if (!script || script.textContent.indexOf('Polymer({') === -1 || !script.textContent.length) return '';
  const [polymerCode] = script.textContent.match(/Polymer\({\s?[^]+}\)/);

  const template = dom.window.document.querySelector('template');
	const behaviors = extractBehaviors(polymerCode);
  const polymerConfig = eval(polymerCode.replace(/behaviors:\s?\[([^]+?)\],?/, ''));
  const prettyTempl = template ? pretty(template.innerHTML) : template;
  const newTemplate = createClass(createConfig(polymerConfig, prettyTempl, behaviors, elToExtend));
  if (template) dom.window.document.querySelector('dom-module').removeChild(template);
  changePolymerImport(dom.window.document.head, dom);
  const prettierTemplate = prettier.format(newTemplate, {
    useTabs: true,
    tabWidth: 4,
    singleQuote: true,
  });
  script.textContent = script.textContent.replace(/Polymer\({\s?[^]+}\);?/, prettierTemplate);
  const possibleTypes = ['Boolean', 'Date', 'Number', 'String', 'Array', 'Object']
  for (let i = 0; i < possibleTypes.length; i++) {
    const regex = new RegExp(`'${possibleTypes[i]}'`, 'g');
    script.textContent = script.textContent.replace(regex, possibleTypes[i]);
  }
  return pretty(dom.window.document.head.innerHTML + dom.window.document.body.innerHTML, {
    ocd: true
  }).replace('Polymer.html `', 'Polymer.html`');
}

module.exports = transpile;
