/// <reference types="node" />
import { PendingOperation } from './PendingOperation';
import { Resource } from './Resource';
export interface PoolOptions<T> {
  create: CallbackOrPromise<T>;
  destroy: (resource: T) => any;
  min: number;
  max: number;
  acquireTimeoutMillis?: number;
  createTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  createRetryIntervalMillis?: number;
  reapIntervalMillis?: number;
  log?: (msg: string) => any;
  validate?: (resource: T) => boolean;
  propagateCreateError?: boolean;
}
export declare class Pool<T> {
  protected min: number;
  protected max: number;
  protected used: Resource<T>[];
  protected free: Resource<T>[];
  protected pendingCreates: PendingOperation<T>[];
  protected pendingAcquires: PendingOperation<T>[];
  protected interval: NodeJS.Timer | null;
  protected destroyed: boolean;
  protected propagateCreateError: boolean;
  protected idleTimeoutMillis: number;
  protected createRetryIntervalMillis: number;
  protected reapIntervalMillis: number;
  protected createTimeoutMillis: number;
  protected acquireTimeoutMillis: number;
  protected log: (msg: string, level: 'warn') => any;
  protected creator: CallbackOrPromise<T>;
  protected destroyer: (resource: T) => any;
  protected validate: (resource: T) => boolean;
  constructor(opt: PoolOptions<T>);
  numUsed(): number;
  numFree(): number;
  numPendingAcquires(): number;
  numPendingCreates(): number;
  acquire(): PendingOperation<T>;
  release(resource: T): boolean;
  isEmpty(): boolean;
  check(): void;
  destroy(): Promise<
    | import('./PromiseInspection').PromiseInspection<{}>
    | import('./PromiseInspection').PromiseInspection<void>
  >;
  _tryAcquireOrCreate(): void;
  _hasFreeResources(): boolean;
  _doAcquire(): void;
  _canAcquire(): boolean;
  _validateResource(resource: T): boolean;
  _shouldCreateMoreResources(): boolean;
  _doCreate(): void;
  _create(): PendingOperation<T>;
  _destroy(resource: T): any;
  _logError(err: Error): void;
  _startReaping(): void;
  _stopReaping(): void;
}
export declare type Callback<T> = (err: Error | null, resource: T) => any;
export declare type CallbackOrPromise<T> = (cb: Callback<T>) => any | (() => Promise<T>);
