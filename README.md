# libxget-js

> Non-interractive, chunk-based, web content retriever

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]

[![NPM][npm-image-url]][npm-url]

## Installing

Via [NPM][npm]:

``` bash
npm install libxget
```

This installs a CLI binary accessible with the `xget` command.

``` bash
# Check if the xget command has been installed and accessible on your path
$ xget -V
v0.5.1
```

## Usage

### CLI

The `xget` command, utilizes the library to retrieve web content by its chunks according to specification

``` bash
# Normal
xget https://google.com/doodle.png

# Write to output file
xget https://google.com/doodle.png image.png

# Piping output
xget https://myserver.io/runtime.log --no-bar | less

# Stream response in real time (e.g Watching the movie)
xget https://service.com/movie.mp4 | vlc -
```

Use `--help` to see full usage documentation.

### Programmatically

``` javascript
// Node CommonJS
const xget = require('libxget');
// Or ES6 Modules
import xget from 'libxget';
// Or Typescript
import * as xget from 'libxget';
```

#### Examples

``` javascript
xget(
  'https://github.com/microsoft/TypeScript/archive/master.zip',
  {chunks: 10, retries: 10}
).pipe(fs.createWriteStream('master.zip'));
```

Get the master branch of the Typescript repository.
With 10 simultaneous downloads. Retrying each one to a max of 10.

## API

### xget(url[, options])

