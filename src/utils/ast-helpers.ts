import ASTPath from './../glimmer-utils';
import { ASTv1 } from '@glimmer/syntax';

const HTML_TAGS = [
  'a',
  'abbr',
  'address',
  'area',
  'article',
  'aside',
  'audio',
  'b',
  'base',
  'bdi',
  'bdo',
  'blockquote',
  'body',
  'br',
  'button',
  'canvas',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'data',
  'datalist',
  'dd',
  'del',
  'details',
  'dfn',
  'dialog',
  'div',
  'dl',
  'dt',
  'em',
  'embed',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hgroup',
  'hr',
  'html',
  'i',
  'iframe',
  'img',
  'input',
  'ins',
  'kbd',
  'label',
  'legend',
  'li',
  'link',
  'main',
  'map',
  'mark',
  'math',
  'menu',
  'menuitem',
  'meta',
  'meter',
  'nav',
  'noscript',
  'object',
  'ol',
  'optgroup',
  'option',
  'output',
  'p',
  'param',
  'picture',
  'pre',
  'progress',
  'q',
  'rb',
  'rp',
  'rt',
  'rtc',
  'ruby',
  's',
  'samp',
  'script',
  'section',
  'select',
  'slot',
  'small',
  'source',
  'span',
  'strong',
  'style',
  'sub',
  'summary',
  'sup',
  'svg',
  'table',
  'tbody',
  'td',
  'template',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'time',
  'title',
  'tr',
  'track',
  'u',
  'ul',
  'var',
  'video',
  'wbr',
];

function isElementModifierStatement(node: ASTv1.Node, name: string | false = false): boolean {
  const isModifier = node.type === 'ElementModifierStatement';

  if (!isModifier) {
    return false;
  }

  if (!name) {
    return true;
  }

  return node.path.type === 'PathExpression' && node.path.original === name;
}

export function isFirstParamOfOnModifier(astPath: ASTPath): boolean {
  const node = astPath.node;

  if (!isString(node)) {
    return false;
  }

  const parent = astPath.parent as ASTv1.ElementModifierStatement;

  if (!isElementModifierStatement(parent, 'on')) {
    return false;
  }

  if (parent.params[0] !== node) {
    return false;
  }

  return true;
}

function isFirstStringParamInCallExpression(astPath: ASTPath): boolean {
  const node = astPath.node;

  if (!isString(node)) {
    return false;
  }

  const parent = astPath.parent;

  if (!isCallExpression(parent)) {
    return false;
  }

  if (!expressionHasArgument(parent, node, 0)) {
    return false;
  }

  if (!parent.callee || !parent.callee.property) {
    return false;
  }

  return true;
}

export function closestScriptNodeParent(astPath: ASTPath, type: string, ignoreParents: string[] = []): any {
  let lookupPath: ASTPath | undefined = astPath;

  while (lookupPath && lookupPath.parent) {
    if (hasNodeType(lookupPath.node, type)) {
      if (!lookupPath.parent) {
        return lookupPath.node;
      }

      if (!ignoreParents.includes(lookupPath.parent.type)) {
        return lookupPath.node;
      }
    } else {
      lookupPath = lookupPath.parentPath;
    }
  }

  return null;
}

export function isRouteLookup(astPath: ASTPath): boolean {
  if (!isFirstStringParamInCallExpression(astPath)) {
    return false;
  }

  const parent = astPath.parent;
  const matches = ['transitionTo', 'replaceWith', 'replaceRoute', 'modelFor', 'controllerFor', 'intermediateTransitionTo', 'paramsFor', 'transitionToRoute'];

  return expressionHasIdentifierName(parent, matches);
}

export function isTemplateElement(astPath: ASTPath): boolean {
  const node = astPath.node as any;

  if (node.type !== 'TemplateElement') {
    return false;
  }

  const parent = astPath.parent;

  if (parent.type !== 'TemplateLiteral') {
    return false;
  }

  const grandpa = astPath.parentPath && astPath.parentPath.parent;

  if (grandpa.type !== 'TaggedTemplateExpression') {
    return false;
  }

  if (grandpa.tag && grandpa.tag.type === 'Identifier' && grandpa.tag.name === 'hbs') {
    return true;
  }

  return false;
}

export function isStoreModelLookup(astPath: ASTPath): boolean {
  if (!isFirstStringParamInCallExpression(astPath)) {
    return false;
  }

  const parent = astPath.parent;
  const matches = ['findRecord', 'createRecord', 'findAll', 'queryRecord', 'peekAll', 'query', 'peekRecord', 'adapterFor', 'hasRecordForId'];

  return expressionHasIdentifierName(parent, matches);
}

