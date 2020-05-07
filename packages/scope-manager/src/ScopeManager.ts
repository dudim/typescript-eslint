import { TSESTree } from '@typescript-eslint/experimental-utils';
import { assert } from './assert';
import {
  BlockScope,
  CatchScope,
  ClassScope,
  ConditionalTypeScope,
  ForScope,
  FunctionExpressionNameScope,
  FunctionScope,
  FunctionTypeScope,
  GlobalScope,
  MappedTypeScope,
  ModuleScope,
  Scope,
  SwitchScope,
  TSEnumScope,
  TSModuleScope,
  TypeScope,
  WithScope,
} from './scope';

import { Variable } from './Variable';

interface ScopeManagerOptions {
  globalReturn?: boolean;
  sourceType?: 'module' | 'script';
  impliedStrict?: boolean;
  ecmaVersion?: number;
}

class ScopeManager {
  public currentScope: Scope | null;
  public readonly declaredVariables: WeakMap<TSESTree.Node, Variable[]>;
  /**
   * The root scope
   * @public
   */
  public globalScope: GlobalScope | null;
  public readonly nodeToScope: WeakMap<TSESTree.Node, Scope[]>;
  private readonly options: ScopeManagerOptions;
  /**
   * All scopes
   * @public
   */
  public readonly scopes: Scope[];

  public get variables(): Variable[] {
    const variables = new Set<Variable>();
    function recurse(scope: Scope): void {
      scope.variables.forEach(v => variables.add(v));
      scope.childScopes.forEach(recurse);
    }
    this.scopes.forEach(recurse);
    return Array.from(variables).sort((a, b) => a.$id - b.$id);
  }

  constructor(options: ScopeManagerOptions) {
    this.scopes = [];
    this.globalScope = null;
    this.nodeToScope = new WeakMap();
    this.currentScope = null;
    this.options = options;
    this.declaredVariables = new WeakMap();
  }

  public isGlobalReturn(): boolean {
    return this.options.globalReturn === true;
  }

  public isModule(): boolean {
    return this.options.sourceType === 'module';
  }

  public isStrict(): boolean {
    return (
      this.options.impliedStrict === true &&
      this.options.ecmaVersion != null &&
      this.options.ecmaVersion >= 5
    );
  }

  public isES6(): boolean {
    return this.options.ecmaVersion != null && this.options.ecmaVersion >= 6;
  }

  /**
   * Returns appropriate scope for this node.
   */
  private get(node: TSESTree.Node): Scope[] | undefined {
    return this.nodeToScope.get(node);
  }

  /**
   * Get the variables that a given AST node defines. The gotten variables' `def[].node`/`def[].parent` property is the node.
   * If the node does not define any variable, this returns an empty array.
   * @param node An AST node to get their variables.
   * @public
   */
  public getDeclaredVariables(node: TSESTree.Node): Variable[] {
    return this.declaredVariables.get(node) ?? [];
  }

  /**
   * Get the scope of a given AST node. The gotten scope's `block` property is the node.
   * This method never returns `function-expression-name` scope. If the node does not have their scope, this returns `null`.
   *
   * @param node An AST node to get their scope.
   * @param inner If the node has multiple scopes, this returns the outermost scope normally.
   *                If `inner` is `true` then this returns the innermost scope.
   * @public
   */
  public acquire(node: TSESTree.Node, inner = false): Scope | null {
    function predicate(testScope: Scope): boolean {
      if (testScope.type === 'function' && testScope.functionExpressionScope) {
        return false;
      }
      return true;
    }

    const scopes = this.get(node);

    if (!scopes || scopes.length === 0) {
      return null;
    }

    // Heuristic selection from all scopes.
    // If you would like to get all scopes, please use ScopeManager#acquireAll.
    if (scopes.length === 1) {
      return scopes[0];
    }

    if (inner) {
      for (let i = scopes.length - 1; i >= 0; --i) {
        const scope = scopes[i];

        if (predicate(scope)) {
          return scope;
        }
      }
    } else {
      for (let i = 0; i < scopes.length; ++i) {
        const scope = scopes[i];

        if (predicate(scope)) {
          return scope;
        }
      }
    }

    return null;
  }

  private nestScope(scope: Scope): Scope {
    if (scope instanceof GlobalScope) {
      assert(this.currentScope === null);
      this.globalScope = scope;
    }
    this.currentScope = scope;
    return scope;
  }

  public nestBlockScope(node: BlockScope['block']): Scope {
    assert(this.currentScope);
    return this.nestScope(new BlockScope(this, this.currentScope, node));
  }

  public nestCatchScope(node: CatchScope['block']): Scope {
    assert(this.currentScope);
    return this.nestScope(new CatchScope(this, this.currentScope, node));
  }

  public nestClassScope(node: ClassScope['block']): Scope {
    assert(this.currentScope);
    return this.nestScope(new ClassScope(this, this.currentScope, node));
  }

  public nestConditionalTypeScope(node: ConditionalTypeScope['block']): Scope {
    assert(this.currentScope);
    return this.nestScope(
      new ConditionalTypeScope(this, this.currentScope, node),
    );
  }

  public nestForScope(node: ForScope['block']): Scope {
    assert(this.currentScope);
    return this.nestScope(new ForScope(this, this.currentScope, node));
  }

  public nestFunctionExpressionNameScope(
    node: FunctionExpressionNameScope['block'],
  ): Scope {
    assert(this.currentScope);
    return this.nestScope(
      new FunctionExpressionNameScope(this, this.currentScope, node),
    );
  }

  public nestFunctionScope(
    node: FunctionScope['block'],
    isMethodDefinition: boolean,
  ): Scope {
    assert(this.currentScope);
    return this.nestScope(
      new FunctionScope(this, this.currentScope, node, isMethodDefinition),
    );
  }

  public nestFunctionTypeScope(node: FunctionTypeScope['block']): Scope {
    assert(this.currentScope);
    return this.nestScope(new FunctionTypeScope(this, this.currentScope, node));
  }

  public nestGlobalScope(node: GlobalScope['block']): Scope {
    return this.nestScope(new GlobalScope(this, node));
  }

  public nestMappedTypeScope(node: MappedTypeScope['block']): Scope {
    assert(this.currentScope);
    return this.nestScope(new MappedTypeScope(this, this.currentScope, node));
  }

  public nestModuleScope(node: ModuleScope['block']): Scope {
    assert(this.currentScope);
    return this.nestScope(new ModuleScope(this, this.currentScope, node));
  }

  public nestSwitchScope(node: SwitchScope['block']): Scope {
    assert(this.currentScope);
    return this.nestScope(new SwitchScope(this, this.currentScope, node));
  }

  public nestTSEnumScope(node: TSEnumScope['block']): Scope {
    assert(this.currentScope);
    return this.nestScope(new TSEnumScope(this, this.currentScope, node));
  }

  public nestTSModuleScope(node: TSModuleScope['block']): Scope {
    assert(this.currentScope);
    return this.nestScope(new TSModuleScope(this, this.currentScope, node));
  }

  public nestTypeScope(node: TypeScope['block']): Scope {
    assert(this.currentScope);
    return this.nestScope(new TypeScope(this, this.currentScope, node));
  }

  public nestWithScope(node: WithScope['block']): Scope {
    assert(this.currentScope);
    return this.nestScope(new WithScope(this, this.currentScope, node));
  }
}

export { ScopeManager };
