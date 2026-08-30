"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type ImageItem = {
  id: string;
  file: File;
  preview: string;
  primary?: boolean;
};

function SortableImage({
  image,
  remove,
  primary,
  preview,
}: {
  image: ImageItem;
  remove: () => void;
  primary: () => void;
  preview: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: image.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative overflow-hidden rounded-xl border bg-white"
    >
      <img
        src={image.preview}
        onClick={preview}
        className="h-32 w-full cursor-pointer object-cover"
      />

      {image.primary && (
        <span className="absolute left-2 top-2 rounded-full bg-[#800020] px-2 py-1 text-xs font-bold text-white">
          ⭐ Main
        </span>
      )}

      <div className="flex gap-2 p-2">
        <button
          type="button"
          onClick={primary}
          className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold"
        >
          Main
        </button>

        <button
          type="button"
          onClick={remove}
          className="rounded-lg bg-red-100 px-2 py-1 text-xs font-bold text-red-700"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default function ProductImageUploader({
  initialImages = [],
  onChange,
  onMainChange,
}: {
  initialImages?: string[];
  onChange?: (files: File[]) => void;
  onMainChange?: (url: string) => void;
}) {
  const [images, setImages] = useState<ImageItem[]>(() =>
  initialImages.map((url, index) => ({
    id: `existing-${index}-${url}`,
    file: null as unknown as File,
    preview: url,
    primary: index === 0,
  }))
);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  const count = images.length;

  const ids = useMemo(
    () => images.map((i) => i.id),
    [images]
  );

  function addImages(files: FileList | null) {
    if (!files) return;

    const selected = Array.from(files);

    const allowed = selected.filter((file) =>
      [
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(file.type)
    );

    const remaining = 20 - images.length;

    const next = allowed
      .slice(0, remaining)
      .map((file) => ({
        id:
          crypto.randomUUID(),
        file,
        preview:
          URL.createObjectURL(file),
        primary: false,
      }));

   setImages((prev) => {
  const merged = [...prev, ...next];

  if (!merged.some((i) => i.primary) && merged[0]) {
    merged[0].primary = true;
    onMainChange?.(merged[0].preview);
  }

  return merged;
});

if (next.length) {
  onChange?.(next.map((item) => item.file));
}

}

  function removeImage(id: string) {
    setImages((prev) =>
      prev.filter((i) => i.id !== id)
    );
  }

  function setPrimary(id: string) {
  setImages((prev) => {
    const updated = prev.map((i) => ({
      ...i,
      primary: i.id === id,
    }));

    const main = updated.find((i) => i.primary);

    if (main) {
      onMainChange?.(main.preview);
    }

    return updated;
  });
}

  function onDrop(event: any) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setImages((items) => {
      const oldIndex = items.findIndex(
        (i) => i.id === active.id
      );

      const newIndex = items.findIndex(
        (i) => i.id === over.id
      );

      return arrayMove(
        items,
        oldIndex,
        newIndex
      );
    });
  }

  return (
    <section className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-black">
          Product Images
        </h3>

        <p className="text-sm text-slate-500">
          Upload up to 20 images
        </p>

        <p className="mt-1 font-bold text-[#800020]">
          {count} / 20 images
        </p>
      </div>

      <label
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 ${
          count >= 20
            ? "bg-slate-100"
            : "hover:bg-slate-50"
        }`}
      >
        <span className="text-3xl">
          📷
        </span>

        <span className="mt-2 font-bold">
          {count >= 20
            ? "Maximum 20 images reached"
            : "Choose Images"}
        </span>

        {count < 20 && (
          <input
            hidden
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) =>
              addImages(e.target.files)
            }
          />
        )}
      </label>

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={onDrop}
      >
        <SortableContext
          items={ids}
          strategy={rectSortingStrategy}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {images.map((image) => (
              <SortableImage
                key={image.id}
                image={image}
                remove={() =>
                  removeImage(image.id)
                }
                primary={() =>
                  setPrimary(image.id)
                }
                preview={() =>
                  setSelectedPreview(image.preview)
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
            {selectedPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setSelectedPreview(null)}
        >
          <img
            src={selectedPreview}
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
          />
        </div>
      )}

    </section>
  );
}
