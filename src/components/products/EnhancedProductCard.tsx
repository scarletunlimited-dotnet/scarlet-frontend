"use client";
import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Product } from '../../lib/types';
import { getOptimizedImageKitUrl, isImageKitUrl } from '@/lib/imagekit-config';
import { getEffectiveStock } from '../../lib/product-utils';

interface EnhancedProductCardProps {
  product: Product;
}

const EnhancedProductCard = React.memo(function EnhancedProductCard({ 
  product
}: EnhancedProductCardProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsNavigating(true);
    router.push(`/products/${product.slug}`);
  };



  const handleNavigation = () => {
    setIsNavigating(true);
  };

  const formatPrice = (amount: number | undefined) => `৳${amount?.toLocaleString('en-US') || '0'}`;
  
  const discountPercentage = product.price.originalAmount 
    ? Math.round(((product.price.originalAmount - product.price.amount) / product.price.originalAmount) * 100)
    : 0;

  const isComingSoon = product.isComingSoon || product.homepageSection === 'coming-soon';
  // Calculate effective stock (considering variant stock)
  const effectiveStock = React.useMemo(() => getEffectiveStock(product), [product]);
  const isOutOfStock = !isComingSoon && effectiveStock <= 0;
  const isLowStock = !isComingSoon && effectiveStock > 0 && effectiveStock <= 5;

  // Determine if product has multiple images for hover effect
  const hasMultipleImages = product.images && product.images.length > 1;

  const handlePreorder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsNavigating(true);
    router.push(`/products/${product.slug}`);
  };

  return (
    <div
      className="group relative bg-stone-50 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-out transform hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link 
        href={`/products/${product.slug}`} 
        onClick={handleNavigation} 
        prefetch={true}
        scroll={true}
      >
        {/* Product Image */}
        <div className="aspect-square relative overflow-hidden bg-rose-50">
          {product.images && product.images.length > 0 ? (
            <>
              {/* First Image - Always visible */}
              <Image
                src={
                  product.images[0] && isImageKitUrl(product.images[0])
                    ? getOptimizedImageKitUrl(product.images[0], 600, 600, 80)
                    : (product.images[0] || '/images/placeholder.jpg')
                }
                alt={product.title}
                fill
                className={`object-cover group-hover:scale-110 transition-all duration-300 ease-out ${
                  isHovered && hasMultipleImages ? 'opacity-0' : 'opacity-100'
                }`}
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                quality={80}
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                unoptimized={product.images[0] ? isImageKitUrl(product.images[0]) : false}
              />
              {/* Second Image - Only shown on hover if available */}
              {hasMultipleImages && product.images[1] && (
                <Image
                  src={
                    isImageKitUrl(product.images[1])
                      ? getOptimizedImageKitUrl(product.images[1], 600, 600, 80)
                      : product.images[1]
                  }
                  alt={`${product.title} - Alternative view`}
                  fill
                  className={`object-cover group-hover:scale-110 transition-all duration-300 ease-out absolute inset-0 ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                  }`}
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  quality={80}
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                  unoptimized={isImageKitUrl(product.images[1])}
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-100 to-purple-100">
              <span className="text-4xl text-red-300">💄</span>
            </div>
          )}
          
          {/* Navigation Loading Overlay */}
          {isNavigating && (
            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner />
                <span className="text-sm font-medium text-gray-700">Loading...</span>
              </div>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {isComingSoon && (
              <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                Coming Soon
              </span>
            )}
            {!isComingSoon && isOutOfStock && (
              <span className="bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                Out of Stock
              </span>
            )}
          </div>


          {/* Add to Cart / Preorder Button */}
          <div className={`
            absolute bottom-0 left-0 right-0 p-3 transition-all duration-300
            ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
          `}>
            {isComingSoon ? (
              <button
                onClick={handlePreorder}
                disabled={isNavigating}
                className="w-full py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 bg-purple-700 hover:bg-purple-800 text-white shadow-lg"
              >
                {isNavigating ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  'Preorder'
                )}
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isNavigating}
                className={`
                  w-full py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200
                  ${isOutOfStock 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-red-700 hover:bg-red-800 text-white shadow-lg'
                  }
                `}
              >
                {isNavigating ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : isOutOfStock ? (
                  'Out of Stock'
                ) : (
                  'View Details'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Brand */}
          {product.brand && (
            <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">
              {product.brand}
            </p>
          )}
          
          {/* Title */}
          <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-red-700 transition-colors duration-300 ease-out">
            {product.title}
          </h3>
          
          
          {/* Price */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900">
              {formatPrice(product.price.amount)}
            </span>
            {product.price.originalAmount && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.price.originalAmount)}
              </span>
            )}
            {discountPercentage > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                -{discountPercentage}%
              </span>
            )}
          </div>
        </div>
      </Link>

    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return prevProps.product._id === nextProps.product._id &&
         prevProps.product.stock === nextProps.product.stock &&
         prevProps.product.price.amount === nextProps.product.price.amount;
});

export default EnhancedProductCard;


function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
