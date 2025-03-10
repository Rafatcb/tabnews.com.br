import { createRouter } from 'next-connect';

import { NotFoundError } from 'errors';
import cacheControl from 'models/cache-control';
import content from 'models/content.js';
import controller from 'models/controller';
import thumbnail from 'models/thumbnail.js';
import validator from 'models/validator.js';

export default createRouter()
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .use(cacheControl.swrMaxAge(60))
  .get(getValidationHandler, getHandler)
  .handler(controller.handlerOptions);

function getValidationHandler(request, response, next) {
  const cleanValues = validator(request.query, {
    username: 'required',
    slug: 'required',
  });

  request.query = cleanValues;

  return next();
}

async function getHandler(request, response) {
  const contentFound = await content.findOne({
    where: {
      owner_username: request.query.username,
      slug: request.query.slug,
      status: 'published',
    },
  });

  if (!contentFound) {
    throw new NotFoundError({
      message: `Este conteúdo não está disponível.`,
      action: 'Verifique se o "slug" está digitado corretamente ou considere o fato do conteúdo ter sido despublicado.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:CONTENT:THUMBNAIL:GET_HANDLER:SLUG_NOT_FOUND',
      key: 'slug',
    });
  }

  const thumbnailPng = await thumbnail.asPng(contentFound);

  response.statusCode = 200;
  response.setHeader('Content-Type', `image/png`);
  response.end(thumbnailPng);
}
