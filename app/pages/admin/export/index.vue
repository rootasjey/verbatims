<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
await navigateTo('/admin/tools?open=export', { replace: true })
</script>
