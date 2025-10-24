/**
 * 线段是否重叠
 * @param param0 线段1起始，如 [0,1]
 * @param param1 线段2起始，如 [1,2]
 * @returns 重叠 true
 */
export const isOverlap = (
  [left1, right1]: [number, number],
  [left2, right2]: [number, number],
): boolean =>
  (left1 - left2) * (left1 - right2) <= 0 ||
  (right1 - left2) * (right1 - right2) <= 0 ||
  (left2 - left1) * (left2 - right1) <= 0 ||
  (right2 - left1) * (right2 - right1) <= 0
