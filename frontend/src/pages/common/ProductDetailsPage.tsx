// src/pages/common/ProductDetailsPage.tsx
import React, { useEffect, useState, JSX } from "react";
import { useParams, useNavigate } from "react-router-dom";
import productService from "@/services/productService";
import LoadingPage from "@/components/LoadingPage";
import { ArrowLeft, ShoppingBag, BadgeCheck, User2, Mail, Phone } from "lucide-react";
import type { ApiResult } from "@/types/api";
import type { IProductDetail } from "@/types/product";
import { getUser } from "@/services/authService";

const PLACEHOLDER =
  "/mnt/data/A_2D_digital_vector_graphic_showcases_a_%22404_ERROR.png";

export default function ProductDetailsPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const authUser = getUser();

  const [product, setProduct] = useState<IProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (!id) {
      setError("Invalid product id");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res: ApiResult<IProductDetail> =
          await productService.getProductById(id);

        if (res.error) {
          setError(res.error.message || "Failed to load product");
          setProduct(null);
        } else {
          setProduct(res.data ?? null);
          setActiveImageIndex(0);
        }
      } catch (err: any) {
        setError(err?.message ?? "Failed to load product");
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return <LoadingPage message="Loading product details..." fullScreen />;
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow p-6 text-center">
          <p className="text-lg font-semibold text-rose-600">
            {error || "Product not found"}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            <span>Go back</span>
          </button>
        </div>
      </div>
    );
  }

  const images =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [PLACEHOLDER];

  const activeImage = images[activeImageIndex] ?? images[0];

  const categoryName =
    typeof product.category === "string"
      ? ""
      : product.category
      ? (product.category as any).name
      : "";

  const vendor = product.vendor as any;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Back action */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Image gallery */}
          <div className="space-y-4">
            {/* Main Image – tall, non-blurry */}
          <div className="w-full rounded-3xl overflow-hidden shadow-md bg-white">
  <div className="relative w-full h-[520px] flex items-center justify-center bg-white">
    {activeImage ? (
      <img
        src={activeImage}
        alt={product.title}
        className="
          max-h-full
          max-w-full
          object-contain
          select-none
        "
        loading="lazy"
      />
    ) : (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-sm">
        <span>No image available</span>
      </div>
    )}
  </div>
</div>



            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`
                      shrink-0 rounded-xl border
                      overflow-hidden
                      ${idx === activeImageIndex
                        ? "border-indigo-500 ring-2 ring-indigo-200"
                        : "border-gray-200 hover:border-indigo-300"}
                    `}
                  >
                  <img
  src={img}
  alt={`${product.title} ${idx + 1}`}
  className="h-20 w-20 sm:h-24 sm:w-24 object-contain bg-white"
  loading="lazy"
/>


                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Details */}
          <div className="flex flex-col gap-6">
            {/* Product core info */}
            <div className="bg-white/80 backdrop-blur rounded-3xl shadow-md border border-gray-100 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {product.title}
                  </h1>
                  {categoryName && (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                      <ShoppingBag size={14} />
                      <span>{categoryName}</span>
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-600">
                    ₹{product.price.toFixed(2)}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {product.stock ?? 0} in stock
                  </div>
                  <div className="mt-1 text-xs">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium
                        ${
                          product.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                    >
                      <BadgeCheck size={12} />
                      {product.isActive ? "Available" : "UnAvailable"}
                    </span>
                  </div>
                </div>
              </div>

              {product.description && product.description.trim() !== "" && (
                <div className="mt-4">
                  <h2 className="text-sm font-semibold text-gray-800 mb-1">
                    Description
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}
            </div>

            {/* Vendor info card (extracted) */}
            <div className="bg-white/90 backdrop-blur rounded-3xl shadow-md border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">
                Vendor information
              </h2>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User2 className="text-indigo-600" size={20} />
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {vendor?.name ?? "Vendor"}
                    </p>
                    <span className="text-[11px] rounded-full bg-gray-100 text-gray-600 px-2 py-0.5">
                      {vendor?.role ?? "Vendor"}
                    </span>
                  </div>

                  {vendor?.email && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                      <Mail size={14} />
                      <span>{vendor.email}</span>
                    </div>
                  )}

                  {vendor?.phoneNumber && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                      <Phone size={14} />
                      <span>{vendor.phoneNumber}</span>
                    </div>
                  )}

                  <p className="mt-3 text-xs text-gray-500">
                    This information is provided by the vendor who listed this
                    product. Contact details are to be used only for order or
                    product-related queries.
                  </p>
                </div>
              </div>
            </div>

            {/* Optional actions – you can customize per role */}
            {authUser?.role === "buyer" && (
              <div className="bg-white/80 backdrop-blur rounded-3xl shadow border border-gray-100 p-4 flex items-center justify-between gap-3">
                <p className="text-xs text-gray-600">
                  Ready to buy this product? Proceed to checkout from your cart.
                </p>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700"
                  // onClick={...}
                >
                  <ShoppingBag size={16} />
                  <span>Add to cart</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
