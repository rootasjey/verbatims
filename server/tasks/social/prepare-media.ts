import { prepareSocialCardAssets } from '../../utils/social-card-assets'

export default defineTask({
  meta: {
    name: 'social:prepare-media',
    description: 'Pre-render and store images for queued themes, portraits and works'
  },
  async run() {
    return prepareSocialCardAssets()
  }
})
