export const useDashboardLongPress = <T>(onLongPress: (value: T) => void, delay = 520) => {
  let timer: ReturnType<typeof setTimeout> | undefined
  let startX = 0
  let startY = 0
  const triggered = ref(false)

  const clear = () => {
    if (timer) clearTimeout(timer)
    timer = undefined
  }

  const start = (event: PointerEvent, value: T) => {
    clear()
    triggered.value = false
    if (event.pointerType !== 'touch') return
    startX = event.clientX
    startY = event.clientY
    timer = setTimeout(() => {
      triggered.value = true
      onLongPress(value)
    }, delay)
  }

  const move = (event: PointerEvent) => {
    if (!timer) return
    if (Math.hypot(event.clientX - startX, event.clientY - startY) > 12) clear()
  }

  const end = () => clear()

  const handleContextMenu = (event: MouseEvent, value: T) => {
    if (!import.meta.client || !window.matchMedia('(max-width: 767px)').matches) return
    event.preventDefault()
    triggered.value = true
    onLongPress(value)
  }

  const suppressLongPressClick = (event: MouseEvent) => {
    if (!triggered.value) return
    event.preventDefault()
    event.stopPropagation()
    triggered.value = false
  }

  onBeforeUnmount(clear)

  return { start, move, end, handleContextMenu, suppressLongPressClick }
}
