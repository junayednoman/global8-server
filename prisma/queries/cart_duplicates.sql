SELECT
  "cartId",
  "productId",
  COUNT(*) AS duplicate_count
FROM "cart_item"
GROUP BY "cartId", "productId"
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;
