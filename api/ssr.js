import { reqHandler } from '../dist/porfolio/server/server.mjs';

export default import('../dist/porfolio/server/server.mjs')
  .then(module => module.reqHandler);