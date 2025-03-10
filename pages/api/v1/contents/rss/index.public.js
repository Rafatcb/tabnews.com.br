import { createRouter } from 'next-connect';

import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import content from 'models/content.js';
import controller from 'models/controller.js';
import rss from 'models/rss';
import user from 'models/user.js';

export default createRouter()
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .use(cacheControl.swrMaxAge(60))
  .get(handleRequest)
  .handler(controller.handlerOptions);

async function handleRequest(request, response) {
  const userTryingToList = user.createAnonymous();

  const results = await content.findWithStrategy({
    strategy: 'new',
    where: {
      parent_id: null,
      status: 'published',
      type: 'content',
    },
    page: 1,
    per_page: 30,
  });

  const contentListFound = results.rows;

  const secureContentListFound = authorization.filterOutput(userTryingToList, 'read:content:list', contentListFound);
  const rss2 = rss.generateRss2(secureContentListFound);

  response.setHeader('Content-Type', 'text/xml; charset=utf-8');
  response.status(200).send(rss2);
}