export function isComputedPropertyArgument(astPath: ASTPath): boolean {
  const node = astPath.node;

  if (!isString(node)) {
    return false;
  }

  const parent = astPath.parent;

  if (!isCallExpression(parent)) {
    return false;
  }

  if (!expressionHasArgument(parent, node)) {
    return false;
  }

  if (
    !expressionHasIdentifierName(parent, [
      'computed',
      'and',
      'alias',
      'bool',
      'collect',
      'deprecatingAlias',
      'empty',
      'equal',
      'filter',
      'filterBy',
      'gt',
      'gte',
      'intersect',
      'lt',
      'lte',
      'map',
      'mapBy',
      'match',
      'max',
      'min',
      'none',
      'not',
      'notEmpty',
      'oneWay',
      'or',
      'readOnly',
      'reads',
      'setDiff',
      'sort',
      'sum',
      'union',
      'uniq',
      'uniqBy',
      'notifyPropertyChange',
      'toggleProperty',
      'cacheFor',
      'addObserver',
      'removeObserver',
      'incrementProperty',
      'decrementDecrementProperty',
      'set',
      'get',
      'getWithDefault ',
    ])
  ) {
    return false;
  }

  const grandParent = astPath.parentPath;

  if (!grandParent) {
    return false;
  }

  return true;
}

export function isTransformReference(astPath: ASTPath): boolean {
  const node = astPath.node;

  if (!isString(node)) {
    return false;
  }

  const parent = astPath.parent;

  if (!isCallExpression(parent)) {
    return false;
  }

  if (!expressionHasArgument(parent, node, 0)) {
    return false;
  }

  return expressionHasIdentifierName(parent, 'attr');
}

export function isNamedBlockName(path: ASTPath): boolean {
  return isAngleComponentPath(path) && path.parent && (path.node as ASTv1.ElementNode).tag.startsWith(':');
}

export function isSpecialHelperStringPositionalParam(helperName: 'component' | 'helper' | 'modifier', astPath: ASTPath) {
  const node = astPath.node;

  if (!isString(node)) {
    return false;
  }

  const parentPath = astPath.parentPath;

  if (!parentPath) {
    return false;
  }

  if (!hasNodeType(parentPath.node, 'SubExpression')) {
    return false;
  }

  const parentNode = parentPath.node as ASTv1.SubExpression;

  if (parentNode.params.indexOf(node as ASTv1.StringLiteral) !== 0) {
    return false;
  }

  return parentNode.path.type === 'PathExpression' && parentNode.path.original === helperName;
}

export function isScopedAngleTagName(path: ASTPath): boolean {
  const node = path.node as unknown as ASTv1.ElementNode;

  if (!hasNodeType(node, 'ElementNode')) {
    return false;
  }

  if (node.tag.startsWith('@')) {
    // have no idea how to handle it in context
    return false;
  }

  if (node.tag.startsWith('this.')) {
    // have no idea how to handle it in context
    return false;
  }

  if (node.tag.startsWith(':')) {
    // have no idea how to handle it in context
    return false;
  }

  return !HTML_TAGS.includes(node.tag);
}

export function isAngleComponentPath(path: ASTPath): boolean {
  const node = path.node as unknown as ASTv1.ElementNode;

  if (!hasNodeType(node, 'ElementNode')) {
    return false;
  }

  if (node.tag.charAt(0) === node.tag.charAt(0).toUpperCase()) {
    return true;
  } else {
    return false;
  }
}

export function isModifierPath(path: ASTPath): boolean {
  const node = path.node;

  if (!isPathExpression(node)) {
    return false;
  }

  if ((node as ASTv1.PathExpression).head.type === 'AtHead') {
    return false;
  }

  const parent = path.parent;

  if (!hasNodeType(parent, 'ElementModifierStatement')) {
    return false;
  }

  return node === parent.path;
}

export function isMustachePath(path: ASTPath): boolean {
  const node = path.node;

  if (!isPathExpression(node)) {
    return false;
  }

  const parent = path.parent;

  if (!hasNodeType(parent, 'MustacheStatement')) {
    return false;
  }

  return parent.path === node;
}

export function isBlockPath(path: ASTPath): boolean {
  const node = path.node;

  if (!isPathExpression(node)) {
    return false;
  }

  const parent = path.parent;

  if (!isBlock(parent)) {
    return false;
  }

  return parent.path === node;
}

export function isHashPair(path: ASTPath) {
  const node = path.node;

  if (!hasNodeType(node, 'HashPair')) {
    return false;
  }

  return true;
}

export function isHashPairValue(path: ASTPath) {
  return path.parent && isHashPair(path.parentPath as ASTPath) && path.parent.value === path.node;
}

export function isSubExpressionPath(path: ASTPath): boolean {
  const node = path.node;

  if (!isPathExpression(node)) {
    return false;
  }

  const parent = path.parent;

  if (!hasNodeType(parent, 'SubExpression')) {
    return false;
  }

  return parent.path === node;
}

export function isLinkToTarget(path: ASTPath): boolean {
  return isInlineLinkToTarget(path) || isBlockLinkToTarget(path);
}

export function isOutlet(path: ASTPath): boolean {
  if (isPathExpression(path.node)) {
    const node = path.node as ASTv1.PathExpression;

    return node.original === 'outlet' && node.head.type === 'VarHead';
  }

  return false;
}

