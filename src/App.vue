<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from './components/AppSidebar.vue'

const route = useRoute()
const showSidebar = computed(() => route.path !== '/login')
</script>

<template>
  <div class="layout">
    <AppSidebar v-if="showSidebar" />
    <main :class="showSidebar ? 'content' : 'content-full'">
      <RouterView :key="route.path" />
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  width: 100%;
  min-height: 100vh;
}

.content {
  flex: 1;
  padding: 40px 48px;
  background-color: #f8fafc;
}

.content-full {
  flex: 1;
  background-color: #f8fafc;
}
</style>
