import { debounceIdle } from '@theme/utils/debounce-idle'
import { isOverlap } from '@theme/utils/is-overlap'
import { useData } from 'vitepress'
import {
  onBeforeUnmount,
  onMounted,
  ShallowRef,
  shallowRef,
  watch,
} from 'vue'

const getNavContainer = (): HTMLElement | null =>
  document.querySelector('aside.VPSidebar')

const setActiveNavVisible = debounceIdle((isFirst = false) => {
  const container = getNavContainer()
  if (!container) return
  const activeNav = container.querySelector('a.link.active')
  if (!activeNav) return
  const { top, bottom } = container.getBoundingClientRect()
  const {
    top: navTop,
    bottom: navBottom,
    height,
  } = activeNav.getBoundingClientRect()

  if (isOverlap([top + height, bottom - height], [navTop, navBottom]))
    return
  if (
    activeNav.scrollIntoView &&
    (isFirst ||
      !isOverlap(
        [top - 5 * height, bottom + 5 * height],
        [navTop, navBottom],
      ))
  ) {
    activeNav.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  } else if (navBottom <= top) {
    container.scrollTop += -top + navTop
  } else if (navTop >= bottom) {
    container.scrollTop += -bottom + navBottom
  } else if (navTop < top) {
    container.scrollTop += -top + navTop
  } else if (navBottom > bottom) {
    container.scrollTop += -bottom + navBottom
  }
}, 500)

const isNav = (ele: HTMLElement | null): boolean =>
  Boolean(
    ele?.tagName === 'A' &&
      ele.className?.includes('link') &&
      ele.getAttribute?.('href'),
  )

const suffixReg = /\.[a-z]+$/

const useClickedHref = (): [
  ShallowRef<string, string>,
  (v: string) => void,
] => {
  const href = shallowRef('')
  const setHref = (v: string) => {
    href.value = v
  }
  const handler = (event: PointerEvent) => {
    const target = event.target as HTMLElement
    const nav = [target, target?.parentElement].find(isNav)
    if (nav) {
      setHref(
        nav
          .getAttribute('href')
          ?.replace(suffixReg, '')
          .replace(/^\//, '') || '',
      )
    }
  }
  onMounted(() => {
    getNavContainer()?.addEventListener('click', handler, true)
  })
  onBeforeUnmount(() => {
    getNavContainer()?.removeEventListener('click', handler, true)
  })
  return [href, setHref]
}

export const ensureActiveNumVisible = () => {
  const { page } = useData()
  const [href, setHref] = useClickedHref()

  onMounted(() => {
    watch(
      () => page.value.relativePath,
      (relativePath, old) => {
        if (href.value !== relativePath?.replace(suffixReg, '')) {
          setActiveNavVisible(!old)
        }
        setHref('')
      },
      {
        flush: 'post',
        immediate: true,
      },
    )
  })
}
