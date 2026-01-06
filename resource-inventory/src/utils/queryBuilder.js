
/**
 * @description Build MongoDB filter, sort, and pagination options from request query parameters
 * Supports:
 * - limit
 * - offset
 * - sort (e.g. ?sort=-name or ?sort=+id)
 * - Comparison operators (.gt, .gte, .lt, .lte)
 * - Regex search (e.g. ?name.regex=^abc$)
 */

const buildQuery = (reqQuery) => {
  const limit = parseInt(reqQuery.limit, 10) || 20;
  const offset = parseInt(reqQuery.offset, 10) || 0;

  // Default sort by createdAt DESC (newest first)
  let sort = { createdAt: -1 };

  // If custom sort provided
  if (reqQuery.sort) {
    const direction = reqQuery.sort.startsWith('-') ? -1 : 1;
    const field = reqQuery.sort.replace(/^[-+]/, '');
    sort = { [field]: direction };
  }

  const filter = {};

  // Build dynamic filters
  for (const key in reqQuery) {
    if (['limit', 'offset', 'sort'].includes(key)) continue;

    if (key.includes('.')) {
      const [field, operator] = key.split('.');
      switch (operator) {
        case 'gt':
          filter[field] = { ...filter[field], $gt: reqQuery[key] };
          break;
        case 'gte':
          filter[field] = { ...filter[field], $gte: reqQuery[key] };
          break;
        case 'lt':
          filter[field] = { ...filter[field], $lt: reqQuery[key] };
          break;
        case 'lte':
          filter[field] = { ...filter[field], $lte: reqQuery[key] };
          break;
        case 'regex':
          try {
            filter[field] = { $regex: new RegExp(reqQuery[key], 'i') };
          } catch (e) {
            console.error('Invalid regex pattern:', reqQuery[key]);
          }
          break;
      }
    } else {
      filter[key] = reqQuery[key];
    }
  }

  return {
    filter,
    queryOptions: {
      skip: offset,
      limit,
      sort,
    },
  };
};

module.exports = { buildQuery };