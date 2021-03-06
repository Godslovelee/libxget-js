// Type definitions for libxget-js
// Project: https://github.com/miraclx/libxget-js
// Definitions by: Miraculous Owonubi <https://github.com/miraclx>

/// <reference types="node" />

import stream = require('stream');
import request = require('request');
import xresilient = require('xresilient');

declare namespace xget {

  interface XgetException extends Error { }

  interface XgetNetException extends XgetException {
    statusCode: number;
    statusMessage: string;
  }

  interface XGETStream extends stream.Readable {
    constructor(url: string, options?: XGETOptions);
    on(event: string, listener: (...args: any[]) => void): this;
    on(event: 'end', listener: () => void): this;
    on(event: 'set', listener: (store: MiddlewareStore) => void): this;
    on(event: 'error', listener: (err: Error | XgetException | XgetNetException) => void): this;
    on(event: 'retry', listener: (slice: RetrySlice) => void): this;
    on(event: 'loaded', listener: (dataSlice: LoadDataSlice) => void): this;
    readonly store: MiddlewareStore;
    readonly ended: false;
    readonly loaded: false;
    readonly bytesRead: number;
    getHash(): Buffer;
    getHash(encoding: string): string;
    getHashAlgorithm(): string;
    use(tag: string, fn: UseMiddlewareFn): this;
    with(tag: string, fn: WithMiddlewareFn): this;
  }

  interface XGETInstance {
    (url: string, options?: XGETOptions): XGETStream;
  }

  interface XGETOptions extends request.CoreOptions {
    use: UseObjectLiteral;
    hash: string;
    size: number;
    with: WithMiddlewareFn;
    start: number;
    chunks: number;
    retries: number;
    timeout: number;
  }

  interface ChunkLoadInstance {
    min: number;
    max: number;
    size: number;
    stream: xresilient.ResilientStream<request.Request>;
  }

  interface RetrySlice extends xresilient.RetrySlice<request.Request> {
    store: MiddlewareStore;
    index: number;
    totalBytes: number;
  }

  interface LoadDataSlice {
    url: string;
    size: number;
    start: number;
    chunkable: boolean;
    chunkStack: ChunkLoadInstance[];
  }

  type MiddlewareStore = Map<string, any>;

  type UseMiddlewareFn = (dataSlice: ChunkLoadInstance, store: MiddlewareStore) => NodeJS.ReadWriteStream;
  type WithMiddlewareFn = (loadData: LoadDataSlice) => any;

  interface UseObjectLiteral {
    [tag: string]: UseMiddlewareFn;
  }
  interface WithObjectLiteral {
    [tag: string]: WithMiddlewareFn;
  }
}

declare let xget: xget.XGETInstance;
export = request;
