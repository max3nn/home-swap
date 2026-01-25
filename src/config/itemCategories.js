const ITEM_CATEGORIES = [
  'Books',
  'Clothing',
  'Collectibles',
  'Electronics',
  'Furniture',
  'Games',
  'Garden',
  'Home Decor',
  'Kitchen',
  'Music',
  'Sports',
  'Tools',
  'Toys',
  'Other',
];

const CATEGORY_LOOKUP = new Map(
  ITEM_CATEGORIES.map((category) => [category.toLowerCase(), category])
);

function normalizeCategory(value) {
  if (!value) return '';
  const trimmed = value.toString().trim();
  if (!trimmed) return '';
  return CATEGORY_LOOKUP.get(trimmed.toLowerCase()) || trimmed;
}

function isValidCategory(value) {
  if (!value) return false;
  const trimmed = value.toString().trim();
  if (!trimmed) return false;
  return CATEGORY_LOOKUP.has(trimmed.toLowerCase());
}

module.exports = {
  ITEM_CATEGORIES,
  normalizeCategory,
  isValidCategory,
};
