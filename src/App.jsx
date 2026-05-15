import { useEffect, useRef, useState } from 'react'
import finalCtaBg from './assets/final-cta-bg.png'
import heroPreviewBg from './assets/hero-preview-bg.png'
import rewardModalBg from './assets/reward-modal-bg.png'
import soykaLogoMark from './assets/soyka-logo-mark.svg'

const weekDays = [
  'понедельник',
  'вторник',
  'среда',
  'четверг',
  'пятница',
  'суббота',
  'воскресенье',
]
const calendarDays = Array.from({ length: 31 }, (_, index) => index + 1)
const leadingEmptyDays = 4
const calendarCells = [
  ...Array.from({ length: leadingEmptyDays }, (_, index) => ({
    id: `empty-${index}`,
    day: null,
  })),
  ...calendarDays.map((day) => ({
    id: `day-${day}`,
    day,
  })),
]
const exportFormats = ['PDF', 'Stories']
const canvasFontFamily =
  '"Corsa Grotesk", system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
const progressMilestones = [30, 60, 100]
const promoCode = 'СОЙКА300'

function App() {
  const calendarSectionRef = useRef(null)
  const fileInputRef = useRef(null)
  const calendarPhotosRef = useRef({})
  const selectedDayRef = useRef(null)
  const [calendarPhotos, setCalendarPhotos] = useState({})
  const [exportError, setExportError] = useState('')
  const [exportFormat, setExportFormat] = useState('PDF')
  const [exportMessage, setExportMessage] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [rewardModal, setRewardModal] = useState(null)

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

  const calendarStateForExport = calendarCells.map((cell) => ({
    ...cell,
    photo: cell.day ? (calendarPhotos[cell.day] ?? null) : null,
  }))
  const filledPhotoCount = Object.keys(calendarPhotos).length
  const filledPercent = (filledPhotoCount / calendarDays.length) * 100
  const progressLevel = getProgressLevel(filledPercent)
  const hasPhotos = filledPhotoCount > 0
  const calendarSubtitle = getCalendarSubtitle(progressLevel)

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

  function scrollToCalendar() {
    calendarSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  async function downloadCalendar() {
    if (isDownloading || !hasPhotos) {
      return
    }

    setExportError('')
    setExportMessage('')
    setIsDownloading(true)

    try {
      const canvas = await createCalendarCanvas(
        calendarStateForExport,
        exportFormat,
        progressLevel,
        calendarSubtitle,
      )
      const link = document.createElement('a')

      link.download = 'photo-calendar.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
      setExportMessage('Календарь готов: файл photo-calendar.png скачивается.')
      setRewardModal({
        months: getRewardMonths(filledPercent),
        copied: false,
      })
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
    <main className="min-h-screen bg-[#070C17] text-[#F8F3ED]">
      <input
        accept="image/*"
        className="hidden"
        onChange={handlePhotoChange}
        ref={fileInputRef}
        type="file"
      />

      <section
        className="relative flex min-h-[900px] overflow-hidden px-4 py-5 sm:px-9"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(7, 12, 23, 0) 62%, #070C17 100%), url(${heroPreviewBg})`,
          backgroundPosition: 'center top',
          backgroundSize: 'cover',
        }}
      >
        <div className="relative z-10 flex w-full flex-col">
          <div className="flex items-center gap-3 text-[25px] font-normal leading-none text-[#F8F3ED]">
            <img
              alt=""
              className="h-8 w-8"
              src={soykaLogoMark}
            />
            <span>сойка</span>
          </div>

          <div className="mx-auto mt-auto flex max-w-[1120px] flex-col items-center pb-[80px] text-center">
            <h1 className="whitespace-nowrap text-[42px] font-normal leading-none tracking-[0.1px] sm:text-[72px]">
              Ты живёшь — мы собираем
            </h1>
            <p className="mt-6 max-w-[768px] text-xl font-normal leading-[1.3] text-[#F5F5F5] sm:text-2xl">
              Приложение, которое автоматически превращает прожитые дни
              в&nbsp;осмысленные воспоминания
            </p>
            <button
              className="mt-[60px] rounded-full bg-[#F8F3ED] px-8 py-4 text-base font-normal leading-[1.1] text-[#070C17] transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#F8F3ED]/30"
              onClick={scrollToCalendar}
              type="button"
            >
              Попробовать демо
            </button>
          </div>
        </div>
      </section>

      <section className="bg-[#070C17] px-4 py-20 backdrop-blur-[60px] sm:px-8">
        <div className="mx-auto flex max-w-[1152px] flex-col items-center gap-16">
          <h2 className="text-center text-[40px] font-normal leading-none tracking-[0.35px] sm:text-5xl">
            Ты фиксируешь жизнь, но не помнишь её
          </h2>

          <div className="grid w-full gap-6 md:grid-cols-3 md:gap-9">
            <ProblemCard
              description="Они просто лежат в телефоне"
              icon="archive"
              title="Тысячи фото, но ты их не пересматриваешь"
            />
            <ProblemCard
              description="Скриншоты смешаны с важным"
              icon="image"
              title="Галерея переполнена мусором"
            />
            <ProblemCard
              description="Невозможно вспомнить прошлое"
              icon="clock"
              title={
                <>
                  Дни не складываются
                  <br />в историю
                </>
              }
            />
          </div>
        </div>
      </section>

      <section
        className="mx-auto flex max-w-[1328px] flex-col items-center px-4 pb-16 pt-20 sm:px-8 lg:px-0 lg:pb-[91px] lg:pt-[91px]"
        ref={calendarSectionRef}
      >
        <div className="max-w-3xl text-center">
          <h1 className="text-[40px] font-normal leading-none tracking-[0.35px] sm:text-5xl">
            Попробуй, как это работает
          </h1>
          <p className="mx-auto mt-[30px] max-w-[748px] text-xl font-normal leading-[1.3] text-[#F8F3ED]/95 sm:text-2xl">
            {calendarSubtitle.map((line) => (
              <span className="block" key={line}>
                {line}
              </span>
            ))}
          </p>
        </div>

        <div className="mt-[58px] w-full">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-end gap-5 sm:gap-8">
              <div className="text-[88px] font-normal leading-[0.9] sm:text-[100px]">
                15
              </div>
              <div className="pb-2 text-[36px] font-normal leading-none sm:text-[44px]">
                мая, 2026
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <ProgressBar progressLevel={progressLevel} />

              <div
                aria-label="Формат экспорта"
                className="flex h-[67px] rounded-full border border-[#F8F3ED]/30 bg-[#070C17] p-2 shadow-[inset_0_1px_2px_rgba(248,243,237,0.35)]"
                role="radiogroup"
              >
                {exportFormats.map((format) => (
                  <button
                    aria-checked={exportFormat === format}
                    className={`h-full min-w-[104px] rounded-full px-8 text-[17px] font-normal leading-none tracking-[0.35px] transition ${
                      exportFormat === format
                        ? 'bg-[#252B33] text-[#F8F3ED]'
                        : 'text-[#F8F3ED] hover:bg-[#F8F3ED]/10'
                    }`}
                    key={format}
                    onClick={() => setExportFormat(format)}
                    role="radio"
                    type="button"
                  >
                    {format}
                  </button>
                ))}
              </div>

              <button
                className={`h-[67px] rounded-full px-[50px] text-[17px] font-normal leading-none tracking-[0.35px] text-[#070C17] transition focus:outline-none focus:ring-4 focus:ring-[#F8F3ED]/20 disabled:cursor-not-allowed ${
                  hasPhotos
                    ? 'bg-[#F8F3ED] hover:bg-white'
                    : 'bg-[#F8F3ED]/40 opacity-60'
                }`}
                disabled={isDownloading || !hasPhotos}
                onClick={downloadCalendar}
                type="button"
              >
                {isDownloading ? 'Готовим...' : 'Скачать'}
              </button>
            </div>
          </div>

          {(exportMessage || exportError) && (
            <p
              className={`mt-5 text-center text-sm ${
                exportError ? 'text-red-300' : 'text-[#F8F3ED]/70'
              }`}
              role="status"
            >
              {exportError || exportMessage}
            </p>
          )}

          <div className="mt-[72px] overflow-x-auto pb-2">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-7 gap-3">
                {weekDays.map((weekDay) => (
                  <div
                    className="text-center text-xl font-normal leading-[1.3] text-[#F8F3ED]"
                    key={weekDay}
                  >
                    {weekDay}
                  </div>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-7 gap-3">
                {calendarStateForExport.map(({ id, day, photo }) =>
                  day ? (
                    <button
                      aria-label={`Загрузить фото для\u00A0${day} мая`}
                      className="group relative aspect-[179/168] overflow-hidden rounded-2xl bg-[#1E232C] text-left transition hover:bg-[#262c37] focus:outline-none focus:ring-4 focus:ring-[#F8F3ED]/20"
                      key={id}
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
                      <div
                        className={`absolute inset-0 ${
                          photo ? 'bg-black/25' : 'bg-transparent'
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/40 opacity-0 transition group-hover:opacity-100" />
                      {photo && (
                        <span
                          aria-hidden="true"
                          className="absolute -left-1.5 -top-1.5 z-10 h-11 w-11 rounded-full bg-[#1C212A]"
                        />
                      )}
                      <span
                        className={`absolute z-20 text-xl font-normal leading-none text-[#F8F3ED] ${
                          photo ? 'left-0 top-0 flex h-9 w-9 items-center justify-center' : 'left-3 top-3'
                        }`}
                      >
                        {day}
                      </span>
                    </button>
                  ) : (
                    <div
                      aria-hidden="true"
                      className="aspect-[179/168] rounded-2xl bg-[#1E232C]"
                      key={id}
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-16 text-center text-2xl font-normal leading-[1.3] text-[#F8F3ED]">
          #МесяцССойкой
        </p>
      </section>

      <section
        className="relative flex min-h-[393px] items-center justify-center overflow-hidden bg-[#070C17] bg-cover bg-center px-4 py-20 text-center"
        style={{ backgroundImage: `url(${finalCtaBg})` }}
      >
        <div className="relative z-10 mx-auto flex max-w-[760px] flex-col items-center">
          <h2 className="text-[42px] font-normal leading-none text-[#F8F3ED] sm:text-[64px]">
            История твоей жизни
            <span className="block">собирается сама</span>
          </h2>
          <button
            className="mt-10 rounded-full bg-[#F8F3ED] px-10 py-5 text-base font-normal leading-[1.1] text-[#070C17] transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#F8F3ED]/30"
            type="button"
          >
            Подписаться на новости
          </button>
        </div>
      </section>

      {rewardModal && (
        <RewardModal
          copied={rewardModal.copied}
          months={rewardModal.months}
          onClose={() => setRewardModal(null)}
          onCopy={async () => {
            await copyText(promoCode)
            setRewardModal((currentModal) => ({
              ...currentModal,
              copied: true,
            }))
          }}
        />
      )}
    </main>
  )
}

function ProblemCard({ description, icon, title }) {
  return (
    <article className="min-h-[235px] rounded-2xl border border-[#F8F3ED]/20 bg-[#FAFAFA]/[0.01] px-8 py-[33px] shadow-[inset_0_1px_1px_rgba(248,243,237,0.18),0_18px_40px_rgba(0,0,0,0.16)]">
      <ProblemIcon icon={icon} />
      <div className="mt-[17px] space-y-2.5">
        <h3 className="text-[21px] font-normal leading-[1.3] text-white">
          {title}
        </h3>
        <p className="text-base font-normal leading-6 text-white/60">
          {description}
        </p>
      </div>
    </article>
  )
}

function ProblemIcon({ icon }) {
  if (icon === 'image') {
    return (
      <svg
        aria-hidden="true"
        className="h-10 w-10 text-white"
        fill="none"
        viewBox="0 0 40 40"
      >
        <rect
          height="28"
          rx="3"
          stroke="currentColor"
          strokeWidth="3.33"
          width="28"
          x="6"
          y="6"
        />
        <circle cx="14" cy="14" r="3.5" stroke="currentColor" strokeWidth="3.33" />
        <path
          d="M8 31L17 22L23 28L27 24L34 31"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="3.33"
        />
      </svg>
    )
  }

  if (icon === 'clock') {
    return (
      <svg
        aria-hidden="true"
        className="h-10 w-10 text-white"
        fill="none"
        viewBox="0 0 40 40"
      >
        <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="3.33" />
        <path
          d="M20 11.5V21L26.5 25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3.33"
        />
      </svg>
    )
  }

  return (
    <svg
      aria-hidden="true"
      className="h-10 w-10 text-white"
      fill="none"
      viewBox="0 0 40 40"
    >
      <path
        d="M8 12H32"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3.33"
      />
      <path
        d="M11 15H29V32H11V15Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="3.33"
      />
      <path
        d="M15 20H25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3.33"
      />
    </svg>
  )
}

function RewardModal({ copied, months, onClose, onCopy }) {
  return (
    <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-hidden bg-[#070C17]/90 px-4 text-[#F8F3ED] shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-90"
        style={{
          backgroundImage: `url(${rewardModalBg})`,
          backgroundPosition: 'center top',
          backgroundSize: 'cover',
        }}
      />
      <div className="absolute inset-0 bg-[#070C17]/35" />

      <section
        aria-modal="true"
        className="relative z-10 flex max-w-[695px] flex-col items-center gap-[30px] text-center"
        role="dialog"
      >
        <h2 className="text-5xl font-normal leading-none tracking-[0.35px]">
          Поздравляем!
        </h2>
        <p className="text-2xl font-normal leading-[1.3]">
          Вы получили {months} {getMonthWord(months)} бесплатно! Скопируй
          промокод и&nbsp;вставь при авторизации в&nbsp;приложение
        </p>

        <div className="rounded-full border border-[#F8F3ED]/20 bg-[#FAFAFA]/[0.01] p-2 shadow-[inset_0_1px_2px_rgba(248,243,237,0.35)]">
          <div className="rounded-full px-[34px] py-[17px] text-[17px] font-normal leading-none tracking-[0.35px] text-[#F8F3ED]">
            {promoCode}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <button
            className="inline-flex items-center gap-2 rounded-full bg-[#F8F3ED] px-8 py-4 text-base font-normal leading-[1.1] text-[#070C17] transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#F8F3ED]/30"
            onClick={onCopy}
            type="button"
          >
            {copied ? 'Скопировано' : 'Скопировать'}
            <span
              aria-hidden="true"
              className="relative h-5 w-5 rounded-[3px] border border-[#070C17]"
            >
              <span className="absolute -right-1 -top-1 h-4 w-4 rounded-[3px] border border-[#070C17] bg-[#F8F3ED]" />
            </span>
          </button>
          <button
            className="rounded-full border border-[#F8F3ED]/20 bg-[#FAFAFA]/[0.01] px-8 py-4 text-base font-normal leading-[1.1] text-[#F8F3ED] transition hover:bg-[#F8F3ED]/10 focus:outline-none focus:ring-4 focus:ring-[#F8F3ED]/20"
            onClick={onClose}
            type="button"
          >
            Закрыть
          </button>
        </div>
      </section>
    </div>
  )
}

function ProgressBar({ progressLevel }) {
  return (
    <div className="flex h-[67px] items-center gap-4 rounded-full border border-[#F8F3ED]/30 bg-[#FAFAFA]/[0.01] py-2.5 pl-5 pr-2.5 shadow-[inset_0_1px_2px_rgba(248,243,237,0.35)]">
      <span className="text-[17px] font-normal leading-none tracking-[0.35px] text-[#F8F3ED]">
        Прогресс:
      </span>
      <div className="flex items-center gap-2">
        {progressMilestones.map((milestone, index) => (
          <span
            aria-label={`${milestone}%`}
            className={`h-[50px] w-[50px] rounded-full bg-[#070C17] ${
              index < progressLevel
                ? 'shadow-[inset_0_2px_27px_2.678571px_#FF981A,inset_0_0_7px_#FFCC74]'
                : 'shadow-[inset_0_2px_27px_2.678571px_#BDBDBD,inset_0_0_7px_#B4B4B4]'
            }`}
            key={milestone}
          />
        ))}
      </div>
    </div>
  )
}

function getProgressLevel(filledPercent) {
  if (filledPercent >= 100) {
    return 3
  }

  if (filledPercent >= 60) {
    return 2
  }

  if (filledPercent >= 30) {
    return 1
  }

  return 0
}

function getCalendarSubtitle(progressLevel) {
  if (progressLevel === 3) {
    return [
      'Вы заполнили 100%!',
      'Вы получаете 3 месяца бесплатно',
    ]
  }

  if (progressLevel === 2) {
    return [
      'Вы заполнили больше 60%! Если заполните полностью,',
      'то получите 3 месяца бесплатно',
    ]
  }

  if (progressLevel === 1) {
    return [
      'Вы заполнили больше 30%! Если заполните полностью,',
      'то получите 3 месяца бесплатно',
    ]
  }

  return [
    'Создай воспоминания вручную, загрузив фото в\u00A0ячейки, —',
    'в\u00A0приложении это происходит автоматически',
  ]
}

function getRewardMonths(filledPercent) {
  if (filledPercent > 90) {
    return 3
  }

  if (filledPercent > 60) {
    return 2
  }

  return 1
}

function getMonthWord(months) {
  return months === 1 ? 'месяц' : 'месяца'
}

async function copyText(text) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')

  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.append(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}

async function createCalendarCanvas(
  calendarState,
  exportFormat,
  progressLevel,
  calendarSubtitle,
) {
  const columns = 7
  const canvasWidth = 1440
  const canvasHeight = 1518
  const marginX = 56
  const gap = 12
  const cellWidth = (canvasWidth - marginX * 2 - gap * (columns - 1)) / columns
  const cellHeight = 168
  const headerY = 432
  const gridY = 457
  const rows = Math.ceil(calendarState.length / columns)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  canvas.width = canvasWidth
  canvas.height = canvasHeight

  context.fillStyle = '#070C17'
  context.fillRect(0, 0, canvasWidth, canvasHeight)

  drawCenteredText(
    context,
    'Попробуй, как это работает',
    canvasWidth / 2,
    102,
    `400 48px ${canvasFontFamily}`,
    '#F8F3ED',
  )
  drawCenteredText(
    context,
    calendarSubtitle[0],
    canvasWidth / 2,
    177,
    `400 24px ${canvasFontFamily}`,
    '#F8F3ED',
  )
  drawCenteredText(
    context,
    calendarSubtitle[1],
    canvasWidth / 2,
    208,
    `400 24px ${canvasFontFamily}`,
    '#F8F3ED',
  )

  context.fillStyle = '#F8F3ED'
  context.font = `400 100px ${canvasFontFamily}`
  context.textBaseline = 'middle'
  context.fillText('15', marginX, 325)

  context.font = `400 44px ${canvasFontFamily}`
  context.fillText('мая, 2026', 196, 325)

  drawProgressBar(context, progressLevel)

  drawFormatSwitcher(context, exportFormat)

  drawRoundedRect(context, 1208, 290, 175, 67, 34)
  context.fillStyle = '#F8F3ED'
  context.fill()
  drawCenteredText(
    context,
    'Скачать',
    1295.5,
    325,
    `400 17px ${canvasFontFamily}`,
    '#070C17',
    'middle',
  )

  weekDays.forEach((weekDay, index) => {
    drawCenteredText(
      context,
      weekDay,
      marginX + index * (cellWidth + gap) + cellWidth / 2,
      headerY,
      `400 20px ${canvasFontFamily}`,
      '#F8F3ED',
      'middle',
    )
  })

  for (const [index, { day, photo }] of calendarState.entries()) {
    const column = index % columns
    const row = Math.floor(index / columns)
    const x = marginX + column * (cellWidth + gap)
    const y = gridY + row * (cellHeight + gap)

    drawRoundedRect(context, x, y, cellWidth, cellHeight, 16)
    context.fillStyle = '#1E232C'
    context.fill()

    if (photo?.imageUrl) {
      const image = await loadImage(photo.imageUrl)

      context.save()
      drawRoundedRect(context, x, y, cellWidth, cellHeight, 16)
      context.clip()
      drawImageCover(context, image, x, y, cellWidth, cellHeight)
      context.fillStyle = 'rgba(0, 0, 0, 0.28)'
      context.fillRect(x, y, cellWidth, cellHeight)
      context.restore()
    }

    if (day) {
      if (photo?.imageUrl) {
        drawRoundedRect(context, x - 6, y - 6, 44, 44, 22)
        context.fillStyle = '#1C212A'
        context.fill()
      }

      context.fillStyle = '#F8F3ED'
      context.font = `400 20px ${canvasFontFamily}`
      context.textBaseline = photo?.imageUrl ? 'middle' : 'top'
      context.textAlign = photo?.imageUrl ? 'center' : 'start'
      context.fillText(
        String(day),
        photo?.imageUrl ? x + 16 : x + 12,
        photo?.imageUrl ? y + 19 : y + 12,
      )
      context.textAlign = 'start'
    }
  }

  drawCenteredText(
    context,
    '#МесяцССойкой',
    canvasWidth / 2,
    gridY + rows * cellHeight + (rows - 1) * gap + 83,
    `400 24px ${canvasFontFamily}`,
    '#F8F3ED',
  )

  return canvas
}

function drawProgressBar(context, progressLevel) {
  const progressX = 602
  const progressY = 290
  const progressWidth = 304
  const progressHeight = 67
  const dotSize = 50
  const dotGap = 8
  const firstDotX = 731
  const dotY = progressY + (progressHeight - dotSize) / 2

  drawRoundedRect(context, progressX, progressY, progressWidth, progressHeight, 34)
  context.fillStyle = 'rgba(250, 250, 250, 0.01)'
  context.fill()
  context.strokeStyle = 'rgba(248, 243, 237, 0.3)'
  context.lineWidth = 1
  context.stroke()

  context.fillStyle = '#F8F3ED'
  context.font = `400 17px ${canvasFontFamily}`
  context.textBaseline = 'middle'
  context.fillText('Прогресс:', progressX + 20, progressY + progressHeight / 2)

  progressMilestones.forEach((milestone, index) => {
    const dotX = firstDotX + index * (dotSize + dotGap)
    const gradient = context.createRadialGradient(
      dotX + dotSize / 2,
      dotY + dotSize / 2,
      4,
      dotX + dotSize / 2,
      dotY + dotSize / 2,
      dotSize / 2,
    )

    if (index < progressLevel) {
      gradient.addColorStop(0, '#070C17')
      gradient.addColorStop(0.58, '#5C3B17')
      gradient.addColorStop(1, '#FF981A')
    } else {
      gradient.addColorStop(0, '#070C17')
      gradient.addColorStop(0.58, '#2B3038')
      gradient.addColorStop(1, '#BDBDBD')
    }

    drawRoundedRect(context, dotX, dotY, dotSize, dotSize, dotSize / 2)
    context.fillStyle = gradient
    context.fill()
  })
}

function drawFormatSwitcher(context, exportFormat) {
  const switcherX = 928
  const switcherY = 290
  const switcherWidth = 258
  const switcherHeight = 67
  const padding = 8
  const optionWidth = (switcherWidth - padding * 2) / 2
  const selectedIndex = exportFormat === 'Stories' ? 1 : 0
  const selectedX = switcherX + padding + selectedIndex * optionWidth

  drawRoundedRect(context, switcherX, switcherY, switcherWidth, switcherHeight, 34)
  context.fillStyle = '#070C17'
  context.fill()
  context.strokeStyle = 'rgba(248, 243, 237, 0.3)'
  context.lineWidth = 1
  context.stroke()

  drawRoundedRect(
    context,
    selectedX,
    switcherY + padding,
    optionWidth,
    switcherHeight - padding * 2,
    28,
  )
  context.fillStyle = '#252B33'
  context.fill()

  drawCenteredText(
    context,
    'PDF',
    switcherX + padding + optionWidth / 2,
    switcherY + switcherHeight / 2,
    `400 17px ${canvasFontFamily}`,
    '#F8F3ED',
    'middle',
  )
  drawCenteredText(
    context,
    'Stories',
    switcherX + padding + optionWidth + optionWidth / 2,
    switcherY + switcherHeight / 2,
    `400 17px ${canvasFontFamily}`,
    '#F8F3ED',
    'middle',
  )
}

function drawCenteredText(
  context,
  text,
  x,
  y,
  font,
  color,
  baseline = 'top',
) {
  context.fillStyle = color
  context.font = font
  context.textAlign = 'center'
  context.textBaseline = baseline
  context.fillText(text, x, y)
  context.textAlign = 'start'
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
