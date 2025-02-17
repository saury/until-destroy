import {
  InjectableType,
  ɵComponentType as ComponentType,
  ɵDirectiveType as DirectiveType,
  ɵComponentDef as ComponentDef,
  ɵDirectiveDef as DirectiveDef
} from '@angular/core';
import { Subject } from 'rxjs';

export function isFunction(target: unknown) {
  return typeof target === 'function';
}

/**
 * Applied to instances and stores `Subject` instance when
 * no custom destroy method is provided.
 */
const DESTROY: unique symbol = Symbol('__destroy');

/**
 * Applied to definitions and informs that class is decorated
 */
const DECORATOR_APPLIED: unique symbol = Symbol('__decoratorApplied');

const NG_COMPONENT_DEF = 'ɵcmp';
const NG_DIRECTIVE_DEF = 'ɵdir';

/**
 * If we use the `untilDestroyed` operator multiple times inside the single
 * instance providing different `destroyMethodName`, then all streams will
 * subscribe to the single subject. If any method is invoked, the subject will
 * emit and all streams will be unsubscribed. We wan't to prevent this behavior,
 * thus we store subjects under different symbols.
 */
export function getSymbol<T>(destroyMethodName?: keyof T): symbol {
  if (typeof destroyMethodName === 'string') {
    return Symbol(`__destroy__${destroyMethodName}`);
  } else {
    return DESTROY;
  }
}

export function missingDecorator(
  providerOrDef: InjectableType<unknown> | DirectiveDef<unknown> | ComponentDef<unknown>
): boolean {
  return !(providerOrDef as any)[DECORATOR_APPLIED];
}

export function markAsDecorated(
  providerOrDef: InjectableType<unknown> | DirectiveDef<unknown> | ComponentDef<unknown>
): void {
  (providerOrDef as any)[DECORATOR_APPLIED] = true;
}

export interface UntilDestroyOptions {
  blackList?: string[];
  arrayName?: string;
  checkProperties?: boolean;
}

export function ensureClassIsDecorated(instance: any): never | void {
  const constructor = instance.constructor;
  const providerOrDef = isInjectableType(constructor) ? constructor : getDef(constructor);

  if (missingDecorator(providerOrDef)) {
    throw new Error(
      'untilDestroyed operator cannot be used inside directives or ' +
        'components or providers that are not decorated with UntilDestroy decorator'
    );
  }
}

export function createSubjectOnTheInstance(instance: any, symbol: symbol): void {
  if (!instance[symbol]) {
    instance[symbol] = new Subject<void>();
  }
}

export function completeSubjectOnTheInstance(instance: any, symbol: symbol): void {
  if (instance[symbol]) {
    instance[symbol].next();
    instance[symbol].complete();
    // We also have to re-assign this property thus in the future
    // we will be able to create new subject on the same instance.
    instance[symbol] = null;
  }
}

/**
 * As directive and component definitions are considered private API,
 * so those properties are prefixed with Angular's marker for "private"
 */
export function getDef<T>(
  type: DirectiveType<T> | ComponentType<T>
): DirectiveDef<T> | ComponentDef<T> {
  return (
    (type as ComponentType<T>)[NG_COMPONENT_DEF] ||
    (type as DirectiveType<T>)[NG_DIRECTIVE_DEF]
  );
}

export function getDefName<T>(type: DirectiveType<T> | ComponentType<T>) {
  if (type.hasOwnProperty(NG_COMPONENT_DEF)) {
    return NG_COMPONENT_DEF;
  } else {
    return NG_DIRECTIVE_DEF;
  }
}

/**
 * Determines whether the provided `target` is some function
 * decorated with `@Injectable()`
 */
export function isInjectableType(target: any): target is InjectableType<unknown> {
  return !!target.ɵprov;
}
