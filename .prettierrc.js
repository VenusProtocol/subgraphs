module.exports = {
  ...require('prettier-airbnb-config'),
  trailingComma: 'all',
  bracketSpacing: true,
  importOrder: [
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};
