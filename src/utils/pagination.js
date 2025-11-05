const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePagination(query = {}, { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = {}) {
  const rawPage = query.page;
  const rawLimit = query.limit;

  const parsedPage = Number.parseInt(rawPage, 10);
  const parsedLimit = Number.parseInt(rawLimit, 10);

  const hasPage = !Number.isNaN(parsedPage);
  const hasLimit = !Number.isNaN(parsedLimit);

  const usePagination = hasPage || hasLimit;

  const page = hasPage && parsedPage > 0 ? parsedPage : 1;
  const limitCandidate = hasLimit && parsedLimit > 0 ? parsedLimit : defaultLimit;
  const limit = Math.min(Math.max(limitCandidate, 1), maxLimit);
  const offset = (page - 1) * limit;

  return {
    usePagination,
    page,
    limit,
    offset,
  };
}

function buildPagination(page, limit, total) {
  const totalCount = Number.isFinite(total) && total >= 0 ? total : 0;
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / limit);

  return {
    page,
    limit,
    total: totalCount,
    totalPages,
    hasNext: totalCount > page * limit,
    hasPrev: totalCount > 0 && page > 1,
  };
}

module.exports = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  parsePagination,
  buildPagination,
};
