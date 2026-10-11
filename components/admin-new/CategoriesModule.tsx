"use client";

import { useEffect, useState, type FormEvent } from "react";

type Category = {
  id: number;
  name: string;
  image_url: string | null;
};

export default function CategoriesModule() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadCategories() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin-new/categories", {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to load categories.");
      setCategories(result.categories || []);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  function editCategory(category: Category) {
    setEditingId(category.id);
    setName(category.name);
    setSelectedImage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setSelectedImage(null);
    const input = document.getElementById("category-image") as HTMLInputElement | null;
    if (input) input.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      alert("Enter the category name.");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());

      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      if (editingId !== null) {
        formData.append("id", String(editingId));
      }

      const response = await fetch("/api/admin-new/categories", {
        method: editingId !== null ? "PATCH" : "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save category.");
      }

      alert(editingId !== null ? "Category updated successfully." : "Category added successfully.");
      resetForm();
      await loadCategories();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save category.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-800">Categories</h2>
        <p className="mt-1 text-sm text-slate-500">
          Add product categories, update names and manage category images.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <h3 className="text-lg font-bold text-slate-800">
          {editingId !== null ? "Edit Category" : "Add Category"}
        </h3>

        <div>
          <label htmlFor="category-name" className="mb-1 block text-sm font-semibold">
            Category Name
          </label>
          <input
            id="category-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Fashion"
            maxLength={100}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
          />
        </div>

        <div>
          <label htmlFor="category-image" className="mb-1 block text-sm font-semibold">
            Category Image
          </label>
          <input
            id="category-image"
            type="file"
            accept="image/*"
            onChange={(event) => setSelectedImage(event.target.files?.[0] || null)}
            className="block w-full rounded-xl border border-slate-300 p-3 text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">
            Optional. Maximum size: 5 MB.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#172554] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : editingId !== null ? "Save Changes" : "Add Category"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={() => void loadCategories()}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold"
          >
            Refresh
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 text-lg font-bold text-slate-800">
          Existing Categories ({categories.length})
        </h3>

        {loading ? (
          <p className="text-sm text-slate-500">Loading categories...</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-slate-500">No categories found.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="overflow-hidden rounded-xl border border-slate-200"
              >
                {category.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className="h-36 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-36 items-center justify-center bg-slate-100 text-4xl">
                    🗂️
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 p-3">
                  <span className="break-words font-semibold">{category.name}</span>
                  <button
                    type="button"
                    onClick={() => editCategory(category)}
                    className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
