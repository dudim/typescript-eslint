import { parse } from './util/parse';
import {
  expectToBeBlockScope,
  expectToBeForScope,
  expectToBeFunctionScope,
  expectToBeGlobalScope,
} from './util/expect';
import { analyze } from '../../src/analyze';
import { VariableType } from '../../src/VariableType';

describe('ES6 iteration scope', () => {
  it('let materialize iteration scope for ForInStatement#1', () => {
    const ast = parse(`
            (function () {
                let i = 20;
                for (let i in i) {
                    console.log(i);
                }
            }());
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(4);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(2);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.variables[1].name).toBe('i');
    expect(scope.references).toHaveLength(1);
    expect(scope.references[0].identifier.name).toBe('i');
    expect(scope.references[0].resolved).toBe(scope.variables[1]);

    const iterScope = (scope = scopeManager.scopes[2]);

    expectToBeForScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('i');
    expect(scope.references).toHaveLength(2);
    expect(scope.references[0].identifier.name).toBe('i');
    expect(scope.references[0].resolved).toBe(scope.variables[0]);
    expect(scope.references[1].identifier.name).toBe('i');
    expect(scope.references[1].resolved).toBe(scope.variables[0]);

    scope = scopeManager.scopes[3];
    expectToBeBlockScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(2);
    expect(scope.references[0].identifier.name).toBe('console');
    expect(scope.references[0].resolved).toBe(null);
    expect(scope.references[1].identifier.name).toBe('i');
    expect(scope.references[1].resolved).toBe(iterScope.variables[0]);
  });

  it('let materialize iteration scope for ForInStatement#2', () => {
    const ast = parse(`
            (function () {
                let i = 20;
                for (let { i, j, k } in i) {
                    console.log(i);
                }
            }());
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(4);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(2);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.variables[1].name).toBe('i');
    expect(scope.references).toHaveLength(1);
    expect(scope.references[0].identifier.name).toBe('i');
    expect(scope.references[0].resolved).toBe(scope.variables[1]);

    const iterScope = (scope = scopeManager.scopes[2]);

    expectToBeForScope(scope);
    expect(scope.variables).toHaveLength(3);
    expect(scope.variables[0].name).toBe('i');
    expect(scope.variables[1].name).toBe('j');
    expect(scope.variables[2].name).toBe('k');
    expect(scope.references).toHaveLength(4);
    expect(scope.references[0].identifier.name).toBe('i');
    expect(scope.references[0].resolved).toBe(scope.variables[0]);
    expect(scope.references[1].identifier.name).toBe('j');
    expect(scope.references[1].resolved).toBe(scope.variables[1]);
    expect(scope.references[2].identifier.name).toBe('k');
    expect(scope.references[2].resolved).toBe(scope.variables[2]);
    expect(scope.references[3].identifier.name).toBe('i');
    expect(scope.references[3].resolved).toBe(scope.variables[0]);

    scope = scopeManager.scopes[3];
    expectToBeBlockScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(2);
    expect(scope.references[0].identifier.name).toBe('console');
    expect(scope.references[0].resolved).toBe(null);
    expect(scope.references[1].identifier.name).toBe('i');
    expect(scope.references[1].resolved).toBe(iterScope.variables[0]);
  });

  it('let materialize iteration scope for ForStatement#2', () => {
    const ast = parse(`
            (function () {
                let i = 20;
                let obj = {};
                for (let { i, j, k } = obj; i < okok; ++i) {
                    console.log(i, j, k);
                }
            }());
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(4);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);

    const functionScope = (scope = scopeManager.scopes[1]);

    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(3);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.variables[1].name).toBe('i');
    expect(scope.variables[2].name).toBe('obj');
    expect(scope.references).toHaveLength(2);
    expect(scope.references[0].identifier.name).toBe('i');
    expect(scope.references[0].resolved).toBe(scope.variables[1]);
    expect(scope.references[1].identifier.name).toBe('obj');
    expect(scope.references[1].resolved).toBe(scope.variables[2]);

    const iterScope = (scope = scopeManager.scopes[2]);

    expectToBeForScope(scope);
    expect(scope.variables).toHaveLength(3);
    expect(scope.variables[0].name).toBe('i');
    expect(scope.variables[0].defs[0].type).toBe(VariableType.Variable);
    expect(scope.variables[1].name).toBe('j');
    expect(scope.variables[1].defs[0].type).toBe(VariableType.Variable);
    expect(scope.variables[2].name).toBe('k');
    expect(scope.variables[2].defs[0].type).toBe(VariableType.Variable);
    expect(scope.references).toHaveLength(7);
    expect(scope.references[0].identifier.name).toBe('i');
    expect(scope.references[0].resolved).toBe(scope.variables[0]);
    expect(scope.references[1].identifier.name).toBe('j');
    expect(scope.references[1].resolved).toBe(scope.variables[1]);
    expect(scope.references[2].identifier.name).toBe('k');
    expect(scope.references[2].resolved).toBe(scope.variables[2]);
    expect(scope.references[3].identifier.name).toBe('obj');
    expect(scope.references[3].resolved).toBe(functionScope.variables[2]);
    expect(scope.references[4].identifier.name).toBe('i');
    expect(scope.references[4].resolved).toBe(scope.variables[0]);
    expect(scope.references[5].identifier.name).toBe('okok');
    expect(scope.references[5].resolved).toBeNull();
    expect(scope.references[6].identifier.name).toBe('i');
    expect(scope.references[6].resolved).toBe(scope.variables[0]);

    scope = scopeManager.scopes[3];
    expectToBeBlockScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(4);
    expect(scope.references[0].identifier.name).toBe('console');
    expect(scope.references[0].resolved).toBeNull();
    expect(scope.references[1].identifier.name).toBe('i');
    expect(scope.references[1].resolved).toBe(iterScope.variables[0]);
    expect(scope.references[2].identifier.name).toBe('j');
    expect(scope.references[2].resolved).toBe(iterScope.variables[1]);
    expect(scope.references[3].identifier.name).toBe('k');
    expect(scope.references[3].resolved).toBe(iterScope.variables[2]);
  });
});