export function isInlineLinkToTarget(path: ASTPath): boolean {
  const node = path.node;

  if (!isString(node)) {
    return false;
  }

  const parent = path.parent;

  if (!hasNodeType(parent, 'MustacheStatement')) {
    return false;
  }

  return parent.params[1] === node && parent.path && parent.path.original === 'link-to';
}

export function isBlockLinkToTarget(path: ASTPath): boolean {
  const node = path.node;

  if (!isString(node)) {
    return false;
  }

  const parent = path.parent;

  if (!isBlock(parent)) {
    return false;
  }

  return parent.params[0] === node && parent.path && parent.path.original === 'link-to';
}

export function isImportPathDeclaration(path: ASTPath): boolean {
  const node = path.node;

  if (!isString(node)) {
    return false;
  }

  const parent = path.parent;

  if (!hasNodeType(parent, 'ImportDeclaration')) {
    return false;
  }

  return true;
}

export function isImportSpecifier(path: ASTPath): boolean {
  if (!hasNodeType(path.parent, 'ImportSpecifier')) {
    return false;
  }

  return true;
}

export function isImportDefaultSpecifier(path: ASTPath): boolean {
  if (!hasNodeType(path.parent, 'ImportDefaultSpecifier')) {
    return false;
  }

  return true;
}

export function isServiceInjection(path: ASTPath): boolean {
  const node = path.node;

  if (!hasNodeType(node, 'Identifier')) {
    return false;
  }

  const parent = path.parent;

  if (!hasNodeType(parent, 'ObjectProperty')) {
    return false;
  }

  if (!isCallExpression(parent.value)) {
    return false;
  }

  return expressionHasIdentifierName(parent.value, 'service');
}

export function isNamedServiceInjection(path: ASTPath): boolean {
  const node = path.node;

  if (!isString(node)) {
    return false;
  }

  const parent = path.parent;

  if (!isCallExpression(parent)) {
    return false;
  }

  return expressionHasIdentifierName(parent, 'service');
}

export function isModelReference(astPath: ASTPath): boolean {
  const node = astPath.node;

  if (!isString(node)) {
    return false;
  }

  const parent = astPath.parent;

  if (!isCallExpression(parent)) {
    return false;
  }

  if (!expressionHasArgument(parent, node, 0)) {
    return false;
  }

  return expressionHasIdentifierName(parent, ['belongsTo', 'hasMany']);
}

export function isLocalizationHelperTranslataionName(focusPath: ASTPath, type: 'script' | 'template'): boolean {
  const parent = focusPath.parent;

  if (!parent) {
    return false;
  }

  if (type === 'script' && isString(focusPath.node)) {
    const isMemberExp = isCallExpression(parent) && parent.callee && parent.callee.type === 'MemberExpression';
    const hasValidCallee = isMemberExp && expressionHasIdentifierName(parent, 't');

    return hasValidCallee && expressionHasArgument(parent, focusPath.node, 0);
  }

  return (
    type === 'template' && isString(focusPath.node) && (parent.type === 'MustacheStatement' || parent.type === 'SubExpression') && parent.path.original === 't'
  );
}

function hasNodeType(node: any, type: string) {
  if (!node) {
    return false;
  }

  return node.type === type;
}

function isBlock(node: any): boolean {
  return hasNodeType(node, 'BlockStatement');
}

function isString(node: any): boolean {
  return hasNodeType(node, 'StringLiteral');
}

function isCallExpression(node: any): boolean {
  return hasNodeType(node, 'CallExpression');
}

export function isLocalPathExpression(path: any): boolean {
  return isPathExpression(path.node) && path.node.this === true;
}

export function isArgumentPathExpression(path: any): boolean {
  return isPathExpression(path.node) && path.node.data === true;
}

export function isScopedPathExpression(path: any): boolean {
  return isPathExpression(path.node) && path.node.this === false && path.node.data === false;
}

export function isComponentArgumentName(path: any): boolean {
  return isElementAttribute(path) && path.node.name.startsWith('@');
}

export function isElementAttribute(path: any): boolean {
  return hasNodeType(path.node, 'AttrNode');
}

export function isLinkComponentRouteTarget(path: any): boolean {
  return hasNodeType(path.node, 'TextNode') && hasNodeType(path.parent, 'AttrNode') && path.parent.name === '@route';
}

export function isPathExpression(node: any): boolean {
  return hasNodeType(node, 'PathExpression');
}

function expressionHasIdentifierName(exp: any, name: string | string[]) {
  const names = typeof name === 'string' ? [name] : name;
  const identifier = hasNodeType(exp.callee, 'Identifier') ? exp.callee : exp.callee.property;

  return names.includes(identifier.name);
}

function expressionHasArgument(exp: any, arg: any, position = -1) {
  if (!exp || !exp.arguments) {
    return false;
  }

  const index = exp.arguments.indexOf(arg);

  if (index === -1) {
    return false;
  }

  if (position === -1) {
    return true;
  }

  if (position === index) {
    return true;
  } else {
    return false;
  }
}
