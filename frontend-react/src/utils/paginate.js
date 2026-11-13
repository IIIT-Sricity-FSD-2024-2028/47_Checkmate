/**
 * Cuts one page out of a list. A plain function, not a hook: the page number
 * itself lives in the page's own useState.
 *
 *   const [page, setPage] = useState(1);
 *   const pageInfo = paginate(filteredRows, page);
 *   <DataTable rows={pageInfo.items} />
 *   <Pagination {...pageInfo} onPageChange={setPage} />
 *
 * If the list shrank (a filter, a deletion), the page is pulled back into range,
 * so you never land on an empty page.
 */
export function paginate(list, page, pageSize = 10) {
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: list.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total: list.length,
    totalPages,
  };
}
