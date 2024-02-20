export const getSearchUrl = (query: string, search_uuid: string) => {
  const prefix = process.env.NODE_ENV === "production" ? "/search" : "/search";
  return `${prefix}?q=${encodeURIComponent(query)}&rid=${search_uuid}`;
};
