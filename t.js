class IconToggle extends Polymer.mixinBehaviors(['Siema', 'Elo'], HubElement) {
	static get is() {
		return 'icon-toggle';
	}

	static get properties() {
		return {
			pressed: {
				type: 'Boolean',
				notify: true,
				reflectToAttribute: true,
				value: false
			},
			toggleIcon: { type: 'String' }
		};
	}

	static get template() {
		return '\n\n      <style>\n        :host {\n          display: inline-block;\n        }\n        iron-icon {\n          fill: var(--icon-toggle-color, rgba(0,0,0,0));\n          stroke: var(--icon-toggle-outline-color, currentcolor);\n        }\n        :host([pressed]) iron-icon {\n          fill: var(--icon-toggle-pressed-color, currentcolor);\n        }\n      </style>\n\n      <!-- local DOM goes here -->\n      <iron-icon icon="[[toggleIcon]]">\n      </iron-icon>\n\n    ';
	}

	ready() {
		ready.super();
		console.log('!');
	}

	constructor() {
		super();
		var s = 32;
	}
}

customElements.define(IconToggle.is, IconToggle);
