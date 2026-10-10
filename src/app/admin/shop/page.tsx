import { saveShopProduct } from "@/actions/shop";
import { ShopProductForm } from "@/components/admin/shop-product-form";
import { prisma } from "@/lib/prisma";

export default async function AdminShopPage() {
  const products = await prisma.shopProduct.findMany({ orderBy: { createdAt: "asc" } });
  return <main id="main" className="container py-10 md:py-14"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-signal">Commerce</p><h1 className="text-3xl font-bold">Pickup shop</h1><p className="mt-2 text-sm text-lichen">Manage merchandise pricing, photos and stock. Members contact organisers to reserve; no online payment is taken.</p></div></div><div className="mt-8 grid gap-5 lg:grid-cols-2">{products.map((product) => <ShopProductForm key={product.id} product={{ ...product, price: product.price.toString() }} />)}<ShopProductForm /></div></main>;
}
