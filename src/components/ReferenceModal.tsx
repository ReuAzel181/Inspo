'use client'

import {
  ChangeEvent,
  ClipboardEvent as ReactClipboardEvent,
  DragEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  Reference,
  DESIGN_TAG_GROUPS,
  INDUSTRY_CATEGORIES,
} from '@/types'

interface ReferenceModalProps {
  reference: Reference
  onClose: () => void
  onUpdate: (reference: Reference) => void
}

type ImagePosition = 'top' | 'center' | 'bottom'

export default function ReferenceModal({
  reference,
  onClose,
  onUpdate,
}: ReferenceModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addImagesInputRef = useRef<HTMLInputElement>(null)

  const [isEditing, setIsEditing] = useState(true)
  const [isDraggingThumbnail, setIsDraggingThumbnail] =
    useState(false)
  const [thumbnailError, setThumbnailError] =
    useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  // Image drag/reorder state.
  const [draggedImageIndex, setDraggedImageIndex] =
    useState<number | null>(null)
  const [dragOverImageIndex, setDragOverImageIndex] =
    useState<number | null>(null)

  const [thumbnailDataUrl, setThumbnailDataUrl] =
    useState('')

  const [additionalImageDataUrls, setAdditionalImageDataUrls] =
    useState<string[]>(
      reference.additionalImageUrls || []
    )

  const [additionalImageNames, setAdditionalImageNames] =
    useState<string[]>(
      reference.additionalImageNames || []
    )

  const [additionalLinks, setAdditionalLinks] =
    useState<string[]>(
      reference.additionalLinks || []
    )

  const [additionalLinkNames, setAdditionalLinkNames] =
    useState<string[]>(
      reference.additionalLinkNames || []
    )

  const [thumbnailPosition, setThumbnailPosition] =
    useState<ImagePosition>(
      reference.thumbnailPosition || 'top'
    )

  const [additionalImagePositions, setAdditionalImagePositions] =
    useState<ImagePosition[]>(
      reference.additionalImagePositions || []
    )

  const [editData, setEditData] = useState({
    url: reference.url || '',
    title: reference.title || '',
    description: reference.description || '',
    thumbnailUrl: reference.thumbnailUrl || '',
    screenshotUrl: reference.screenshotUrl || '',
    tags: reference.tags || [],
    notes: reference.notes || '',
    industry: reference.industry || '',
  })

  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      setIsVisible(true)
    )

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      cancelAnimationFrame(frame)
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const handleClose = () => {
    if (isClosing) return

    setIsClosing(true)

    window.setTimeout(() => {
      onClose()
    }, 180)
  }

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

  const selectThumbnail = async (file?: File) => {
    if (!file) return

    setThumbnailError('')

    if (!isImageFile(file)) {
      setThumbnailError(
        'Please select an image file.'
      )
      return
    }

    try {
      const dataUrl = await readImageFile(file)
      setThumbnailDataUrl(dataUrl)
    } catch {
      setThumbnailError(
        'Unable to read the selected image.'
      )
    }
  }

  const addImages = async (
    files: FileList | File[]
  ) => {
    const imageFiles = Array.from(files).filter(
      isImageFile
    )

    if (!imageFiles.length) {
      setThumbnailError(
        'Please select image files only.'
      )
      return
    }

    setThumbnailError('')

    try {
      const dataUrls = await Promise.all(
        imageFiles.map((file) =>
          readImageFile(file)
        )
      )

      setAdditionalImageDataUrls((prev) => [
        ...prev,
        ...dataUrls,
      ])

      setAdditionalImageNames((prev) => [
        ...prev,
        ...imageFiles.map((file) =>
          file.name.replace(/\.[^/.]+$/, '')
        ),
      ])
    } catch {
      setThumbnailError(
        'Unable to read one or more images.'
      )
    }
  }

  /*
   * First pasted image becomes the cover.
   * If a cover already exists, the pasted image is
   * appended as an additional image.
   */
  const handleThumbnailPaste = async (
    event: ReactClipboardEvent<HTMLDivElement>
  ) => {
    if (!isEditing) return

    const imageItem = Array.from(
      event.clipboardData.items
    ).find((item) =>
      item.type.startsWith('image/')
    )

    if (!imageItem) return

    event.preventDefault()

    const file = imageItem.getAsFile()

    if (!file) return

    if (imageSources.length > 0) {
      await addImages([file])
    } else {
      await selectThumbnail(file)
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

    const files = event.dataTransfer.files

    if (!files?.length) return

    /*
     * If an image already exists, dropped files become
     * additional images. Otherwise the first image
     * becomes the cover.
     */
    if (imageSources.length > 0) {
      void addImages(files)
      return
    }

    void selectThumbnail(files[0])
  }

  /*
   * Removes an image by its position in imageSources.
   *
   * Index 0 = cover.
   * Index 1+ = additional images.
   *
   * If the cover is removed and another image exists,
   * the next image is promoted to become the cover.
   */
  const handleRemoveImage = (index: number) => {
    if (index < 0 || index >= imageSources.length) {
      return
    }

    setThumbnailError('')

    // Removing the cover.
    if (index === 0) {
      if (additionalImageDataUrls.length > 0) {
        const [nextCover, ...remainingImages] =
          additionalImageDataUrls

        const [nextCoverName, ...remainingNames] =
          additionalImageNames

        const [
          nextCoverPosition,
          ...remainingPositions
        ] = additionalImagePositions

        /*
         * The promoted image can either be a newly
         * uploaded data URL or an existing persisted URL.
         */
        if (nextCover.startsWith('data:')) {
          setThumbnailDataUrl(nextCover)

          setEditData((prev) => ({
            ...prev,
            thumbnailUrl: '',
          }))
        } else {
          setThumbnailDataUrl('')

          setEditData((prev) => ({
            ...prev,
            thumbnailUrl: nextCover,
          }))
        }

        setThumbnailPosition(
          nextCoverPosition || 'top'
        )

        setAdditionalImageDataUrls(
          remainingImages
        )

        setAdditionalImageNames(
          remainingNames
        )

        setAdditionalImagePositions(
          remainingPositions
        )

        /*
         * The cover does not use an additional image
         * name, so the promoted image's old name is
         * intentionally removed from additional names.
         */
        void nextCoverName

        return
      }

      // No additional images remain.
      setThumbnailDataUrl('')

      setEditData((prev) => ({
        ...prev,
        thumbnailUrl: '',
      }))

      setThumbnailPosition('top')

      return
    }

    // Removing an additional image.
    const additionalIndex = index - 1

    setAdditionalImageDataUrls((prev) =>
      prev.filter(
        (_, imageIndex) =>
          imageIndex !== additionalIndex
      )
    )

    setAdditionalImageNames((prev) =>
      prev.filter(
        (_, imageIndex) =>
          imageIndex !== additionalIndex
      )
    )

    setAdditionalImagePositions((prev) =>
      prev.filter(
        (_, imageIndex) =>
          imageIndex !== additionalIndex
      )
    )
  }

  /*
   * Reorders the complete image collection.
   *
   * The first item is always treated as the cover.
   * This allows users to drag an additional image
   * into the first position and make it the cover.
   */
  const reorderImages = (
    fromIndex: number,
    toIndex: number
  ) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= imageSources.length ||
      toIndex >= imageSources.length
    ) {
      return
    }

    const images = [...imageSources]

    /*
     * There is no separate cover name in the current
     * data model. Keep an empty placeholder at index 0
     * so additional names continue lining up correctly.
     */
    const names = [
      '',
      ...additionalImageNames,
    ]

    const positions: ImagePosition[] = [
      thumbnailPosition,
      ...additionalImagePositions,
    ]

    // Make sure positions always match image count.
    while (positions.length < images.length) {
      positions.push('top')
    }

    const [movedImage] = images.splice(
      fromIndex,
      1
    )

    images.splice(toIndex, 0, movedImage)

    const [movedName] = names.splice(
      fromIndex,
      1
    )

    names.splice(toIndex, 0, movedName)

    const [movedPosition] = positions.splice(
      fromIndex,
      1
    )

    positions.splice(toIndex, 0, movedPosition)

    const [
      newCover,
      ...newAdditionalImages
    ] = images

    const [
      newCoverName,
      ...newAdditionalNames
    ] = names

    const [
      newCoverPosition,
      ...newAdditionalPositions
    ] = positions

    /*
     * If the new cover is a data URL, it came from a
     * newly uploaded/pasted image.
     *
     * If it is a normal URL, keep it as thumbnailUrl.
     */
    if (newCover?.startsWith('data:')) {
      setThumbnailDataUrl(newCover)

      setEditData((prev) => ({
        ...prev,
        thumbnailUrl: '',
      }))
    } else {
      setThumbnailDataUrl('')

      setEditData((prev) => ({
        ...prev,
        thumbnailUrl: newCover || '',
      }))
    }

    setThumbnailPosition(
      newCoverPosition || 'top'
    )

    setAdditionalImageDataUrls(
      newAdditionalImages
    )

    /*
     * Additional image names begin after the cover.
     * The cover itself does not have a separate name.
     */
    void newCoverName

    setAdditionalImageNames(
      newAdditionalNames
    )

    setAdditionalImagePositions(
      newAdditionalPositions
    )
  }

  const handleImageDragStart = (
    event: DragEvent<HTMLDivElement>,
    index: number
  ) => {
    if (!isEditing) return

    setDraggedImageIndex(index)
    setDragOverImageIndex(null)

    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData(
      'text/plain',
      String(index)
    )
  }

  const handleImageDragOver = (
    event: DragEvent<HTMLDivElement>,
    index: number
  ) => {
    if (!isEditing) return

    /*
     * Only treat this as image reordering when an
     * internal image is currently being dragged.
     */
    if (draggedImageIndex === null) return

    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'

    setDragOverImageIndex(index)
  }

  const handleImageDragLeave = (
    event: DragEvent<HTMLDivElement>
  ) => {
    /*
     * Avoid clearing the state when moving between
     * children inside the same image card.
     */
    if (
      !event.currentTarget.contains(
        event.relatedTarget as Node
      )
    ) {
      setDragOverImageIndex(null)
    }
  }

  const handleImageDrop = (
    event: DragEvent<HTMLDivElement>,
    index: number
  ) => {
    if (!isEditing) return

    event.preventDefault()
    event.stopPropagation()

    if (draggedImageIndex === null) {
      return
    }

    const fromIndex = draggedImageIndex

    setDraggedImageIndex(null)
    setDragOverImageIndex(null)

    if (fromIndex === index) {
      return
    }

    reorderImages(fromIndex, index)
  }

  const handleImageDragEnd = () => {
    setDraggedImageIndex(null)
    setDragOverImageIndex(null)
  }

  const toggleTag = (tag: string) => {
    setEditData((prev) => {
      const exists = prev.tags.includes(tag)

      return {
        ...prev,
        tags: exists
          ? prev.tags.filter(
              (item) => item !== tag
            )
          : [...prev.tags, tag],
      }
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError('')

    const validSiteLinks = additionalLinks
      .map((link, index) => ({
        link: link.trim(),
        name: additionalLinkNames[index]?.trim() || '',
      }))
      .filter(({ link }) => link.length > 0)

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
            additionalLinks: validSiteLinks.map(({ link }) => link),
            additionalLinkNames: validSiteLinks.map(({ name }) => name),
            thumbnailDataUrl:
              thumbnailDataUrl || undefined,
            additionalImageDataUrls,
            additionalImageNames,
            thumbnailPosition,
            additionalImagePositions,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(
          'Failed to save reference'
        )
      }

      const updated = await response.json()

      onUpdate(updated)
      setAdditionalLinks(validSiteLinks.map(({ link }) => link))
      setAdditionalLinkNames(validSiteLinks.map(({ name }) => name))
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
      className={`fixed inset-0 z-50 flex items-center justify-center bg-transparent p-4 transition-opacity duration-200 ${
        isVisible && !isClosing
          ? 'opacity-100'
          : 'opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Reference details"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose()
        }
      }}
    >
      <div
        className={`flex max-h-[92vh] w-full max-w-[1120px] flex-col overflow-hidden rounded-lg border border-[#dfe3e8] bg-white shadow-[0_24px_70px_rgba(23,25,28,0.18)] transition-all duration-200 ${
          isVisible && !isClosing
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-2 scale-[0.98] opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#e9ebee] px-5 py-4">
          <div className="min-w-0">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9298a1]">
              Reference
            </div>

            <h2 className="truncate text-[18px] font-semibold text-[#17191c]">
              {editData.title ||
                'Untitled reference'}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
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
                <>
                  {/* ONE IMAGE — FULL AVAILABLE WIDTH */}
                  {imageSources.length === 1 && (
                    <div className="w-full">
                      {imageSources.map(
                        (src, index) => (
                          <div
                            key={`${src}-${index}`}
                            draggable={isEditing}
                            onDragStart={(event) =>
                              handleImageDragStart(
                                event,
                                index
                              )
                            }
                            onDragOver={(event) =>
                              handleImageDragOver(
                                event,
                                index
                              )
                            }
                            onDragLeave={
                              handleImageDragLeave
                            }
                            onDrop={(event) =>
                              handleImageDrop(
                                event,
                                index
                              )
                            }
                            onDragEnd={
                              handleImageDragEnd
                            }
                            className={`group relative w-full overflow-hidden rounded-lg border border-[#dfe3e8] bg-[#f1f3f5] ${
                              isEditing
                                ? 'cursor-grab active:cursor-grabbing'
                                : ''
                            } ${
                              draggedImageIndex ===
                              index
                                ? 'opacity-50'
                                : ''
                            } ${
                              dragOverImageIndex ===
                              index
                                ? 'ring-2 ring-[#1769d1]/30'
                                : ''
                            }`}
                          >
                            <div className="absolute left-2 top-2 z-10 rounded-md border border-[#dfe3e8] bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#5f6670] shadow-sm">
                              Cover
                            </div>

                            {isEditing && (
                              <button
                                type="button"
                                draggable={false}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  handleRemoveImage(
                                    index
                                  )
                                }}
                                className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-md border border-[#efcaca] bg-white/95 text-[#d33b3b] opacity-0 shadow-sm transition hover:border-[#e4aaaa] hover:bg-[#fff6f6] group-hover:opacity-100 focus:opacity-100"
                                aria-label="Remove cover image"
                                title="Remove cover image"
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

                            <div className="max-h-[420px] w-full overflow-auto">
                              <img
                                src={src}
                                alt="Reference cover"
                                draggable={false}
                                className="block h-auto w-full"
                              />
                            </div>

                            <div className="flex w-full items-center justify-between gap-2 border-t border-[#dfe3e8] bg-white px-3 py-2">
                              <span className="text-[11px] text-[#777e87]">
                                Primary image
                              </span>

                              <span className="text-[10px] text-[#9298a1]">
                                {isEditing
                                  ? 'Drag to reorder'
                                  : 'Scroll to inspect'}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* TWO IMAGES */}
                  {imageSources.length === 2 && (
                    <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
                      {imageSources.map(
                        (src, index) => (
                          <div
                            key={`${src}-${index}`}
                            draggable={isEditing}
                            onDragStart={(event) =>
                              handleImageDragStart(
                                event,
                                index
                              )
                            }
                            onDragOver={(event) =>
                              handleImageDragOver(
                                event,
                                index
                              )
                            }
                            onDragLeave={
                              handleImageDragLeave
                            }
                            onDrop={(event) =>
                              handleImageDrop(
                                event,
                                index
                              )
                            }
                            onDragEnd={
                              handleImageDragEnd
                            }
                            className={`group relative min-w-0 w-full overflow-hidden rounded-lg border border-[#dfe3e8] bg-[#f1f3f5] ${
                              isEditing
                                ? 'cursor-grab active:cursor-grabbing'
                                : ''
                            } ${
                              draggedImageIndex ===
                              index
                                ? 'opacity-50'
                                : ''
                            } ${
                              dragOverImageIndex ===
                              index
                                ? 'ring-2 ring-[#1769d1]/30'
                                : ''
                            }`}
                          >
                            <div className="absolute left-2 top-2 z-10 rounded-md border border-[#dfe3e8] bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#5f6670] shadow-sm">
                              {index === 0
                                ? 'Cover'
                                : 'Image 2'}
                            </div>

                            {isEditing && (
                              <button
                                type="button"
                                draggable={false}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  handleRemoveImage(
                                    index
                                  )
                                }}
                                className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-md border border-[#efcaca] bg-white/95 text-[#d33b3b] opacity-0 shadow-sm transition hover:border-[#e4aaaa] hover:bg-[#fff6f6] group-hover:opacity-100 focus:opacity-100"
                                aria-label={`Remove ${
                                  index === 0
                                    ? 'cover image'
                                    : 'image 2'
                                }`}
                                title="Remove image"
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

                            <div
                              className="h-[300px] w-full overflow-auto"
                              onWheel={(event) => {
                                const container =
                                  event.currentTarget

                                if (
                                  container.scrollHeight >
                                  container.clientHeight
                                ) {
                                  const scrollAmount =
                                    event.deltaY * 0.3

                                  container.scrollTop +=
                                    scrollAmount

                                  event.preventDefault()
                                  event.stopPropagation()
                                }
                              }}
                            >
                              <img
                                src={src}
                                alt={
                                  index === 0
                                    ? 'Reference cover'
                                    : 'Reference image 2'
                                }
                                draggable={false}
                                className="block h-auto min-h-full w-full object-cover"
                              />
                            </div>

                            <div className="flex w-full items-center justify-between gap-2 border-t border-[#dfe3e8] bg-white px-3 py-2">
                              <span className="text-[11px] text-[#777e87]">
                                {index === 0
                                  ? 'Primary image'
                                  : 'Additional image'}
                              </span>

                              <span className="text-[10px] text-[#9298a1]">
                                {isEditing
                                  ? 'Drag to reorder'
                                  : 'Scroll to inspect'}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* THREE OR MORE IMAGES */}
                  {imageSources.length > 2 && (
                    <div className="flex w-full gap-3 overflow-x-auto pb-2">
                      {imageSources.map(
                        (src, index) => (
                          <div
                            key={`${src}-${index}`}
                            draggable={isEditing}
                            onDragStart={(event) =>
                              handleImageDragStart(
                                event,
                                index
                              )
                            }
                            onDragOver={(event) =>
                              handleImageDragOver(
                                event,
                                index
                              )
                            }
                            onDragLeave={
                              handleImageDragLeave
                            }
                            onDrop={(event) =>
                              handleImageDrop(
                                event,
                                index
                              )
                            }
                            onDragEnd={
                              handleImageDragEnd
                            }
                            className={`group relative w-[min(78vw,720px)] shrink-0 overflow-hidden rounded-lg border border-[#dfe3e8] bg-[#f1f3f5] ${
                              isEditing
                                ? 'cursor-grab active:cursor-grabbing'
                                : ''
                            } ${
                              draggedImageIndex ===
                              index
                                ? 'opacity-50'
                                : ''
                            } ${
                              dragOverImageIndex ===
                              index
                                ? 'ring-2 ring-[#1769d1]/30'
                                : ''
                            }`}
                          >
                            <div className="absolute left-2 top-2 z-10 rounded-md border border-[#dfe3e8] bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#5f6670] shadow-sm">
                              {index === 0
                                ? 'Cover'
                                : `Image ${
                                    index + 1
                                  }`}
                            </div>

                            {isEditing && (
                              <button
                                type="button"
                                draggable={false}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  handleRemoveImage(
                                    index
                                  )
                                }}
                                className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-md border border-[#efcaca] bg-white/95 text-[#d33b3b] opacity-0 shadow-sm transition hover:border-[#e4aaaa] hover:bg-[#fff6f6] group-hover:opacity-100 focus:opacity-100"
                                aria-label={`Remove image ${
                                  index + 1
                                }`}
                                title="Remove image"
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

                            <div
                              className="h-[380px] w-full overflow-auto"
                              onWheel={(event) => {
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
                                draggable={false}
                                className="block h-auto w-full min-w-full max-w-none"
                              />
                            </div>

                            <div className="flex w-full items-center justify-between gap-2 border-t border-[#dfe3e8] bg-white px-3 py-2">
                              <span className="text-[11px] text-[#777e87]">
                                {index === 0
                                  ? 'Primary image'
                                  : 'Additional image'}
                              </span>

                              <span className="text-[10px] text-[#9298a1]">
                                {isEditing
                                  ? 'Drag to reorder'
                                  : 'Scroll to inspect'}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {isEditing && (
                    <p className="mt-2 text-[10px] text-[#9298a1]">
                      Drag an image onto another image to
                      change its order. The first image is
                      always the cover.
                    </p>
                  )}
                </>
              ) : (
                /* Empty image state */
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {/* Drop image */}
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
                    className={`
                      flex
                      h-[260px]
                      cursor-pointer
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-dashed
                      transition
                      ${
                        isDraggingThumbnail
                          ? 'border-[#1769d1] bg-[#f3f8ff]'
                          : 'border-[#cfd4da] bg-[#f8f9fb] hover:border-[#aeb5bd] hover:bg-[#f5f6f8]'
                      }
                    `}
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
                          <circle
                            cx="8.5"
                            cy="8.5"
                            r="1.5"
                          />
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

                  {/* Paste image */}
                  <div
                    tabIndex={isEditing ? 0 : -1}
                    onPaste={handleThumbnailPaste}
                    onClick={(event) => {
                      if (isEditing) {
                        event.currentTarget.focus()
                      }
                    }}
                    className="
                      flex
                      h-[260px]
                      cursor-text
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-dashed
                      border-[#cfd4da]
                      bg-[#f8f9fb]
                      px-4
                      text-center
                      text-[11px]
                      text-[#777e87]
                      outline-none
                      transition
                      hover:border-[#aeb5bd]
                      hover:bg-[#f5f6f8]
                      focus:border-[#1769d1]
                      focus:ring-2
                      focus:ring-[#1769d1]/10
                    "
                  >
                    <div>
                      <svg
                        className="mx-auto mb-3 h-7 w-7 text-[#777e87]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        aria-hidden="true"
                      >
                        <path d="M12 16V4" />
                        <path d="m7 9 5-5 5 5" />
                        <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
                      </svg>

                      <p className="font-medium text-[#5f6670]">
                        Paste an image
                      </p>

                      <p className="mt-1 text-[#9298a1]">
                        Click here, then press Ctrl+V
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Add more images */}
              {isEditing &&
                imageSources.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {/* Drag more images */}
                    <div
                      onDragOver={(event) => {
                        /*
                         * Do not activate the file-drop state
                         * when dragging an existing image card.
                         */
                        if (
                          draggedImageIndex !== null
                        ) {
                          return
                        }

                        event.preventDefault()
                        setIsDraggingThumbnail(true)
                      }}
                      onDragLeave={() =>
                        setIsDraggingThumbnail(false)
                      }
                      onDrop={(event) => {
                        /*
                         * Existing image cards use their own
                         * drop handler. This area only accepts
                         * actual external image files.
                         */
                        if (
                          draggedImageIndex !== null
                        ) {
                          return
                        }

                        event.preventDefault()
                        setIsDraggingThumbnail(false)

                        void addImages(
                          event.dataTransfer.files
                        )
                      }}
                      className={`
                        flex
                        min-h-12
                        w-full
                        items-center
                        justify-between
                        gap-3
                        rounded-md
                        border
                        border-dashed
                        px-3
                        py-2
                        transition
                        ${
                          isDraggingThumbnail
                            ? 'border-[#1769d1] bg-[#f3f8ff]'
                            : 'border-[#dfe3e8] bg-[#fafbfc] hover:border-[#cbd1d8]'
                        }
                      `}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="shrink-0 text-[#777e87]"
                        >
                          <path d="M12 3v12" />
                          <path d="m7 10 5 5 5-5" />
                          <path d="M5 21h14" />
                        </svg>

                        <span className="text-[11px] text-[#777e87]">
                          Drag more images here
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          addImagesInputRef.current?.click()
                        }
                        className="shrink-0 text-[11px] font-semibold text-[#1769d1] hover:underline"
                      >
                        Browse files
                      </button>
                    </div>

                    {/* Paste more images */}
                    <div
                      tabIndex={0}
                      onPaste={handleThumbnailPaste}
                      onClick={(event) => {
                        if (isEditing) {
                          event.currentTarget.focus()
                        }
                      }}
                      className="
                        flex
                        min-h-12
                        w-full
                        cursor-text
                        items-center
                        justify-center
                        gap-2
                        rounded-md
                        border
                        border-dashed
                        border-[#dfe3e8]
                        bg-[#fafbfc]
                        px-3
                        py-2
                        text-[11px]
                        text-[#777e87]
                        outline-none
                        transition
                        hover:border-[#cbd1d8]
                        hover:bg-white
                        focus:border-[#1769d1]
                        focus:ring-2
                        focus:ring-[#1769d1]/10
                      "
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="shrink-0"
                      >
                        <path d="M12 16V4" />
                        <path d="m7 9 5-5 5 5" />
                        <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
                      </svg>

                      <span>
                        Paste image with Ctrl+V
                      </span>
                    </div>
                  </div>
                )}

              {thumbnailError && (
                <p className="mt-2 text-[12px] text-[#d33b3b]">
                  {thumbnailError}
                </p>
              )}

              {/* Crop controls */}
              {isEditing && imageSources.length > 0 && (
                <div
                  className={`mt-3 grid w-full gap-2 ${
                    imageSources.length > 1
                      ? 'sm:grid-cols-2'
                      : 'grid-cols-1'
                  }`}
                >
                  {imageSources.map((_, index) => {
                    const position =
                      index === 0
                        ? thumbnailPosition
                        : additionalImagePositions[index - 1] || 'top'

                    return (
                      <div
                        key={`crop-control-${index}`}
                        className="flex w-full min-w-0 items-center justify-between gap-2 rounded-md border border-[#dfe3e8] bg-[#fafbfc] px-3 py-2.5"
                      >
                        <span className="min-w-0 text-[11px] font-medium text-[#777e87]">
                          {index === 0
                            ? 'Cover'
                            : `Image ${index + 1}`}{' '}
                          crop
                        </span>

                        <div className="flex shrink-0 gap-1 rounded-md border border-[#dfe3e8] bg-white p-1">
                          {(
                            ['top', 'center', 'bottom'] as const
                          ).map((nextPosition) => (
                            <button
                              key={nextPosition}
                              type="button"
                              onClick={() => {
                                if (index === 0) {
                                  setThumbnailPosition(nextPosition)
                                  return
                                }

                                setAdditionalImagePositions((previous) => {
                                  const positions = [...previous]

                                  positions[index - 1] = nextPosition

                                  return positions
                                })
                              }}
                              className={`rounded px-2 py-1 text-[11px] font-medium capitalize transition ${
                                position === nextPosition
                                  ? 'bg-[#eef5fd] text-[#1769d1]'
                                  : 'text-[#777e87] hover:bg-[#f8f9fb]'
                              }`}
                            >
                              {nextPosition}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Title */}
            <div className="mt-6">
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

            {/* Site links */}
            <section className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#777e87]">
                  Site links
                </label>

                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setAdditionalLinks(
                        (previous) => [
                          ...previous,
                          '',
                        ]
                      )

                      setAdditionalLinkNames(
                        (previous) => [
                          ...previous,
                          '',
                        ]
                      )
                    }}
                    className="text-[11px] font-semibold text-[#1769d1] hover:underline"
                  >
                    Add link
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {/* Main site link */}
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-md bg-[#eef5fd] px-1.5 text-[9px] font-semibold uppercase tracking-[0.04em] text-[#1769d1]">
                    Main
                  </span>

                  <input
                    value={editData.url}
                    disabled={!isEditing}
                    onChange={(event) =>
                      handleFieldChange(
                        'url',
                        event.target.value
                      )
                    }
                    placeholder="https://example.com"
                    aria-label="Main site link"
                    className="h-9 min-w-0 flex-1 rounded-md border border-[#dfe3e8] bg-white px-3 text-[12px] text-[#17191c] outline-none placeholder:text-[#a0a6ad] focus:border-[#1769d1] focus:ring-2 focus:ring-[#1769d1]/10 disabled:bg-[#fafbfc]"
                  />
                </div>

                {/* Additional site links */}
                {additionalLinks.map(
                  (link, index) => (
                    <div
                      key={`site-link-${index}`}
                      className="flex items-center gap-2"
                    >
                      {/* Name — left, approximately 30% */}
                      <input
                        value={
                          additionalLinkNames[
                            index
                          ] || ''
                        }
                        disabled={!isEditing}
                        onChange={(event) => {
                          setAdditionalLinkNames(
                            (previous) => {
                              const names = [
                                ...previous,
                              ]

                              names[index] =
                                event.target.value

                              return names
                            }
                          )
                        }}
                        placeholder="Name"
                        aria-label={`Additional site link ${
                          index + 1
                        } name`}
                        className="h-9 w-[30%] min-w-0 shrink-0 rounded-md border border-[#dfe3e8] bg-white px-3 text-[12px] text-[#17191c] outline-none placeholder:text-[#a0a6ad] focus:border-[#1769d1] focus:ring-2 focus:ring-[#1769d1]/10 disabled:bg-[#fafbfc]"
                      />

                      {/* URL — approximately 60% */}
                      <input
                        value={link}
                        disabled={!isEditing}
                        onChange={(event) => {
                          setAdditionalLinks(
                            (previous) => {
                              const links = [
                                ...previous,
                              ]

                              links[index] =
                                event.target.value

                              return links
                            }
                          )
                        }}
                        placeholder="https://example.com"
                        aria-label={`Additional site link ${
                          index + 1
                        }`}
                        className="h-9 flex-1 min-w-0 shrink-0 rounded-md border border-[#dfe3e8] bg-white px-3 text-[12px] text-[#17191c] outline-none placeholder:text-[#a0a6ad] focus:border-[#1769d1] focus:ring-2 focus:ring-[#1769d1]/10 disabled:bg-[#fafbfc]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setAdditionalLinks((previous) =>
                            previous.filter((_, linkIndex) => linkIndex !== index)
                          )
                          setAdditionalLinkNames((previous) =>
                            previous.filter((_, nameIndex) => nameIndex !== index)
                          )
                        }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#efcaca] text-[#d33b3b] transition hover:bg-[#fff7f7]"
                        aria-label={`Remove additional site link ${index + 1}`}
                        title="Remove site link"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>
                    </div>
                  )
                )}
              </div>
            </section>

            {/* Design tags */}
            <section className="mt-5">
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#777e87]">
                Design tags
              </label>

              <div className="flex flex-wrap gap-1.5">
                {DESIGN_TAG_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9298a1]">
                      {group.label}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.tags.map((tag) => {
                        const selected = editData.tags.includes(tag)

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
                            } ${!isEditing ? 'cursor-default' : ''}`}
                          >
                            {tag}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Description */}
            <div className="mt-5">
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

            {/* Industry + Screenshot URL */}
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Industry */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#777e87]">
                  Industry
                </label>

                {isEditing ? (
                  <select
                    value={editData.industry}
                    onChange={(event) =>
                      handleFieldChange('industry', event.target.value)
                    }
                    className="h-9 w-full rounded-md border border-[#dfe3e8] bg-white px-3 text-[13px] text-[#17191c] outline-none focus:border-[#1769d1] focus:ring-2 focus:ring-[#1769d1]/10"
                  >
                    <option value="">None</option>
                    {INDUSTRY_CATEGORIES.filter((industry) => industry !== 'Other').map(
                      (industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      )
                    )}
                  </select>
                ) : (
                  <p className="h-9 flex items-center text-[13px] font-medium text-[#17191c]">
                    {editData.industry || 'None'}
                  </p>
                )}
              </div>

              {/* Screenshot URL */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#777e87]">
                  Screenshot URL
                </label>

                {isEditing ? (
                  <input
                    value={
                      editData.screenshotUrl
                    }
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
            </div>

            {/* Notes */}
            <div className="mt-5">
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
                  {editData.notes ||
                    'No notes.'}
                </p>
              )}
            </div>

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
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#1769d1] px-3 text-[12px] font-semibold text-white transition hover:bg-[#125bb8] focus:outline-none focus:ring-2 focus:ring-[#1769d1]/20"
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
                  onClick={() =>
                    setIsEditing(false)
                  }
                  disabled={isSaving}
                  className="h-8 rounded-md bg-[#d33b3b] px-3 text-[12px] font-semibold text-white transition hover:bg-[#b92f2f] focus:outline-none focus:ring-2 focus:ring-[#d33b3b]/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#1769d1] px-4 text-[12px] font-semibold text-white transition hover:bg-[#125bb8] focus:outline-none focus:ring-2 focus:ring-[#1769d1]/20 disabled:cursor-not-allowed disabled:opacity-60"
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
                onClick={() =>
                  setIsEditing(true)
                }
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