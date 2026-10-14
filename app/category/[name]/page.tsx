import CategoryClient from "./CategoryClient";
import { getProducts } from "@/lib/products";

type Props = {
  params: Promise<{ name: string }>;
};

export default async function CategoryPage({ params }: Props) {
  const { name: rawName } = await params;
  const name = decodeURIComponent(String(rawName || ""));

  const products = await getProducts({
    category: name,
    limit: 100,
  });

  return (
    <CategoryClient
      initialProducts={products}
      categoryName={name}
    />
  );
}
