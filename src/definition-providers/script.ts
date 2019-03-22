import * as path from 'path';
import Server from './../server';
import ASTPath from './../glimmer-utils';
import { TextDocumentPositionParams, Definition } from 'vscode-languageserver';
import { parse } from 'babylon';
import { toPosition } from './../estree-utils';
import { pathsToLocations } from '../utils/definition-helpers';
import { isTransformReference, isModelReference, isImportPathDeclaration } from './../utils/ast-helpers';
import {
  isModuleUnificationApp,
  podModulePrefixForRoot
} from './../utils/layout-helpers';

type ItemType = 'Model' | 'Transform';
type LayoutCollectorFn = (root: string, itemName: string, podModulePrefix?: string) => string[];

function joinPaths(...args: string[]) {
  return ['.ts', '.js'].map((extName: string) => {
    const localArgs = args.slice(0);
    const lastArg = localArgs.pop() + extName;
    return path.join.apply(path, [...localArgs, lastArg]);
  });
}

class PathResolvers {
  [key: string]: LayoutCollectorFn;
  muModelPaths(root: string, modelName: string) {
    return joinPaths(root, 'src', 'data', 'models', modelName, 'model');
  }
  muTransformPaths(root: string, transformName: string) {
    return joinPaths(root, 'src', 'data', 'transforms', transformName);
  }
  classicModelPaths(root: string, modelName: string) {
    return joinPaths(root, 'app', 'models', modelName);
  }
  classicTransformPaths(root: string, transformName: string) {
    return joinPaths(root, 'app', 'transforms', transformName);
  }
  podTransformPaths(root: string, transformName: string, podPrefix: string) {
    return joinPaths(root, 'app', podPrefix, transformName, 'transform');
  }
  podModelPaths(root: string, modelName: string, podPrefix: string) {
    return joinPaths(root, 'app', podPrefix, modelName, 'model');
  }
  classicImportPaths(root: string, pathName: string) {
    const pathParts = pathName.split('/');
    pathParts.shift();
    const params = [root, 'app', ...pathParts];
    return joinPaths.apply(null, params);
  }
  muImportPaths(root: string, pathName: string) {
    const pathParts = pathName.split('/');
    pathParts.shift();
    const params = [root, ...pathParts];
    return joinPaths.apply(null, params);
  }
}

export default class ScriptDefinietionProvider {
  private resolvers!: PathResolvers;
  constructor(private server: Server) {
    this.resolvers = new PathResolvers();
  }
  guessPathForImport(root: string, uri: string, importPath: string ) {
    if (!uri) {
      return null;
    }
    const guessedPaths: string[] = [];
    const fnName = 'Import';
    if (isModuleUnificationApp(root)) {
      this.resolvers[`mu${fnName}Paths`](root, importPath).forEach(
        (pathLocation: string) => {
          guessedPaths.push(pathLocation);
        }
      );
    } else {
      this.resolvers[`classic${fnName}Paths`](root, importPath).forEach(
        (pathLocation: string) => {
          guessedPaths.push(pathLocation);
        }
      );

    }
    return pathsToLocations.apply(null, guessedPaths);
  }
  guessPathsForType(root: string, fnName: ItemType, typeName: string) {
    const guessedPaths: string[] = [];

    if (isModuleUnificationApp(root)) {
      this.resolvers[`mu${fnName}Paths`](root, typeName).forEach(
        (pathLocation: string) => {
          guessedPaths.push(pathLocation);
        }
      );
    } else {
      this.resolvers[`classic${fnName}Paths`](root, typeName).forEach(
        (pathLocation: string) => {
          guessedPaths.push(pathLocation);
        }
      );
      const podPrefix = podModulePrefixForRoot(root);
      if (podPrefix) {
        this.resolvers[`pod${fnName}Paths`](root, typeName, podPrefix).forEach(
          (pathLocation: string) => {
            guessedPaths.push(pathLocation);
          }
        );
      }
    }
    return pathsToLocations.apply(null, guessedPaths);
  }
  handle(params: TextDocumentPositionParams, project: any): Definition | null {
    const uri = params.textDocument.uri;
    const { root } = project;
    const content = this.server.documents.get(uri).getText();

    const ast = parse(content, {
      sourceType: 'module'
    });

    const astPath = ASTPath.toPosition(ast, toPosition(params.position));

    if (!astPath) {
      return null;
    }

    if (isModelReference(astPath)) {
      const modelName = astPath.node.value;
      return this.guessPathsForType(root, 'Model', modelName);
    } else if (isTransformReference(astPath)) {
      const transformName = astPath.node.value;
      return this.guessPathsForType(root, 'Transform', transformName);
    } else if (isImportPathDeclaration(astPath)) {
      return this.guessPathForImport(root, uri, astPath.node.value);
    }
    return null;
  }
}
