import {parentPort} from 'node:worker_threads';
globalThis.self={postMessage:(value,transfer)=>parentPort.postMessage(value,transfer)};
await import('../dist/scene-worker.js');
parentPort.on('message',message=>self.onmessage({data:message}));
