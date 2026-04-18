<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const props = defineProps({
  churches: { type: Array, required: true },
  userPosition: { type: Object, default: null },
  nearestChurchId: { type: Number, default: null },
})

const mapRoot = ref(null)
let map
let churchMarkers = []
let userMarker = null
let userCircle = null

function initMap() {
  map = L.map(mapRoot.value).setView([-12.05, -77.12], 12)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)
  renderChurches()
}

function renderChurches() {
  churchMarkers.forEach(marker => marker.remove())
  churchMarkers = props.churches.map(church => {
    const isNearest = church.id === props.nearestChurchId
    const marker = L.marker([church.lat, church.lng]).addTo(map)
    marker.bindPopup(`
      <strong>${church.name}</strong><br>
      ${church.address}<br>
      ${isNearest ? '<span style="color:#16a34a">Iglesia más cercana</span>' : ''}
    `)
    return marker
  })
}

function renderUser() {
  if (!map || !props.userPosition) return

  const { lat, lng } = props.userPosition

  if (userMarker) userMarker.remove()
  if (userCircle) userCircle.remove()

  userMarker = L.marker([lat, lng]).addTo(map).bindPopup('Tu ubicación actual')
  userCircle = L.circle([lat, lng], { 
    radius: 150,
    color: '#ff0000',
    weight: 2,
    opacity: 0.8,
    fill: true,
    fillColor: '#ff0000',
    fillOpacity: 0.2
  }).addTo(map)

  map.setView([lat, lng], 14)
}

onMounted(() => initMap())
onBeforeUnmount(() => map?.remove())
watch(() => props.nearestChurchId, renderChurches)
watch(() => props.userPosition, renderUser, { deep: true })
</script>

<template>
  <div ref="mapRoot" class="map"></div>
</template>

<style scoped>
.map {
  width: 100%;
  height: 400px;
  border-radius: 20px;
  overflow: hidden;
}
</style>
