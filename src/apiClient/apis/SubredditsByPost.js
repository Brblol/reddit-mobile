import isEmpty from 'lodash/isEmpty';

import apiRequest from '../apiBase/apiRequest';
import Subreddit from '../models/Subreddit';

const parseBody = (apiResponse) => {
  const { body } = apiResponse.response;

  if (body.data && Array.isArray(body.data.children)) {
    body.data.children.forEach(c => apiResponse.addResult(Subreddit.fromJSON(c.data)));
    // sometimes, we get back empty object and 200 for invalid sorts like
    // `mine` when logged out
  } else if (!isEmpty(body)) {
    apiResponse.addResult(Subreddit.fromJSON(body.data || body));
  }

  return apiResponse;
};

const get = (apiOptions, query) => {
  return apiRequest(apiOptions, 'GET', 'api/subreddits_by_link.json', { 'query': {...query, raw_json: 1} })
    .then(parseBody);
};

export default { get };
