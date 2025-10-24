import './styles/index.css'
import { h, App, defineComponent } from 'vue'
import { VPTheme } from '@vue/theme'
import { filterHeadersByPreference } from './components/preferences'
import NavbarTitle from './components/NavbarTitle.vue'
import ScrimbaLink from './components/ScrimbaLink.vue'
import { ensureActiveNumVisible } from './hooks/ensure-active-nav-visible'

import 'vitepress/dist/client/theme-default/styles/components/vp-code-group.css'
import 'virtual:group-icons.css'

export default Object.assign({}, VPTheme, {
  Layout: defineComponent({
    setup() {
      ensureActiveNumVisible()
      return () =>
        h(VPTheme.Layout, null, {
          'navbar-title': () => h(NavbarTitle),
          // banner: () => h(Banner),
          // 'sidebar-top': () => h(PreferenceSwitch),
          // 'sidebar-bottom': () => h(SecurityUpdateBtn),
          // 'aside-mid': () => h(SponsorsAside),
          // 'aside-bottom': () => h(WwAds)
        })
    },
  }),
  enhanceApp({ app }: { app: App }) {
    app.provide('filter-headers', filterHeadersByPreference)
    app.component('ScrimbaLink', ScrimbaLink)
  },
})
