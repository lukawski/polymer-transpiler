module.exports = (config) => {
  const mixinsTemplate = `Polymer.mixinBehaviors(${config.base.slice(1)},
    ${config.base[0]}
  )`;

  return `
    class ${config.name} extends ${config.base.length > 1 ? mixinsTemplate : config.base[0]} {
      ${config.staticProps.map(prop => `
        static get ${prop.name}() { return ${JSON.stringify(prop.content)} }
        `).join('')}

      ${config.lifecycleMethods.map(method => `
        ${method.name}() {
          ${method.content}
        }
      `).join('')}
  }

  customElements.define(${config.name}.is, ${config.name});
`;
}
