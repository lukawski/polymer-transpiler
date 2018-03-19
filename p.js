const jsdom = require('jsdom');
const prettier = require('prettier');
const pretty = require('pretty');
const fs = require('fs');
const { JSDOM } = jsdom;
const createClass = require('./create-class');
const sampleCode = `
<link rel="import" href="../../../bower_components/polymer/polymer.html">
<link rel="import" href="../../../bower_components/app-route/app-route.html">
<link rel="import" href="../../../bower_components/app-layout/app-drawer/app-drawer.html">
<link rel="import" href="../../../bower_components/app-layout/app-drawer-layout/app-drawer-layout.html">


<link rel="import" href="../../../components/hub-cms-visual-composer/hub-cms-visual-composer.html">
<link rel="import" href="../../../components/hub-cms-menu-microsite-edit/hub-cms-menu-microsite-edit.html">
<link rel="import" href="../../../components/hub-cms-microsite-saver/hub-cms-microsite-saver.html">
<link rel="import" href="../../../components/hub-cms-microsite-data-provider/hub-cms-microsite-data-provider.html">
<link rel="import" href="../../../components/hub-cms-lock/hub-cms-lock.html">
<link rel="import" href="../../../components/hub-cms-read-only-bar/hub-cms-read-only-bar.html">
<link rel="import" href="../../../components/hub-cms-localize-behavior/hub-cms-localize-behavior.html">
<link rel="import" href="../../../components/hub-cms-microsite-layout-validator/hub-cms-microsite-layout-validator.html">
<link rel="import" href="../../../components/hub-cms-styles/popup.html">

<!--
Microsites composer view

Example:

    <hub-cms-microsite-edit-view></hub-cms-microsite-edit-view>

@demo demo/index.html
-->

<dom-module id="hub-cms-microsite-edit-view">

	<template>

		<style include="hub-cms-styles-popup"></style>

		<style>

			:host {
				@apply --layout-wrapper;
				--app-drawer-width: 3.75rem !important; /* leave this important here :) */
			}

			app-drawer {
				@apply --hub-elevation-5;
				z-index: 10;
				transition: width 0.2s;
				--app-drawer-content-container: {
					width: 100%;
					background: var(--cms-color-900);
				};
			}

			hub-cms-popup-share-link ::slotted( paper-dialog ){
				position: fixed;
				bottom: 3.75rem;
				left: 4.25rem;
				margin: 0;
			}

		</style>

		<app-route
			route="{{route}}"
			pattern="/edit/microsite/:id"
			data="{{routeData}}"
		></app-route>

		<hub-cms-microsite-layout-validator id="validator"></hub-cms-microsite-layout-validator>

		<hub-cms-microsite-data-provider microsite-id="[[micrositeId]]" on-data-loading="_onDataLoading" on-data-ready="_dataReady"></hub-cms-microsite-data-provider>

		<hub-cms-lock id="cmsLock" item-id="[[micrositeId]]" type="microsite"></hub-cms-lock>

		<iron-meta id="language" key="language" value$="[[_sharedElementsLanguage]]"></iron-meta>

		<hub-cms-popup-share-link
			id="shareLinkDialog"
			type="Microsites"
			item-id="[[_microsite.id]]"
			item-version="[[_microsite.aggregateVersion]]"
			toggle-share="[[_microsite.shared]]"
		></hub-cms-popup-share-link>

		<app-drawer-layout>

			<app-drawer slot="drawer" position="left" persistent opened>

				<hub-cms-menu-microsite-edit
					id="menu"
					microsite="[[_microsite]]"
					statuses="[[_statuses]]"
					layout="[[_layout]]"
					current-blade="{{_currentBlade}}"
					on-save-microsite="_onSaveMicrosite"
					read-only="[[_blockActions]]"
				></hub-cms-menu-microsite-edit>

			</app-drawer>

			<div class="content">

				<template is="dom-if" if="[[_readOnly]]" restamp>
					<hub-cms-read-only-bar editing-author="[[_editingAuthor]]"></hub-cms-read-only-bar>
				</template>

				<hub-cms-microsite-saver
					id="siteSaver"
					microsite="{{_microsite}}"
					url-info="{{_urlInfo}}"
					layout="{{_layout}}"
					page-config="[[_pageConfig]]"
					saving="{{_saving}}"
					on-microsite-saved="_micrositeSaved"
					on-microsite-not-saved="_micrositeNotSaved"
				></hub-cms-microsite-saver>

				<hub-cms-visual-composer
					id="visualComposer"
					microsite="{{_microsite}}"
					url-info="{{_urlInfo}}"
					layout="{{_layout}}"
					statuses="[[_statuses]]"
					page-config="[[_pageConfig]]"
					current-blade="{{_currentBlade}}"
					on-save-microsite="_onSaveMicrosite"
					on-show-editor-icon="_showEditorIcon"
					on-hide-editor-icon="_hideEditorIcon"
					read-only="[[_blockActions]]">
					<slot name="yoast" slot="yoast"></slot>
					<slot name="microsite-content" slot="microsite-content"></slot>
				</hub-cms-visual-composer>

			</div>

		</app-drawer-layout>

		<hub-cms-popup id="emptyAdverts">
			<h2>[[localize('unconfiguredAdverts')]]</h2>
			<p>[[localize('publishWithoutAdsWarning')]]</p>
			<div class="paper-dialog-buttons">
				<paper-button dialog-dismiss>[[localize('dismiss')]]</paper-button>
				<paper-button dialog-confirm on-tap="_skipAdvertValidationAndSave">[[localize('ok')]]</paper-button>
			</div>
		</hub-cms-popup>

		<hub-cms-popup id="unsavedDialog">
			<h2>[[localize('unsavedChanges')]]</h2>
			<p>[[localize('saveChangesQuestion')]]</p>
			<div class="paper-dialog-buttons">
				<paper-button dialog-dismiss on-tap="_goBack">[[localize('cancel')]]</paper-button>
				<paper-button dialog-confirm on-tap="_saveAndQuit">[[localize('save')]]</paper-button>
			</div>
		</hub-cms-popup>

		<hub-cms-popup id="confirmDeletionDialog">
			<h2>[[localize('doYouWantToDeleteThisElementPermanently')]]</h2>
			<div class="paper-dialog-buttons">
				<paper-button dialog-dismiss>[[localize('cancel')]]</paper-button>
				<paper-button dialog-confirm on-tap="_confirmDeletionElement">[[localize('delete')]]</paper-button>
			</div>
		</hub-cms-popup>

		<hub-cms-dialog-anchor
				id="openAnchorDialog"
				dialog-type="Anchor"
				dialog-target="Microsite"
		></hub-cms-dialog-anchor>
	</template>

	<script>
		Polymer({

			is: 'hub-cms-microsite-edit-view',

			properties: {

				// PUBLIC

				micrositeId: {
					type: String
				},

				lastActionDate: {
					type: Date,
					observer: '_lastActivityChanged'
				},

				lockInterval: {
					type: Number
				},

				// PRIVATE

				_microsite: {
					type: Object
				},

				_urlInfo: {
					type: Object
				},

				_layout: {
					type: Object
				},

				_statuses: {
					type: Object
				},

				_pageConfig: {
					type: Object
				},

				// PRIVATE

				_dataLoaded: {
					type: Boolean,
					value: true
				},

				_micrositeInvalid: {
					type: Boolean,
					value: false
				},

				_currentBlade: {
					type: String,
					value: 'build',
					reflectToAttribute: true
				},

				_readOnly: {
					type: Boolean,
					value: false
				},

				_skipAdvertValidation: {
					type: Boolean,
					value: false
				},

				_saveEnabled: {
					type: Boolean,
					value: false
				},

				_blockActions: {
					type: Boolean,
					value: false,
					computed: '_computeBlockActions(_readOnly, _saving)'
				},

				_saving: {
					type: Boolean,
					value: false
				},

				_currentDeleting: {
					type: Object,
					value: null,
				}

			},

			_computeBlockActions: function (_readOnly, _saving) {
				return _readOnly || _saving;
			},

			observers: [
				'_routeDataChanged(routeData.id)',
				'_micrositeDataChanged(_microsite.*, _urlInfo.*)'
			],

			listeners: {
				'open-blade': '_openBlade',
				'close-blades': '_closeBlades',
				'element-changed': '_elementChanged',
				'toggle-share-link-popup': '_toggleShareLinkPopup',
				'microsite-confirm-removing-draggable-item': '_onMicrositeConfirmRemoveDraggableItem',
				'microsite-remove-draggable-item': '_onMicrositeRemoveDraggableItem',
				'disable-save-button': '_onDisableSaveButton',
				'editing-user-changed': '_onEditingUserChanged',
				'set-read-only': '_onSetReadOnly',
				'leave-microsite': '_onLeaveMicrosite',
				'editor-size-changed': '_setEditorSize',
				'microsite-or-article-url-changed': '_onUrlChange',
				'microsite-or-article-seo-score-changed': '_onSeoScoreChange',
				'microsite-or-article-seo-changed': '_onSeoPageConfigChange'
			},

			behaviors: [
				HubCMSBehaviors.LocalizeBehavior
			],

			attached: function () {
				var dialogType;
				this.$.visualComposer.addEventListener('click', (e) => {
					dialogType = e.target.classList.contains('article-link') ? "AnchorDialog" : false;
					if (dialogType) {
						this.$['open' + dialogType].open(e.target, this._readButtonProps(e.target));
						e.preventDefault();
					}
				});
			},

			_readButtonProps: function (node) {
				return {
					text: node.textContent,
					href: node.getAttribute('href'),
					target: node.getAttribute('target'),
					rel: node.getAttribute('rel')
				};
			},

			detached: function () {
				var content = document.querySelector('#microsite-content');
				if (content) content.innerHTML = null;

				clearInterval(this.lockInterval);
			},

			// OBSERVERS

			_saveAndQuit: function () {
				this._saveMicrosite("save");
				this._goBack();
			},

			_skipAdvertValidationAndSave: function () {
				this.set('_skipAdvertValidation', true);
				this._saveMicrosite("save");
			},

			_goBack: function () {
				this.fire('page-change', 'microsites/list');
			},

			_onLeaveMicrosite: function () {
				if (this._saveEnabled) {
					this.$.unsavedDialog.open();
				} else {
					this._goBack();
				}
			},

			_onDisableSaveButton: function (e) {
				if (!this._statuses) return;
				this.$.menu.setSaveDisabled(e.detail);
				this.set('_micrositeInvalid', e.detail);
			},

			_onDataLoading: function (e) {
				this._dataLoaded = e.detail.dataLoaded;
			},

			_routeDataChanged: function (id) {
				if (id === undefined) return;
				this.set('micrositeId', id);
			},

			_checkLocks: function () {

				var currentStatus = this._statuses.find(function (status) {
					return status.id == this._microsite.statusId
				}.bind(this));

				if (currentStatus.identifier === "archived") {
					this.fire('set-read-only', {
						"readOnly": true
					});
				}

			},

			_dataReady: function (e) {

				this._microsite = e.detail.microsite;
				this._urlInfo = e.detail.urlInfo;
				this._layout = e.detail.layout;
				this._statuses = e.detail.statuses;
				this._pageConfig = e.detail.pageConfig;
				this._sharedElementsLanguage = this._microsite.cultureCode || 'en-GB';
				this._checkLocks();
				this.debounce('microsite-edit-data-loaded', function () {
					this._dataLoaded = true;
				}, 50);
				var currentStatus = this._statuses.find(function(status) { return status.id == this._microsite.statusId }.bind(this));
				currentStatus.identifier !== "archived" ? this.$.cmsLock.checkLock() : this.fire('set-read-only', {"readOnly": true});
				if (currentStatus.identifier !== "archived" && !this.lockInterval) {
					this.setLockInterval()
				}
			},

			setLockInterval: function () {
				var min = 1;
				this._checkMicrositeActivity();
				this.lockInterval = setInterval(this._checkMicrositeActivity.bind(this), min * 60000)
			},

			_checkMicrositeActivity: function () {
				var timeFromLastAction = parseFloat(((new Date() - this.lastActionDate) / 60000).toFixed(2));
				var active = timeFromLastAction < 2;
				if (active) {
					this.$.cmsLock.checkLock();
				} else if (this.$.menu.saveDisabled && !active) {
					clearInterval(this.lockInterval);
					this.lockInterval = false;
				}
			},

			_lastActivityChanged: function (newDate, oldDate) {
				if (this.$.menu.saveDisabled && !this.lockInterval) {
					this.setLockInterval()
				}
			},

			_elementChanged: function (e) {

				this.$.visualComposer.setNode();

				this.debounce('microsite-element-changed', function () {
					this._enableSave();
				}, 250);

			},

			_seoChanged: function (e) {
				this.debounce('microsite-element-changed', function () {
					this._enableSave();
				}, 250);

				this.$.visualComposer.setNode();
			},

			_micrositeSaved: function (e) {
				if (e.detail.saveType === "save") {
					this.lastActionDate = new Date();
				}
				var keyword = (e.detail.saveType === 'save') ? 'changesSaved' : 'changesAutoSavedDisketteInfo';
				var duration = keyword === 'changesSaved' ? 6000 : 0;
				this.fire('toast', { type: 'info', text: keyword, duration: duration });
			},

			_micrositeNotSaved: function (e) {
				this.fire('toast', { type: 'error', errorData: { errorCode: 'sthWentWrong' } });
			},

			_micrositeDataChanged: function (microsite, urlInfo) {
				if (microsite === undefined || urlInfo === undefined || urlInfo.value === undefined ) {
					return;
				}
				/*
				* ensure that property has been changed and not whole object, so if no dots in path then no property changed
				*/
				if (microsite.path.indexOf('.') === -1 && urlInfo.path.indexOf('.') === -1) {
					return;
				}
				this._enableSave();
			},

			_enableSave: function () {
				if (!this._dataLoaded) {
					return;
				}
				if (this.$.menu.saveDisabled && !this._micrositeSlugInvalid) {
					this.lastActionDate = new Date();
					this.$.menu.setSaveDisabled(false);
					this._saveEnabled = true;
				}
			},

			_setEditorSize: function (e) {
				this._editorSize = e.detail;
			},

			_onSaveMicrosite: function (e) {
				var saveType = !!(e.detail && e.detail.length) ? e.detail : 'save';
				this._saveMicrosite(saveType);
			},

			_saveMicrosite: function (saveType) {
                var layoutNode = this.$.visualComposer.getLayoutNode();
				var dataValid = this._validateData(layoutNode);
				var advertsValid = this._validateAdvertsData(layoutNode);
				if (!dataValid || !advertsValid) return;
				this.fire('toast', { type: 'info', text: 'savingData' });
				this._closeBlades();
				this.$.menu.setSaveDisabled(true);
				this._saveEnabled = false;
				this.$.siteSaver.save(layoutNode, saveType);
			},

			_onEditingUserChanged: function (e) {
				this.set("_editingAuthor", e.detail.editingAuthor);
			},

			_onSetReadOnly: function (e) {
				this.set("_readOnly", e.detail.readOnly);
				if (this._readOnly) {
					this.$.menu.setSaveDisabled(true);
					this._saveEnabled = false;
					this._closeBlades();
					clearInterval(this.lockInterval);
				}
			},

			_validateStickyAdvertAttributes: function (item, position) {
				return item.hasAttribute(position + '-ad-show') && (!item.hasAttribute(position + '-ad-element') || !item.hasAttribute(position + '-ad-size') || !item.hasAttribute(position + '-ad-path'));
			},

			_validateAdvertsData: function (layoutNode) {
				var currentStatus = this._statuses.find(function(status) { return status.id == this._microsite.statusId }.bind(this));
				if (currentStatus.identifier === 'published') {
					if (this._skipAdvertValidation) {
						this.set('_skipAdvertValidation', false);
						return true;
					};
					var emptyInContentAdvert = [...layoutNode.querySelectorAll('hub-cms-draggable-item[editor="advert"]')].find(item => !item.element.element || !item.element.path || !item.element.size);
					var emptyStickyAdvert = [...layoutNode.querySelectorAll('hub-cms-draggable-item[editor="row"]')].find(item => {
						var rigthStickyInvalid = this._validateStickyAdvertAttributes(item.element, "right");
						var leftStickyInvalid =	this._validateStickyAdvertAttributes(item.element, "left");
						if (rigthStickyInvalid || leftStickyInvalid) {
							return item;
						}
					});

					if (emptyStickyAdvert || emptyInContentAdvert) {
						var advert = emptyStickyAdvert || emptyInContentAdvert;
						advert.highlight();
						advert.editor && advert.$$("#edit").click();
						this.async(() => {
							this.$.emptyAdverts.open();
						}, 500); // I can explain, this is added due to highlight behavior.
						return false;
					} else {
						return true;
					}
				} else {
					return true;
				}
			},

			_validateData: function (layoutNode) {
				var valid = this._microsite.title && this._urlInfo.urlRelative;

				if (!valid) {
					this.set('_currentBlade', 'details');
				}

				var layoutValidationResults = this.$.validator.validate(layoutNode);

				if (layoutValidationResults.errors.length !== 0) {

					this.fire('toast', { type: 'error', errorData: { errorsList: layoutValidationResults.errors, errorCode: "sthWentWrong" } });

					return false;
				} else {
					this.$.visualComposer.$.blades.$.detailsEdit.$.urlRelative.validate();
					this.$.visualComposer.$.blades.$.detailsEdit.$.micrositeTitle.validate();

					return valid;
				}
			},

			_toggleShareLinkPopup: function (e) {
				this.$.shareLinkDialog.toggle();
			},


			_onMicrositeRemoveDraggableItem: function(e){
				if (this._currentBlade === e.detail.editor) {
					this._closeBlades();
				}
			},

			_onMicrositeConfirmRemoveDraggableItem: function (e) {
				this._currentDeleting = e.detail;
				this.$.confirmDeletionDialog.open();
			},

			_confirmDeletionElement: function(){
				if(this.$.visualComposer.$.preview){
					this.$.visualComposer.$.preview.dispatchEvent(new CustomEvent("microsite-remove-draggable-item", {
						detail: this._currentDeleting,
						bubbles: true,
						composed: true
					}));
				}
				this._currentDeleting = null;
			},

			/* Blade */

			_openBlade: function (e) {
				this.set('_currentBlade', e.detail);
			},

			_closeBlades: function () {
				this.set('_currentBlade', null);
			},

			_showEditorIcon: function () {
				this.$.menu.showEditorIcon();
			},

			_hideEditorIcon: function () {
				this.$.menu.hideEditorIcon();
			},

			_onUrlChange: function (e) {
				this._enableSave();
				this._urlInfo.urlRelative = e.detail;
			},

			_onSeoScoreChange: function (e) {
				this._enableSave();
				this._microsite.seoScore = e.detail;
			},

			_onSeoPageConfigChange: function (e) {
				this._enableSave();
				this._pageConfig.head = e.detail;
			}

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
const elToExtend = 'HubCmsElement';
const createConfig = (classProps, template, behaviors) => {
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

const Polymer = (polymerObj) => polymerObj;

const extractBehaviors = (code) => {
	return code.match(/behaviors:\s?\[([^]+?)\]/) ? code.match(/behaviors:\s?\[([^]+?)\]/)[0]
		.split(':')
		.slice(1)
		.join('') : '';
}

const changePolymerImport = (head) => {
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
	head.appendChild(newImport);
}

const dom = new JSDOM(sampleCode);
const script = dom.window.document.querySelector('script');
const template = dom.window.document.querySelector('template');
const behaviors = extractBehaviors(script.textContent);
const polymerConfig = eval(script.textContent.replace(/behaviors:\s?\[([^]+?)\],/, ''));
const newTemplate = createClass(createConfig(polymerConfig, pretty(template.innerHTML), behaviors));
dom.window.document.querySelector('dom-module').removeChild(template);
changePolymerImport(dom.window.document.head);
console.log(dom.window.document.head.innerHTML)
script.textContent = prettier.format(newTemplate, {
	useTabs: true,
	tabWidth: 4,
	singleQuote: true,
});
const possibleTypes = ['Boolean', 'Date', 'Number', 'String', 'Array', 'Object']
for (let i = 0; i < possibleTypes.length; i++) {
	const regex = new RegExp(`'${possibleTypes[i]}'`, 'g');
	script.textContent = script.textContent.replace(regex, possibleTypes[i]);
}
const newContent = pretty(dom.window.document.head.innerHTML + dom.window.document.body.innerHTML);

fs.writeFileSync('./opt.html', newContent);

