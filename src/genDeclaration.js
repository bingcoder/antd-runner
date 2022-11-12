const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const DeclarationMap = {};

function prefixNodeModules(p) {
  return path.join('node_modules', p);
}

function exist(p) {
  return fs.existsSync(p);
}

function packageDeclarationForeach(p, cb = () => {}) {
  const list = fs.readdirSync(p);
  list.forEach((item) => {
    const itemPath = path.join(p, item);
    if (item.endsWith('.d.ts')) {
      cb(itemPath);
    }
    if (fs.statSync(itemPath).isDirectory()) {
      packageDeclarationForeach(itemPath, cb);
    }
  });
}

/** @type {(p: string) => string[]} */
function getPackageDeclaration(pkgPath) {
  const packageDeclarationList = [pkgPath];
  packageDeclarationForeach(pkgPath.replace('package.json', ''), (item) => {
    packageDeclarationList.push(item);
  });
  return packageDeclarationList;
}

/** @type {(p: string) => string[]} */
function getAbsolutePathDeclaration(absolutePath) {
  const typesPkgPath = path.join('@types', absolutePath, 'package.json');
  const pkgPath = path.join(absolutePath, 'package.json');

  const possiblePackage = [typesPkgPath, pkgPath].find((item) =>
    exist(prefixNodeModules(item))
  );
  if (possiblePackage)
    return getPackageDeclaration(prefixNodeModules(possiblePackage));

  const typesFilePath = path.join('@types', `${absolutePath}.d.ts`);
  const filePath = path.join(`${absolutePath}.d.ts`);
  const typesIndexFilePath = path.join('@types', absolutePath, 'index.d.ts');
  const fileIndexPath = path.join(absolutePath, 'index.d.ts');
  const possibleFile = [
    typesFilePath,
    filePath,
    typesIndexFilePath,
    fileIndexPath,
  ].find((item) => exist(prefixNodeModules(item)));
  if (possibleFile) return [prefixNodeModules(possibleFile)];

  throw new Error(`absolutePath ${absolutePath} not exist`);
}

function getRelativePathDeclaration(relativePath, parentPath = 'node_modules') {
  const possiblePath = [
    path.join(parentPath, '../', `${relativePath}.d.ts`),
    path.join(parentPath, '../', relativePath, 'index.d.ts'),
  ].find(exist);

  if (!possiblePath) throw new Error(`relativePath ${relativePath} not exist`);
  return [possiblePath];
}

/** @type {(p: string, p: string) => string[]} */
function getPath(declarationPath, parentPath) {
  if (declarationPath.startsWith('.') || declarationPath.startsWith('..')) {
    return getRelativePathDeclaration(declarationPath, parentPath);
  } else {
    return getAbsolutePathDeclaration(declarationPath);
  }
}

function traverseImportDeclaration(declarationPath, parentPath) {
  const completedPaths = getPath(declarationPath, parentPath);
  completedPaths.forEach((completedPath) => {
    if (DeclarationMap[completedPath]) return;
    const code = fs.readFileSync(completedPath).toString();
    DeclarationMap[completedPath] = code;
    if (completedPath.endsWith('.ts')) {
      const ast = parse(code, {
        sourceType: 'module',
        plugins: [['typescript', { dts: true }]],
      });
      traverse(ast, {
        ImportDeclaration(path) {
          if (
            !['.less', '.css'].find((item) =>
              path.node.source.value.endsWith(item)
            )
          ) {
            traverseImportDeclaration(path.node.source.value, completedPath);
          }
        },
        ExportNamedDeclaration(path) {
          if (path.node.source) {
            traverseImportDeclaration(path.node.source.value, completedPath);
          }
        },
      });
    }
  });
}

['antd', '@ant-design/icons', 'moment'].forEach(traverseImportDeclaration);

fs.writeFile(
  path.resolve(__dirname, '../dist/js', 'declaration.json'),
  JSON.stringify(DeclarationMap),
  (err) => {
    if (!err) {
      console.log('created declaration.json success');
    }
  }
);

/** 备注 antd
 * @/interface 需要手动修改
 */
