'use client'

import {
  ChangeEvent,
  DragEvent,
  useRef,
  useState,
} from 'react'
import {
  Reference,
  DESIGN_TAGS,
  INDUSTRY_CATEGORIES,
} from '@/types'

interface ReferenceModalProps {
  reference: Reference
  onClose: () => void
  onUpdate: (reference: Reference) => void
}

export default function ReferenceModal({
  reference,
  onClose,
  onUpdate,
}: ReferenceModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addImagesInputRef = useRef<HTMLInputElement>(null)

  const [isEditing, setIsEditing] = useState(true)
  const [isDraggingThumbnail, setIsDraggingThumbnail] = useState(false)
  const [thumbnailError, setThumbnailError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  /*
   * The existing Reference type only has thumbnailUrl.
   *
   * We therefore keep additional newly-added images locally instead of
   * accessing reference.images, which fixes:
   *
   * Property 'images' does not exist on type 'Reference'
   */
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState('')
  const [additionalImageDataUrls, setAdditionalImageDataUrls] = useState<
    string[]
  >([])

  const [editData, setEditData] = useState({
    title: reference.title || '',
    description: reference.description || '',
    thumbnailUrl: reference.thumbnailUrl || '',
    screenshotUrl: reference.screenshotUrl || '',
    tags: reference.tags || [],
    notes: reference.notes || '',
    industry: reference.industry || '',
  })

  /*
   * The first image is always the main/cover image.
   * Additional uploaded images are appended after it.
   */
  const imageSources = [
    thumbnailDataUrl || editData.thumbnailUrl,
    ...additionalImageDataUrls,
  ].filter(Boolean)

  const handleFieldChange = (
    field: keyof typeof editData,
    value: string | string[]
  ) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const readImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Unable to read image'))
        }
      }

      reader.onerror = () => {
        reject(new Error('Unable to read image'))
      }

      reader.readAsDataURL(file)
    })
  }

  const isImageFile = (file: File) => {
    return file.type.startsWith('image/')
  }

  /*
   * Replaces the main/cover image.
   */
  const selectThumbnail = async (file?: File) => {
    if (!file) return

    setThumbnailError('')

    if (!isImageFile(file)) {
      setThumbnailError('Please select an image file.')
      return
    }

    try {
      const dataUrl = await readImageFile(file)

      setThumbnailDataUrl(dataUrl)

      /*
       * Keep editData.thumbnailUrl untouched because the new image is
       * sent separately as thumbnailDataUrl during save.
       */
    } catch {
      setThumbnailError('Unable to read the selected image.')
    }
  }

  /*
   * Adds one or more additional images.
   */
  const addImages = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(isImageFile)

    if (!imageFiles.length) {
      setThumbnailError('Please select image files only.')
      return
    }

    setThumbnailError('')

    try {
      const dataUrls = await Promise.all(
        imageFiles.map((file) => readImageFile(file))
      )

      setAdditionalImageDataUrls((prev) => [
        ...prev,
        ...dataUrls,
      ])
    } catch {
      setThumbnailError('Unable to read one or more images.')
    }
  }

  const handleThumbnailInput = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]

    if (file) {
      void selectThumbnail(file)
    }

    event.target.value = ''
  }

  const handleAdditionalImagesInput = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files

    if (files?.length) {
      void addImages(files)
    }

    event.target.value = ''
  }

  const handleThumbnailDrop = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault()
    setIsDraggingThumbnail(false)

    const file = event.dataTransfer.files?.[0]

    if (file) {
      void selectThumbnail(file)
    }
  }

  const handleRemoveAdditionalImage = (index: number) => {
    setAdditionalImageDataUrls((prev) =>
      prev.filter((_, imageIndex) => imageIndex !== index)
    )
  }

  const handleRemoveCover = () => {
    setThumbnailDataUrl('')
    setEditData((prev) => ({
      ...prev,
      thumbnailUrl: '',
    }))
  }

  const toggleTag = (tag: string) => {
    setEditData((prev) => {
      const exists = prev.tags.includes(tag)

      return {
        ...prev,
        tags: exists
          ? prev.tags.filter((item) => item !== tag)
          : [...prev.tags, tag],
      }
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError('')

    try {
      const response = await fetch(
        `/api/references/${reference.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...editData,

            /*
             * Existing API field for the main image.
             */
            thumbnailDataUrl:
              thumbnailDataUrl || undefined,

            /*
             * New field for additional images.
             *
             * Your API should save these wherever your project stores
             * reference images.
             */
            additionalImageDataUrls:
              additionalImageDataUrls.length
                ? additionalImageDataUrls
                : undefined,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to save reference')
      }

      const updated = await response.json()

      onUpdate(updated)
      setIsEditing(false)
    } catch (error) {
      console.error(error)
      setSaveError(
        'Unable to save changes. Please try again.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#17191c]/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Reference details"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-[1120px] flex-col overflow-hidden rounded-lg border border-[#dfe3e8] bg-white shadow-[0_24px_70px_rgba(23,25,28,0.18)]">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#e9ebee] px-5 py-4">
          <div className="min-w-0">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9298a1]">
              Reference
            </div>

            <h2 className="truncate text-[18px] font-semibold text-[#17191c]">
              {editData.title || 'Untitled reference'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#dfe3e8] text-[#777e87] transition hover:border-[#cbd1d8] hover:bg-[#f8f9fb] hover:text-[#17191c]"
            aria-label="Close"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="p-5">
            {/* Images */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-[13px] font-semibold text-[#17191c]">
                    Images
                  </h3>

                  <p className="mt-0.5 text-[12px] text-[#9298a1]">
                    {imageSources.length
                      ? `${imageSources.length} image${
                          imageSources.length === 1
                            ? ''
                            : 's'
                        }`
                      : 'No images added'}
                  </p>
                </div>

                {isEditing && (
                  <div className="flex items-center gap-2">
                    {/* Replace cover */}
                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#dfe3e8] bg-white px-3 text-[12px] font-medium text-[#5f6670] transition hover:border-[#cbd1d8] hover:bg-[#f8f9fb] hover:text-[#17191c]"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M4 16.5V20h3.5" />
                        <path d="M20 7.5V4h-3.5" />
                        <path d="M18.5 5.5a8 8 0 0 0-13 2" />
                        <path d="M5.5 18.5a8 8 0 0 0 13-2" />
                      </svg>
                      Replace cover
                    </button>

                    {/* Add images */}
                    <button
                      type="button"
                      onClick={() =>
                        addImagesInputRef.current?.click()
                      }
                      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#1769d1] px-3 text-[12px] font-semibold text-white transition hover:bg-[#125bb8]"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                      </svg>
                      Add images
                    </button>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbnailInput}
              />

              <input
                ref={addImagesInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleAdditionalImagesInput}
              />

              {imageSources.length > 0 ? (
                /*
                 * Horizontal container:
                 * Each image gets its own fixed-width panel.
                 */
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {imageSources.map((src, index) => (
                    <div
                      key={`${src}-${index}`}
                      className="group relative w-[min(78vw,720px)] shrink-0 overflow-hidden rounded-lg border border-[#dfe3e8] bg-[#f1f3f5]"
                    >
                      {/* Image label */}
                      <div className="absolute left-2 top-2 z-10 rounded-md border border-[#dfe3e8] bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#5f6670] shadow-sm">
                        {index === 0
                          ? 'Cover'
                          : `Image ${index + 1}`}
                      </div>

                      {/* Remove additional image */}
                      {isEditing && index > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveAdditionalImage(
                              index - 1
                            )
                          }
                          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-md border border-[#dfe3e8] bg-white/95 text-[#777e87] opacity-0 shadow-sm transition hover:text-[#d33b3b] group-hover:opacity-100"
                          aria-label={`Remove image ${
                            index + 1
                          }`}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                        </button>
                      )}

                      {/*
                       * IMPORTANT:
                       *
                       * The viewport has a fixed height and overflow-auto.
                       *
                       * The image uses:
                       *   width: 100%
                       *   height: auto
                       *   max-width: none
                       *
                       * This makes the image fit the viewport width first.
                       *
                       * If the image is very tall, the viewport can scroll
                       * vertically to inspect the rest of the image.
                       *
                       * We intentionally DON'T use object-contain because
                       * that would shrink a huge image down too much.
                       *
                       * We also DON'T use object-cover because that would
                       * permanently crop the image.
                       */}
                      <div
                        className="h-[380px] w-full overflow-auto"
                        onWheel={(event) => {
                          /*
                           * Normal browser scrolling works here.
                           * This handler intentionally does nothing; it
                           * simply makes it explicit that this area owns
                           * the mouse wheel when the cursor is over it.
                           */
                          event.stopPropagation()
                        }}
                      >
                        <img
                          src={src}
                          alt={
                            index === 0
                              ? 'Reference cover'
                              : `Reference image ${
                                  index + 1
                                }`
                          }
                          className="block h-auto w-full min-w-full max-w-none"
                        />
                      </div>

                      {/* Image footer */}
                      <div className="flex items-center justify-between border-t border-[#dfe3e8] bg-white px-3 py-2">
                        <span className="text-[11px] text-[#777e87]">
                          {index === 0
                            ? 'Primary image'
                            : 'Additional image'}
                        </span>

                        <span className="text-[10px] text-[#9298a1]">
                          Scroll to inspect
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  onDragOver={(event) => {
                    event.preventDefault()
                    setIsDraggingThumbnail(true)
                  }}
                  onDragLeave={() =>
                    setIsDraggingThumbnail(false)
                  }
                  onDrop={handleThumbnailDrop}
                  onClick={() =>
                    isEditing &&
                    fileInputRef.current?.click()
                  }
                  className={`flex h-[260px] cursor-pointer items-center justify-center rounded-lg border border-dashed transition ${
                    isDraggingThumbnail
                      ? 'border-[#1769d1] bg-[#f3f8ff]'
                      : 'border-[#cfd4da] bg-[#f8f9fb] hover:border-[#aeb5bd] hover:bg-[#f5f6f8]'
                  }`}
                >
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md border border-[#dfe3e8] bg-white text-[#777e87]">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                        />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="m21 15-5-5L5 21" />
                      </svg>
                    </div>

                    <p className="text-[13px] font-medium text-[#5f6670]">
                      Add an image
                    </p>

                    <p className="mt-1 text-[11px] text-[#9298a1]">
                      Click or drag an image here
                    </p>
                  </div>
                </div>
              )}

              {isEditing &&
                imageSources.length > 0 && (
                  <div
                    onDragOver={(event) => {
                      event.preventDefault()
                      setIsDraggingThumbnail(true)
                    }}
                    onDragLeave={() =>
                      setIsDraggingThumbnail(false)
                    }
                    onDrop={(event) => {
                      event.preventDefault()
                      setIsDraggingThumbnail(false)
                      void addImages(
                        event.dataTransfer.files
                      )
                    }}
                    className={`mt-3 rounded-md border border-dashed px-4 py-3 transition ${
                      isDraggingThumbnail
                        ? 'border-[#1769d1] bg-[#f3f8ff]'
                        : 'border-[#dfe3e8] bg-[#fafbfc]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path d="M12 3v12" />
                          <path d="m7 10 5 5 5-5" />
                          <path d="M5 21h14" />
                        </svg>

                        <span className="text-[11px] text-[#777e87]">
                          Drag more images here to add them
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          addImagesInputRef.current?.click()
                        }
                        className="text-[11px] font-semibold text-[#1769d1] hover:underline"
                      >
                        Browse files
                      </button>
                    </div>
                  </div>
                )}

              {thumbnailError && (
                <p className="mt-2 text-[12px] text-[#d33b3b]">
                  {thumbnailError}
                </p>
              )}
            </section>

            {/* Main information */}
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#777e87]">
                  Title
                </label>

                {isEditing ? (
                  <input
                    value={editData.title}
                    onChange={(event) =>
                      handleFieldChange(
                        'title',
                        event.target.value
                      )
                    }
                    className="h-9 w-full rounded-md border border-[#dfe3e8] bg-white px-3 text-[13px] text-[#17191c] outline-none transition placeholder:text-[#a0a6ad] focus:border-[#1769d1] focus:ring-2 focus:ring-[#1769d1]/10"
                    placeholder="Reference title"
                  />
                ) : (
                  <p className="text-[14px] text-[#17191c]">
                    {editData.title || 'Untitled'}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#777e87]">
                  Description
                </label>

                {isEditing ? (
                  <textarea
                    value={editData.description}
                    onChange={(event) =>
                      handleFieldChange(
                        'description',
                        event.target.value
                      )
                    }
                    rows={3}
                    className="w-full resize-none rounded-md border border-[#dfe3e8] bg-white px-3 py-2.5 text-[13px] leading-5 text-[#17191c] outline-none transition placeholder:text-[#a0a6ad] focus:border-[#1769d1] focus:ring-2 focus:ring-[#1769d1]/10"
                    placeholder="Describe this reference..."
                  />
                ) : (
                  <p className="text-[13px] leading-5 text-[#5f6670]">
                    {editData.description ||
                      'No description provided.'}
                  </p>
                )}
              </div>

              {/* Industry */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#777e87]">
                  Industry
                </label>

                <div className="rounded-lg border border-[#d6e1ed] bg-[#f6f9fc] p-1">
                  <div className="flex items-center gap-2 rounded-md border border-[#e5ebf2] bg-white px-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#edf4fc] text-[#1769d1]">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16" />
                        <path d="M2 21h20" />
                        <path d="M8 7h2" />
                        <path d="M14 7h2" />
                        <path d="M8 11h2" />
                        <path d="M14 11h2" />
                        <path d="M8 15h2" />
                        <path d="M14 15h2" />
                      </svg>
                    </div>

                    {isEditing ? (
                      <div className="relative flex-1">
                        <select
                          value={editData.industry}
                          onChange={(event) =>
                            handleFieldChange(
                              'industry',
                              event.target.value
                            )
                          }
                          className="h-10 w-full appearance-none bg-transparent pr-7 text-[13px] font-medium text-[#17191c] outline-none"
                        >
                          <option value="">
                            Select industry
                          </option>

                          {INDUSTRY_CATEGORIES.map(
                            (industry) => (
                              <option
                                key={industry}
                                value={industry}
                              >
                                {industry}
                              </option>
                            )
                          )}
                        </select>

                        <svg
                          className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[#777e87]"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </div>
                    ) : (
                      <span className="py-2.5 text-[13px] font-medium text-[#17191c]">
                        {editData.industry ||
                          'No industry selected'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Screenshot URL */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#777e87]">
                  Screenshot URL
                </label>

                {isEditing ? (
                  <input
                    value={editData.screenshotUrl}
                    onChange={(event) =>
                      handleFieldChange(
                        'screenshotUrl',
                        event.target.value
                      )
                    }
                    className="h-9 w-full rounded-md border border-[#dfe3e8] bg-white px-3 text-[13px] text-[#17191c] outline-none transition placeholder:text-[#a0a6ad] focus:border-[#1769d1] focus:ring-2 focus:ring-[#1769d1]/10"
                    placeholder="https://..."
                  />
                ) : (
                  <p className="truncate text-[13px] text-[#5f6670]">
                    {editData.screenshotUrl ||
                      'No screenshot URL'}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#777e87]">
                  Notes
                </label>

                {isEditing ? (
                  <textarea
                    value={editData.notes}
                    onChange={(event) =>
                      handleFieldChange(
                        'notes',
                        event.target.value
                      )
                    }
                    rows={3}
                    className="w-full resize-none rounded-md border border-[#dfe3e8] bg-white px-3 py-2.5 text-[13px] leading-5 text-[#17191c] outline-none transition placeholder:text-[#a0a6ad] focus:border-[#1769d1] focus:ring-2 focus:ring-[#1769d1]/10"
                    placeholder="Add notes about this reference..."
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-[13px] leading-5 text-[#5f6670]">
                    {editData.notes || 'No notes.'}
                  </p>
                )}
              </div>
            </div>

            {/* Tags */}
            <section className="mt-6">
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#777e87]">
                Design tags
              </label>

              <div className="flex flex-wrap gap-1.5">
                {DESIGN_TAGS.map((tag) => {
                  const selected =
                    editData.tags.includes(tag)

                  return (
                    <button
                      key={tag}
                      type="button"
                      disabled={!isEditing}
                      onClick={() => toggleTag(tag)}
                      className={`rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition ${
                        selected
                          ? 'border-[#b9d2ef] bg-[#eef5fd] text-[#1769d1]'
                          : 'border-[#dfe3e8] bg-white text-[#777e87] hover:border-[#cbd1d8] hover:bg-[#f8f9fb]'
                      } ${
                        !isEditing
                          ? 'cursor-default'
                          : ''
                      }`}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </section>

            {saveError && (
              <div className="mt-5 rounded-md border border-[#f0caca] bg-[#fff7f7] px-3 py-2.5 text-[12px] text-[#c43b3b]">
                {saveError}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-[#e9ebee] bg-[#fafbfc] px-5 py-3">
          <div>
            {editData.screenshotUrl && (
              <a
                href={editData.screenshotUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#dfe3e8] bg-white px-3 text-[12px] font-medium text-[#5f6670] transition hover:border-[#cbd1d8] hover:bg-[#f8f9fb] hover:text-[#17191c]"
              >
                Open website
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14 5h5v5" />
                  <path d="M10 14 19 5" />
                  <path d="M19 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4" />
                </svg>
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="h-8 rounded-md border border-[#dfe3e8] bg-white px-3 text-[12px] font-medium text-[#5f6670] transition hover:bg-[#f5f6f8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#1769d1] px-4 text-[12px] font-semibold text-white transition hover:bg-[#125bb8] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <svg
                        className="animate-spin"
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="currentColor"
                          strokeWidth="2"
                          opacity="0.35"
                        />
                        <path
                          d="M21 12a9 9 0 0 0-9-9"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save changes'
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="h-8 rounded-md bg-[#1769d1] px-4 text-[12px] font-semibold text-white transition hover:bg-[#125bb8]"
              >
                Edit reference
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
