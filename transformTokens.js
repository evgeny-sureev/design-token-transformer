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
  name: 'color-extension.swift',
  formatter: function({ dictionary, options, file }) {
    const { outputReferences } = options;
    const formatProperty = (token) => {
      const name = changeCase.camelCase(token.path.slice(2).join(' '));
      const value = changeCase.pascalCase(token.path.slice(2).join(' '));
      return '    /// Tripster design token for color with hex value of **`' + token.value + '`**\n' +
        '    static let ' + name + ' = Color("'+ value+'", bundle: .module)\n'
    }
    return `\nimport SwiftUI\n\npublic extension Color {\n` + dictionary.allTokens.map(formatProperty).join('\n') + `\n}\n`;
  }
});

StyleDictionary.registerFormat({
  name: 'uicolor-extension.swift',
  formatter: function({ dictionary, options, file }) {
    const { outputReferences } = options;
    const formatProperty = (token) => {
      const name = changeCase.camelCase(token.path.slice(2).join(' '));
      const value = changeCase.pascalCase(token.path.slice(2).join(' '));
      return '    /// Tripster design token for color with hex value of **`' + token.value + '`**\n' +
        '    static let ' + name + ' = UIColor(named: "'+ value+'", in: .module, compatibleWith: nil)\n'
    }
    return `\nimport UIKit\n\npublic extension UIColor {\n` + dictionary.allTokens.map(formatProperty).join('\n') + `\n}\n`;
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
          format: 'color-extension.swift'
        },
        {
          destination: 'UIColor.swift',
          filter: (token) => token.type === 'color',
          format: 'uicolor-extension.swift'
        }
      ],
      actions: [
        'ios/colorSets',
      ]
    }
  },
});

StyleDictionaryExtended.buildAllPlatforms()
