export function selectItemsByIds<TItem>(
  ids: readonly number[],
  items: readonly TItem[] | undefined,
  getId: (item: TItem) => number,
) {
  if (!items?.length || ids.length === 0) {
    return [];
  }

  const itemsById = new Map(items.map((item) => [getId(item), item]));
  return ids.map((id) => itemsById.get(id)).filter((item): item is TItem => item !== undefined);
}
