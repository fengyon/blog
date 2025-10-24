import { debounce } from './debounce'

export const debounceIdle =
  typeof requestIdleCallback !== 'function'
    ? debounce
    : <T extends (...args: any[]) => any>(
        fn: T,
        delay: number,
      ): ((...args: Parameters<T>) => void) => {
        let timer = 0
        function debounced(this: ThisType<T>, ...args: Parameters<T>) {
          timer && cancelIdleCallback(timer)
          timer = requestIdleCallback(
            () => {
              fn.apply(this, args)
              timer = 0
            },
            { timeout: delay },
          )
        }

        return debounced
      }
