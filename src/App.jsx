import { useEffect, useRef, useState } from 'react'

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const calendarDays = Array.from({ length: 30 }, (_, index) => ({
  day: index + 1,
  weekDay: weekDays[index % weekDays.length],
}))

function App() {
  const fileInputRef = useRef(null)
  const calendarPhotosRef = useRef({})
  const selectedDayRef = useRef(null)
  const [calendarPhotos, setCalendarPhotos] = useState({})
  const [exportError, setExportError] = useState('')
  const [exportMessage, setExportMessage] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    calendarPhotosRef.current = calendarPhotos
  }, [calendarPhotos])

  useEffect(() => {
    return () => {
      Object.values(calendarPhotosRef.current).forEach(({ imageUrl }) => {
        URL.revokeObjectURL(imageUrl)
      })
    }
  }, [])

  const calendarStateForExport = calendarDays.map(({ day, weekDay }) => ({
    day,
    weekDay,
    photo: calendarPhotos[day] ?? null,
  }))

  function openPhotoPicker(day) {
    selectedDayRef.current = day
    fileInputRef.current?.click()
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0]
    const day = selectedDayRef.current

    if (!file || !day) {
      return
    }

    setCalendarPhotos((currentPhotos) => {
      if (currentPhotos[day]) {
        URL.revokeObjectURL(currentPhotos[day].imageUrl)
      }

      return {
        ...currentPhotos,
        [day]: {
          file,
          fileName: file.name,
          imageUrl: URL.createObjectURL(file),
        },
      }
    })

    event.target.value = ''
  }

  async function downloadCalendar() {
    if (isDownloading) {
      return
    }

    setExportError('')
    setExportMessage('')
    setIsDownloading(true)

    try {
      const canvas = await createCalendarCanvas(calendarStateForExport)
      const link = document.createElement('a')

      link.download = 'photo-calendar.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
      setExportMessage('Календарь готов: файл photo-calendar.png скачивается.')
    } catch (error) {
      console.error('Не удалось скачать календарь:', error)
      setExportError(
        'Не удалось скачать календарь. Попробуй обновить страницу или уменьшить размер фотографий.',
      )
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f4ef] px-6 py-16 text-[#2f2a27]">
      <input
        accept="image/*"
        className="hidden"
        onChange={handlePhotoChange}
        ref={fileInputRef}
        type="file"
      />

      <section className="mx-auto max-w-3xl text-center">
        <p className="mb-5 text-sm font-medium uppercase tracking-[0.24em] text-[#b58a73]">
          Фото-календарь
        </p>
        <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">
          Твоя жизнь ярче, чем кажется
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#6f635d] sm:text-xl">
          Загрузи свои фотографии в календарь и создай личный архив
          воспоминаний, который можно скачать и сохранить навсегда.
        </p>
        <div className="mt-10 flex justify-center">
          <button
            className="rounded-full bg-[#2f2a27] px-8 py-4 text-base font-semibold text-white shadow-xl shadow-[#2f2a27]/10 transition hover:-translate-y-0.5 hover:bg-[#4a403b] focus:outline-none focus:ring-4 focus:ring-[#d9b9a6] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isDownloading}
            onClick={downloadCalendar}
            type="button"
          >
            {isDownloading ? 'Готовим файл...' : 'Скачать календарь'}
          </button>
        </div>
        {(exportMessage || exportError) && (
          <p
            className={`mx-auto mt-4 max-w-xl text-sm ${
              exportError ? 'text-red-700' : 'text-[#6f635d]'
            }`}
            role="status"
          >
            {exportError || exportMessage}
          </p>
        )}
      </section>

      <section className="mx-auto mt-16 max-w-5xl">
        <div className="grid grid-cols-2 gap-3 rounded-[2rem] bg-[#f8f4ef] p-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
          {calendarStateForExport.map(({ day, weekDay, photo }) => (
            <button
              aria-label={`Загрузить фото для дня ${day}`}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-[#eadbd0] bg-white/70 p-4 text-left shadow-sm shadow-[#8f6d5e]/5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#8f6d5e]/10 focus:outline-none focus:ring-4 focus:ring-[#d9b9a6]"
              key={day}
              onClick={() => openPhotoPicker(day)}
              type="button"
            >
              {photo && (
                <img
                  alt={photo.fileName}
                  className="absolute inset-0 h-full w-full object-cover"
                  src={photo.imageUrl}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/50 opacity-0 transition group-hover:opacity-100" />
              <div
                className={`absolute inset-0 ${
                  photo ? 'bg-black/25' : 'bg-transparent'
                }`}
              />
              <div className="relative z-10 flex h-full flex-col justify-between">
                <span
                  className={`text-sm font-medium ${
                    photo ? 'text-white' : 'text-[#b58a73]'
                  }`}
                >
                  {weekDay}
                </span>
                <span
                  className={`text-3xl font-semibold ${
                    photo ? 'text-white' : 'text-[#2f2a27]'
                  }`}
                >
                  {day}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}

async function createCalendarCanvas(calendarState) {
  const columns = 6
  const cellSize = 220
  const gap = 16
  const padding = 32
  const rows = Math.ceil(calendarState.length / columns)
  const width = padding * 2 + columns * cellSize + (columns - 1) * gap
  const height = padding * 2 + rows * cellSize + (rows - 1) * gap
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  canvas.width = width
  canvas.height = height

  context.fillStyle = '#f8f4ef'
  context.fillRect(0, 0, width, height)

  for (const [index, { day, weekDay, photo }] of calendarState.entries()) {
    const column = index % columns
    const row = Math.floor(index / columns)
    const x = padding + column * (cellSize + gap)
    const y = padding + row * (cellSize + gap)

    drawRoundedRect(context, x, y, cellSize, cellSize, 24)
    context.fillStyle = '#fffaf6'
    context.fill()
    context.strokeStyle = '#eadbd0'
    context.lineWidth = 2
    context.stroke()

    if (photo?.imageUrl) {
      const image = await loadImage(photo.imageUrl)

      context.save()
      drawRoundedRect(context, x, y, cellSize, cellSize, 24)
      context.clip()
      drawImageCover(context, image, x, y, cellSize, cellSize)
      context.fillStyle = 'rgba(0, 0, 0, 0.28)'
      context.fillRect(x, y, cellSize, cellSize)
      context.restore()
    }

    context.fillStyle = photo ? '#ffffff' : '#b58a73'
    context.font = '600 24px system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
    context.textBaseline = 'top'
    context.fillText(weekDay, x + 22, y + 22)

    context.fillStyle = photo ? '#ffffff' : '#2f2a27'
    context.font = '700 54px system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
    context.textBaseline = 'bottom'
    context.fillText(String(day), x + 22, y + cellSize - 20)
  }

  return canvas
}

function drawRoundedRect(context, x, y, width, height, radius) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(x + width - radius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + radius)
  context.lineTo(x + width, y + height - radius)
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  context.lineTo(x + radius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
}

function drawImageCover(context, image, x, y, width, height) {
  const imageRatio = image.width / image.height
  const cellRatio = width / height
  const drawWidth = imageRatio > cellRatio ? height * imageRatio : width
  const drawHeight = imageRatio > cellRatio ? height : width / imageRatio
  const drawX = x + (width - drawWidth) / 2
  const drawY = y + (height - drawHeight) / 2

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight)
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

export default App
