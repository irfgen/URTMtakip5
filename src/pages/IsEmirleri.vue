<template>
  <div class="q-pa-md">
    <div v-if="error" class="text-negative q-mb-md">
      {{ error }}
    </div>

    <q-table
      :loading="loading"
      :rows="isEmirleri"
      // ...existing code...
    >
      // ...existing table template code...
    </q-table>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { api } from 'src/boot/axios'

export default defineComponent({
  name: 'IsEmirleri',
  setup () {
    const loading = ref(true)
    const isEmirleri = ref([])
    const error = ref(null)

    const loadIsEmirleri = async () => {
      try {
        loading.value = true
        error.value = null
        const response = await api.get('/is-emirleri')
        isEmirleri.value = response.data
      } catch (err) {
        error.value = 'İş emirleri yüklenirken bir hata oluştu: ' + (err.message || 'Bilinmeyen hata')
        console.error('İş emirleri yükleme hatası:', err)
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      loadIsEmirleri()
    })

    return {
      loading,
      isEmirleri,
      error,
      // ...existing return properties...
    }
  }
})
</script>
