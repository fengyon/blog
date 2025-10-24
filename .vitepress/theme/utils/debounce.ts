export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): ((...args: Parameters<T>) => void) => {
  let timer: NodeJS.Timeout | null = null
  function debounced(this: ThisType<T>,...args: Parameters<T>) {
    timer && clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }

  return debounced
}