* `url`: &lt;[string][]&gt;
* `options`: &lt;[XGETOptions](#xgetoptions)&gt;
* Returns: &lt;[XGETStream](#xgetstream)&gt;

### <a id='xgetoptions'></a> XGETOptions <sub>`extends`</sub> [RequestOpts][]: [`Object`][object]

* `chunks`: &lt;[number][]&gt; Number of chunked-simultaneous downloads. **Default**: `5`
* `retries`: &lt;[number][]&gt; Number of retries for each chunk. **Default**: `5`
* `timeout`: &lt;[number][]&gt; Network response timeout (ms). **Default**: `20000`
* `start`: &lt;[number][]&gt; Position to start feeding the stream from. **Default**: `0`
* `size`: &lt;[number][]&gt; Number of bytes to stream off the response.
* `hash`: &lt;[string][]&gt; Hash algorithm to use to create a [crypto.Hash][] instance computing the stream hash.
* `use`: &lt;[object][]&gt; Key-value pairs of middlewares with which to pipe the response object through. keys are [strings][string], values are [Transformer generating functions](#usemiddlewarefn) (Alternatively, use the [xget.use()](#xgetuse) method).
* `with`: &lt;[object][]&gt; Key-value pairs of middlewares with which to pipe the dataslice object through. keys are [strings][string], values are [functions][function] whose return values are accessible within the [store](#storestack). (Alternatively, use the [xget.with()](#xgetwith) method).

### <a id='xgetstore'></a> xget.store: [`Map`][map]

A map whose keys and values are tags and return types of content processed within the withStack of the xget object.

``` javascript
xget(URL)
  .with('variable', () => 5)
  .once('set', store => {
    /*
      `store` is a map whose key and values directly match tags and return types within
       > a with call or the with object in the xget options
    */
    console.log(store.get('variable')) // 5
  })
  .pipe(FILE);
```

### xget.ended: [`Boolean`][boolean]

A readonly property that tells whether or not the xget instance has ended.

### xget.loaded: [`Boolean`][boolean]

A readonly property that tells whether or not the xget instance has been loaded.

### xget.bytesRead: [`Number`][number]

A readonly property that tells how many bytes has been processed by the underlying streams.

### <a id='xgetstream'></a> Class: XGETStream <sub>`extends`</sub> [stream.Readable][]

The core multi-chunk request instance.

### new xget.XGETStream(url[, options])

* `url`: &lt;[string][]&gt;
* `options`: &lt;[XGETOptions](#xgetoptions)&gt;
* Returns: &lt;[XGETStream](#xgetstream)&gt;

### xget.getHash([encoding])

* `encoding`: &lt;[string][]&gt; The character encoding to use. **Default**: `'hex'`
* Returns: &lt;[Buffer][]&gt; | &lt;[string][]&gt;

Calculates the digest of all data that has been processed by the library and its middleware transformers.
This, creates a deep copy of the internal state of the current [crypto.Hash][] object of which it calculates the digest.

This ensures you can get a hash of an instancce of the data even while still streaming from the URL response.

### xget.getHashAlgorithm()

* Returns: &lt;[string][]&gt;

Returns the hash algorithm if any is in use.

### <a id='xgetuse'></a> xget.use(tag, handler)

* `tag`: &lt;[string][]&gt;
* `handler`: &lt;[UseMiddlewareFn](#usemiddlewarefn)&gt;
* Returns: &lt;[XGETStream](#xgetstream)&gt;

Add a named handler to the use middleware stack whose return value would be used to transform the response stream in a series of pipes.

The `handler` method is called after the stream is requested from and we start pumping the underlying `request` instances for a data response stream.

The core expects the `handler` to return a [stream.Duplex] instance. (A readable, writable stream) to transform or passthrough the raw data streams along the way.

``` javascript
// Example, compressing the response content in real time
xget(URL)
  .use('compressor', () => zlib.createGzip())
  .pipe(fs.createWriteStream(FILE))
```

### <a id='xgetwith'></a> xget.with(tag, handler)

* `tag`: &lt;[string][]&gt;
* `handler`: &lt;[WithMiddlewareFn](#withmiddlewarefn)&gt;
* Returns: &lt;[XGETStream](#xgetstream)&gt;

Add a named `handler` to the with middleware stack whose return value would be stored within the [store](#xgetstore) after execution.

``` javascript
xget(URL)
  .with('bar', ({size}) => progressBar(size)) // Create a finite-sized progress bar
  .use('bar', (_, store) => store.get('bar').genStream()) // Create a stream handling object that updates the progressbar from the number of bytes flowing through itself
  .once('set', store => store.get('bar').print('Downloading...'))
  .pipe(FILE);
```

### <a id='chunkloadinstance'></a> ChunkLoadInstance: [`Object`][object]

* `min`: &lt;[number][]&gt; The minimum extent for the chunk segment range.
* `max`: &lt;[number][]&gt; The maximum extent for the chunk segment range.
* `size`: &lt;[number][]&gt; The total size of the chunk segment.
* `stream`: &lt;[ResilientStream][ResilientStream]&gt; A resilient stream that wraps around a request instance.

### <a id='withmiddlewarefn'></a> WithMiddlewareFn: [`Function`][function]

* `loadData`: &lt;[object][]&gt;
  * `url`: &lt;[string][]&gt; The URL specified.
  * `size`: &lt;[number][]&gt; Finite number returned if server responds appropriately, else `Infinity`.
  * `start`: &lt;[number][]&gt; Sticks to specification if server allows chunking via `content-ranges` else, resets to `0`.
  * `chunkable`: &lt;[number][]&gt; Whether or not the URL feed can be chunked, supporting simultaneous connections.
  * `chunkStack`: &lt;[ChunkLoadInstance](#chunkloadinstance)[]&gt; The chunkstack array.

This `handler` is called immediately after metadata from URL is loaded that describes the response.
That is, pre-streaming data from the HEAD like size (content-length), content-type, filename (content-disposition), whether or not it's chunkable (accept-ranges) and a couple of other criterias.

This information is passed into a handler whose return value is filed within the [store](#xgetstore) referenced by the `tag`.

### <a id='usemiddlewarefn'></a> UseMiddlewareFn: [`Function`][function]

* `dataSlice`: &lt;[ChunkLoadInstance](#chunkloadinstance)&gt;
* `store`: &lt;[xget.store](#xgetstore)&gt;
* Returns: &lt;[stream.Duplex][]&gt;

## ClI Info

* To avoid the terminal being cluttered while using pipes, direct other chained binaries' `stdout` and `stderr` to `/dev/null`

``` bash
# Watching from a stream, hiding vlc's log information
xget https://myserver.com/movie.mp4 | vlc - > /dev/null 2>&1
```

## Development

### Building

Feel free to clone, use in adherance to the [license](#license) and perhaps send pull requests

``` bash
git clone https://github.com/miraclx/libxget-js.git
cd libxget-js
npm install
# hack on code
npm run build
```

## License

[Apache 2.0][license] © **Miraculous Owonubi** ([@miraclx][author-url]) &lt;omiraculous@gmail.com&gt;

[npm]:  https://github.com/npm/cli "The Node Package Manager"
[license]:  LICENSE "Apache 2.0 License"
[author-url]: https://github.com/miraclx

[npm-url]: https://npmjs.org/package/libxget
[npm-image]: https://badgen.net/npm/node/libxget
[npm-image-url]: https://nodei.co/npm/libxget.png?stars&downloads
[downloads-url]: https://npmjs.org/package/libxget
[downloads-image]: https://badgen.net/npm/dm/libxget

[RequestOpts]: https://github.com/request/request#requestoptions-callback
[ResilientStream]: https://github.com/miraclx/xresilient#resilientstream

[Buffer]: https://nodejs.org/api/buffer.html#buffer_class_buffer
[crypto.Hash]: https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm_options
[stream.Duplex]: https://nodejs.org/api/stream.html#stream_new_stream_duplex_options
[stream.Readable]: https://nodejs.org/api/stream.html#stream_class_stream_readable

[map]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type
[object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function
