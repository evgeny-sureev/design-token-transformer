const StyleDictionary = require('style-dictionary')
const { createPropertyFormatter } = StyleDictionary.formatHelpers;
const deepMerge = require("deepmerge");
const webConfig = require('./src/web/index.js')
const iosConfig = require("./src/ios/index.js");
const changeCase = require('change-case')

StyleDictionary.registerTransform({
  name: 'size/px',
  type: 'value',
  matcher: token => {
    return (token.unit === 'pixel' || token.type === 'dimension') && token.value !== 0
  },
  transformer: token => {
    return `${token.value}px`
  }
})

StyleDictionary.registerTransform({
  name: 'size/percent',
  type: 'value',
  matcher: token => {
    return token.unit === 'percent' && token.value !== 0
  },
  transformer: token => {
    return `${token.value}%`
  }
})

StyleDictionary.registerFilter({
  name: 'validToken',
  matcher: function(token) {
    return [
      "dimension",
      "string",
      "number",
      "color",
      "custom-spacing",
      "custom-gradient",
      "custom-fontStyle",
      "custom-radius",
      "custom-shadow",
    ].includes(token.type);
  }
})

StyleDictionary.registerFormat({
  name: 'enum.swift',
  formatter: function({ dictionary, options, file }) {
    const { outputReferences } = options;
    const formatProperty = createPropertyFormatter({
      outputReferences,
      dictionary,
      formatting: {
        indentation: '    ',
        prefix: 'public static let ',
        separator: ': '+file.propertyType+' = '
      }
    });
    return `\nimport UIKit\n\npublic enum `+file.className+` {\n` + dictionary.allTokens.map(formatProperty).join('\n') + `\n}\n`;
  }
});

StyleDictionary.registerFormat({
  name: 'extension.swift',
  formatter: function({ dictionary, options, file }) {
    const { outputReferences } = options;
    const formatProperty = (token) => {
      const name = changeCase.pascalCase(token.path.slice(2).join(' '));
      return '    public static let ' + name + ' = ' + file.className + '('+file.constructorParameter + '"'+ name+'") // ' + token.value
    }
    return `\nimport `+file.import+`\n\npublic extension `+file.className+` {\n` + dictionary.allTokens.map(formatProperty).join('\n') + `\n}\n`;
  }
});

const StyleDictionaryExtended = StyleDictionary.extend({
  ...deepMerge.all([iosConfig, webConfig]),
  source: ["tokens/*.json"],
  platforms: {
    'ios-swift': {
      transforms: [
        'name/cti/camel'
      ],
      buildPath: 'build/',
      files: [
        {
          destination: 'Size.swift',
          filter: (token) => token.type === 'dimension',
          className: 'Size',
          propertyType: 'CGFloat',
          format: 'enum.swift'
        },
        {
          destination: 'Color.swift',
          filter: (token) => token.type === 'color',
          className: 'Color',
          constructorParameter: '',
          import: 'SwiftUI',
          format: 'extension.swift'
        },
        {
          destination: 'UIColor.swift',
          filter: (token) => token.type === 'color',
          className: 'UIColor',
          constructorParameter: 'named: ',
          import: 'UIKit',
          format: 'extension.swift'
        }
      ],
      actions: [
        'ios/colorSets',
      ]
    }
  },
});

StyleDictionaryExtended.buildAllPlatforms()
