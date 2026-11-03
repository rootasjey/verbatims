<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
await navigateTo('/admin/tools?open=maintenance', { replace: true })
</script>
