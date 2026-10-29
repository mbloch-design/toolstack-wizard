import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import ts from 'typescript';

const HEX = /#[\da-f]{3,8}\b/i;
const literalColor = value => !/url\(/i.test(value) && (HEX.test(value) || /\b(?:rgba?|hsla?|oklch|oklab)\([^)]*\d/i.test(value));
const placement = /^(?:display|(?:min-|max-)?width|flex(?:-.+)?|align-.+|justify-.+|gap|row-gap|column-gap|order|grid(?:-.+)?|margin(?:-.+)?|position|inset(?:-.+)?|top|right|bottom|left|z-index|overflow(?:-.+)?)$/;
const oldClasses = /^(?:tt-form-(?:input|textarea)|tt-button-(?:primary|secondary)|(?:mk-button|mk-link|mk-segmented|ac-button|ba-button)(?:--[\w-]+)?)$/;
const contextOf = node => {
  const parts=[];
  for(let p=node.parent;p&&p.type!=='root';p=p.parent) parts.unshift(p.type==='rule'?p.selector:`@${p.name} ${p.params}`);
  return parts.join(' > ');
};
const finding = (kind,file,node,property,value,context='') => ({kind,file,context,selector:node?.selector||'',property,value});
export const exceptionKey = item => JSON.stringify([item.kind,item.file,item.context,item.selector,item.property,item.value]);

export function inspectCss(file,source,{controlClasses=new Set()}={}){
  const found=[]; const root=postcss.parse(source,{from:file}); const tokens=new Set();
  const foundation=file==='src/styles/foundations.css';
  root.walkRules(rule=>{
    const unconditional=[':root','.dark'].includes(rule.selector)&&rule.parent.type==='root';
    let ui=false;
    selectorParser(selectors=>selectors.walkClasses(n=>{if(n.value.startsWith('ui-')||controlClasses.has(n.value))ui=true})).processSync(rule.selector);
    selectorParser(selectors=>selectors.walkClasses(n=>{if(oldClasses.test(n.value))found.push(finding('old-control-class',file,rule,'class',n.value,contextOf(rule)))})).processSync(rule.selector);
    for(const decl of rule.nodes||[]){
      if(decl.type!=='decl')continue;
      const add=kind=>found.push({...finding(kind,file,rule,decl.prop,decl.value,contextOf(rule)),important:!!decl.important});
      if(unconditional&&decl.prop.startsWith('--')){
        const key=rule.selector+':'+decl.prop;
        if(tokens.has(key))add('duplicate-token');tokens.add(key);
        if(!foundation)add('token-owner');
      }
      if(ui&&file!=='src/styles/ui.css'&&!placement.test(decl.prop)&&!(decl.prop==='transform'&&/^translate[XY]?\([^()]+\)$/.test(decl.value)))add('primitive-override');
      if(!foundation&&literalColor(decl.value))add('literal-color');
      if(!foundation&&/^border(?:-[a-z]+)*-radius$/.test(decl.prop)&&decl.value!=='0'&&!decl.value.includes('var(')&&/\d/.test(decl.value))add('literal-radius');
      if(decl.important)add('important');
    }
  });
  return found;
}

export function inspectTsx(file,source){
  const root=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const found=[];
  function context(node){for(let p=node;p;p=p.parent){if(ts.isFunctionDeclaration(p)&&p.name)return p.name.text;if(ts.isVariableDeclaration(p)&&ts.isIdentifier(p.name))return p.name.text}return 'module'}
  function add(kind,node,property,value){found.push(finding(kind,file,null,property,value,context(node)))}
  function visit(node){
    if(ts.isImportDeclaration(node)&&ts.isStringLiteral(node.moduleSpecifier)&&/backoffice|BackOfficePage/.test(file)&&/components\/stack\/StackKit/.test(node.moduleSpecifier.text))add('business-kit-import',node,'import',node.moduleSpecifier.text);
    const literal=ts.isStringLiteralLike(node)||ts.isTemplateHead(node)||ts.isTemplateMiddle(node)||ts.isTemplateTail(node);
    if(literal){
      for(const token of node.text.split(/\s+/))if(oldClasses.test(token))add('old-control-class',node,'class',token);
      if(HEX.test(node.text)&&!/^data:|https?:/.test(node.text))add('literal-color',node,'literal',node.text);
    }
    if(ts.isPropertyAssignment(node)&&/^(?:borderRadius|background(?:Color)?|color|font(?:Size|Weight|Family)?|padding(?:Top|Right|Bottom|Left)?|minHeight)$/.test(node.name.getText(root).replace(/["']/g,''))){
      let attr=node.parent;while(attr&&!ts.isJsxAttribute(attr))attr=attr.parent;
      if(attr?.name.getText(root)==='style'&&(ts.isStringLiteralLike(node.initializer)||ts.isNumericLiteral(node.initializer)))add('inline-appearance',node,node.name.getText(root),node.initializer.getText(root));
    }
    ts.forEachChild(node,visit);
  }
  visit(root);return found;
}


/** Resolve imported primitive aliases and their literal class hooks through JSX AST. */
export function collectControlClasses(file,source){
 const root=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const controls=new Set(); const classes=new Set(); const bindings=new Map();
 const names=new Set(['Button','ButtonLink','TextLink','IconButton','Input','Select','Textarea','Field','Surface','PageHeader','Toolbar','Segmented','ActionRow']);
 for(const statement of root.statements){
  if(!ts.isImportDeclaration(statement)||!ts.isStringLiteral(statement.moduleSpecifier)||!/(?:components\/ui\/primitives|(?:^|\/)StackKit)$/.test(statement.moduleSpecifier.text))continue;
  const imported=statement.importClause?.namedBindings;
  if(imported&&ts.isNamedImports(imported))for(const specifier of imported.elements)if(names.has((specifier.propertyName||specifier.name).text))controls.add(specifier.name.text);
 }
 function gatherBindings(n){if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)&&n.initializer)bindings.set(n.name.text,n.initializer);ts.forEachChild(n,gatherBindings)}
 gatherBindings(root);
 function literalClasses(n,visited=new Set()){
  if(ts.isStringLiteralLike(n)||ts.isTemplateHead(n)||ts.isTemplateMiddle(n)||ts.isTemplateTail(n))for(const token of n.text.split(/\s+/))if(/^[a-z][\w-]*$/.test(token))classes.add(token);
  if(ts.isIdentifier(n)&&bindings.has(n.text)&&!visited.has(n.text)){visited.add(n.text);literalClasses(bindings.get(n.text),visited)}
  ts.forEachChild(n,child=>literalClasses(child,visited));
 }
 function visit(n){
  if((ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n))&&controls.has(n.tagName.getText(root))){
   for(const attr of n.attributes.properties)if(ts.isJsxAttribute(attr)&&attr.name.getText(root)==='className'&&attr.initializer)literalClasses(attr.initializer);
  }
  ts.forEachChild(n,visit);
 }
 visit(root);return classes;
}
