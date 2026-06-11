import type { ProductVariantResponse } from './api-types'

export interface ProductImage {
  url: string
  alt: string
}

export interface ColorVariant {
  id: string
  name: string
  hex: string
}

export interface StorageVariant {
  id: string
  label: string
  priceDelta: number
}

export interface ProductSpec {
  key: string
  value: string
}

export interface Product {
  id: string
  slug: string
  name: string
  brand: string
  category: string
  categorySlug: string
  price: number
  originalPrice?: number
  discountPercent?: number
  images: ProductImage[]
  rating: number
  reviewCount: number
  inStock: boolean
  isNew?: boolean
  colors?: ColorVariant[]
  storages?: StorageVariant[]
  variants?: ProductVariantResponse[]
  defaultVariantId?: string
  specs: ProductSpec[]
  description: string
  features: string[]
  tags: string[]
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string
  productCount: number
}

export interface Review {
  id: string
  author: string
  rating: number
  date: string
  title: string
  body: string
  verified: boolean
  helpful: number
}

export interface Brand {
  id: string
  name: string
  slug: string
}

export const categories: Category[] = [
  { id: '1', name: 'Smartphones', slug: 'smartphones', icon: '📱', productCount: 48 },
  { id: '2', name: 'Laptops', slug: 'laptops', icon: '💻', productCount: 35 },
  { id: '3', name: 'Tablets', slug: 'tablets', icon: '⬜', productCount: 22 },
  { id: '4', name: 'Smartwatches', slug: 'smartwatches', icon: '⌚', productCount: 18 },
  { id: '5', name: 'Headphones', slug: 'headphones', icon: '🎧', productCount: 30 },
  { id: '6', name: 'Accessories', slug: 'accessories', icon: '🔌', productCount: 64 },
]

export const brands: Brand[] = [
  { id: '1', name: 'Apple', slug: 'apple' },
  { id: '2', name: 'Samsung', slug: 'samsung' },
  { id: '3', name: 'Sony', slug: 'sony' },
  { id: '4', name: 'Bose', slug: 'bose' },
  { id: '5', name: 'DJI', slug: 'dji' },
  { id: '6', name: 'Beats', slug: 'beats' },
  { id: '7', name: 'JBL', slug: 'jbl' },
  { id: '8', name: 'Logitech', slug: 'logitech' },
]

export const products: Product[] = [
  {
    id: '1',
    slug: 'iphone-16-pro',
    name: 'iPhone 16 Pro',
    brand: 'Apple',
    category: 'Smartphones',
    categorySlug: 'smartphones',
    price: 999,
    images: [
      { url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80', alt: 'iPhone 16 Pro' },
      { url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80', alt: 'iPhone 16 Pro back' },
      { url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80', alt: 'iPhone 16 Pro side' },
    ],
    rating: 4.8,
    reviewCount: 2413,
    inStock: true,
    isNew: true,
    colors: [
      { id: 'black', name: 'Black Titanium', hex: '#3a3a3c' },
      { id: 'white', name: 'White Titanium', hex: '#e8e8ed' },
      { id: 'natural', name: 'Natural Titanium', hex: '#c9b99a' },
      { id: 'desert', name: 'Desert Titanium', hex: '#d4b896' },
    ],
    storages: [
      { id: '128', label: '128GB', priceDelta: 0 },
      { id: '256', label: '256GB', priceDelta: 100 },
      { id: '512', label: '512GB', priceDelta: 300 },
      { id: '1tb', label: '1TB', priceDelta: 500 },
    ],
    specs: [
      { key: 'Display', value: '6.3-inch Super Retina XDR OLED' },
      { key: 'Chip', value: 'A18 Pro' },
      { key: 'Camera', value: '48MP Main + 48MP Ultra Wide + 12MP Telephoto' },
      { key: 'Battery', value: 'Up to 33 hours video playback' },
      { key: 'Storage', value: '128GB / 256GB / 512GB / 1TB' },
      { key: 'OS', value: 'iOS 18' },
      { key: 'Dimensions', value: '71.5 × 156.9 × 8.25 mm' },
      { key: 'Weight', value: '227g' },
      { key: 'Connectivity', value: '5G, Wi-Fi 7, Bluetooth 5.3' },
      { key: 'Face ID', value: 'Yes' },
    ],
    description:
      'iPhone 16 Pro. Hello, Apple Intelligence. Forged in titanium, iPhone 16 Pro features the A18 Pro chip for groundbreaking machine learning capabilities.',
    features: ['Apple Intelligence', 'Camera Control button', 'ProMotion display up to 120Hz', 'USB 3 speeds up to 20Gb/s'],
    tags: ['iphone', 'smartphone', '5g', 'apple', 'pro'],
  },
  {
    id: '2',
    slug: 'macbook-air-m3',
    name: 'MacBook Air 13" M3',
    brand: 'Apple',
    category: 'Laptops',
    categorySlug: 'laptops',
    price: 1099,
    images: [
      { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80', alt: 'MacBook Air M3' },
      { url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80', alt: 'MacBook Air open' },
    ],
    rating: 4.9,
    reviewCount: 1842,
    inStock: true,
    colors: [
      { id: 'midnight', name: 'Midnight', hex: '#2c2c3e' },
      { id: 'starlight', name: 'Starlight', hex: '#f0e8da' },
      { id: 'silver', name: 'Silver', hex: '#d8d8d8' },
      { id: 'sky-blue', name: 'Sky Blue', hex: '#9ec5e8' },
    ],
    storages: [
      { id: '8-256', label: '8GB / 256GB', priceDelta: 0 },
      { id: '8-512', label: '8GB / 512GB', priceDelta: 200 },
      { id: '16-512', label: '16GB / 512GB', priceDelta: 400 },
      { id: '24-2tb', label: '24GB / 2TB', priceDelta: 900 },
    ],
    specs: [
      { key: 'Chip', value: 'Apple M3' },
      { key: 'Display', value: '13.6-inch Liquid Retina' },
      { key: 'Memory', value: '8GB unified memory' },
      { key: 'Storage', value: '256GB SSD' },
      { key: 'Battery', value: 'Up to 18 hours' },
      { key: 'Weight', value: '1.24 kg' },
      { key: 'Ports', value: '2x Thunderbolt 4 / USB 4, MagSafe 3, headphone jack' },
      { key: 'OS', value: 'macOS Sequoia' },
      { key: 'Keyboard', value: 'Magic Keyboard with Touch ID' },
      { key: 'Wi-Fi', value: 'Wi-Fi 6E' },
    ],
    description:
      "Supercharged by M3. MacBook Air is the world's most popular laptop — redesigned around the groundbreaking M3 chip.",
    features: ['M3 chip', '18-hour battery', 'Fanless silent design', 'Liquid Retina display', 'MagSafe charging'],
    tags: ['macbook', 'laptop', 'apple', 'm3', 'mac'],
  },
  {
    id: '3',
    slug: 'airpods-pro-2',
    name: 'AirPods Pro (2nd generation)',
    brand: 'Apple',
    category: 'Headphones',
    categorySlug: 'headphones',
    price: 249,
    images: [
      { url: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800&q=80', alt: 'AirPods Pro 2' },
      { url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80', alt: 'AirPods Pro case' },
    ],
    rating: 4.9,
    reviewCount: 5621,
    inStock: true,
    specs: [
      { key: 'Chip', value: 'Apple H2' },
      { key: 'ANC', value: 'Active Noise Cancellation' },
      { key: 'Transparency', value: 'Adaptive Transparency' },
      { key: 'Battery', value: '30 hours total (6 hours per charge)' },
      { key: 'Water resistance', value: 'IPX4' },
      { key: 'Connector', value: 'USB-C (Lightning case available)' },
      { key: 'Spatial Audio', value: 'Personalized Spatial Audio' },
      { key: 'Voice control', value: 'Hey Siri' },
    ],
    description:
      'AirPods Pro deliver up to 2x more Active Noise Cancellation than the previous generation.',
    features: ['H2 chip', 'Adaptive Transparency', 'Touch control stem', 'Personalized Spatial Audio'],
    tags: ['airpods', 'earbuds', 'wireless', 'apple', 'anc'],
  },
  {
    id: '4',
    slug: 'ipad-air-m2',
    name: 'iPad Air 13" M2',
    brand: 'Apple',
    category: 'Tablets',
    categorySlug: 'tablets',
    price: 799,
    images: [
      { url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80', alt: 'iPad Air M2' },
      { url: 'https://images.unsplash.com/photo-1623126908029-58cb08a2b272?w=800&q=80', alt: 'iPad Air side' },
    ],
    rating: 4.7,
    reviewCount: 934,
    inStock: true,
    colors: [
      { id: 'blue', name: 'Blue', hex: '#7ab7e0' },
      { id: 'purple', name: 'Purple', hex: '#b09ec4' },
      { id: 'starlight', name: 'Starlight', hex: '#f0e8da' },
      { id: 'space-gray', name: 'Space Gray', hex: '#8a8a8a' },
    ],
    storages: [
      { id: '128', label: '128GB', priceDelta: 0 },
      { id: '256', label: '256GB', priceDelta: 100 },
      { id: '512', label: '512GB', priceDelta: 300 },
      { id: '1tb', label: '1TB', priceDelta: 500 },
    ],
    specs: [
      { key: 'Chip', value: 'Apple M2' },
      { key: 'Display', value: '13-inch Liquid Retina' },
      { key: 'Storage', value: '128GB to 1TB' },
      { key: 'Battery', value: 'Up to 10 hours' },
      { key: 'Rear Camera', value: '12MP Wide' },
      { key: 'Front Camera', value: '12MP landscape Ultra Wide' },
      { key: 'Connectivity', value: '5G (optional), Wi-Fi 6E' },
      { key: 'OS', value: 'iPadOS 18' },
    ],
    description:
      'iPad Air with M2. Supremely capable. Incredibly thin. Available in 11-inch and 13-inch sizes.',
    features: ['M2 chip', 'Thin and light design', 'Apple Pencil Pro support', 'Magic Keyboard compatible'],
    tags: ['ipad', 'tablet', 'apple', 'm2'],
  },
  {
    id: '5',
    slug: 'apple-watch-series-10',
    name: 'Apple Watch Series 10',
    brand: 'Apple',
    category: 'Smartwatches',
    categorySlug: 'smartwatches',
    price: 399,
    images: [
      { url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80', alt: 'Apple Watch Series 10' },
      { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', alt: 'Apple Watch closeup' },
    ],
    rating: 4.6,
    reviewCount: 1290,
    inStock: true,
    isNew: true,
    colors: [
      { id: 'jet-black', name: 'Jet Black', hex: '#1c1c1e' },
      { id: 'rose-gold', name: 'Rose Gold', hex: '#e8bcb0' },
      { id: 'silver', name: 'Silver', hex: '#d8d8d8' },
      { id: 'gold', name: 'Gold', hex: '#d4a55a' },
    ],
    specs: [
      { key: 'Case size', value: '42mm / 46mm' },
      { key: 'Display', value: 'Always-On Retina LTPO OLED' },
      { key: 'Chip', value: 'S10 SiP' },
      { key: 'Battery', value: 'Up to 36 hours' },
      { key: 'Health sensors', value: 'ECG, Blood Oxygen, Temperature' },
      { key: 'Water resistance', value: '50m swim-proof' },
      { key: 'GPS', value: 'Built-in precision dual-frequency' },
      { key: 'OS', value: 'watchOS 11' },
    ],
    description:
      'Apple Watch Series 10. Our thinnest Apple Watch ever, packed with the most advanced health features.',
    features: ['Sleep apnea detection', 'ECG', 'Blood Oxygen', 'Crash Detection', 'Depth gauge'],
    tags: ['apple-watch', 'smartwatch', 'health', 'apple', 'fitness'],
  },
  {
    id: '6',
    slug: 'iphone-16',
    name: 'iPhone 16',
    brand: 'Apple',
    category: 'Smartphones',
    categorySlug: 'smartphones',
    price: 799,
    images: [
      { url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80', alt: 'iPhone 16' },
      { url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80', alt: 'iPhone 16 back' },
    ],
    rating: 4.7,
    reviewCount: 3201,
    inStock: true,
    isNew: true,
    colors: [
      { id: 'black', name: 'Black', hex: '#1d1d1f' },
      { id: 'white', name: 'White', hex: '#f5f5f7' },
      { id: 'pink', name: 'Pink', hex: '#f4b8c0' },
      { id: 'teal', name: 'Teal', hex: '#5c9ea0' },
      { id: 'ultramarine', name: 'Ultramarine', hex: '#4a5ba0' },
    ],
    storages: [
      { id: '128', label: '128GB', priceDelta: 0 },
      { id: '256', label: '256GB', priceDelta: 100 },
      { id: '512', label: '512GB', priceDelta: 300 },
    ],
    specs: [
      { key: 'Display', value: '6.1-inch Super Retina XDR OLED' },
      { key: 'Chip', value: 'A18' },
      { key: 'Camera', value: '48MP Main + 12MP Ultra Wide' },
      { key: 'Battery', value: 'Up to 22 hours video playback' },
      { key: 'Storage', value: '128GB / 256GB / 512GB' },
      { key: 'OS', value: 'iOS 18' },
      { key: 'Dimensions', value: '71.6 × 147.6 × 7.80 mm' },
      { key: 'Weight', value: '170g' },
      { key: 'Connectivity', value: '5G, Wi-Fi 7, Bluetooth 5.3' },
      { key: 'Face ID', value: 'Yes' },
    ],
    description:
      'iPhone 16. A new way to interact with iPhone. With the powerful A18 chip for Apple Intelligence.',
    features: ['Apple Intelligence', 'Camera Control', 'Action button', 'USB-C'],
    tags: ['iphone', 'smartphone', '5g', 'apple'],
  },
  {
    id: '7',
    slug: 'macbook-pro-14-m4',
    name: 'MacBook Pro 14" M4 Pro',
    brand: 'Apple',
    category: 'Laptops',
    categorySlug: 'laptops',
    price: 1999,
    originalPrice: 2199,
    discountPercent: 9,
    images: [
      { url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&q=80', alt: 'MacBook Pro M4' },
      { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80', alt: 'MacBook Pro keyboard' },
    ],
    rating: 4.9,
    reviewCount: 892,
    inStock: true,
    colors: [
      { id: 'space-black', name: 'Space Black', hex: '#1c1c1e' },
      { id: 'silver', name: 'Silver', hex: '#d8d8d8' },
    ],
    storages: [
      { id: '24-512', label: '24GB / 512GB', priceDelta: 0 },
      { id: '24-1tb', label: '24GB / 1TB', priceDelta: 200 },
      { id: '48-1tb', label: '48GB / 1TB', priceDelta: 600 },
      { id: '48-2tb', label: '48GB / 2TB', priceDelta: 1000 },
    ],
    specs: [
      { key: 'Chip', value: 'Apple M4 Pro (14-core CPU)' },
      { key: 'Display', value: '14.2-inch Liquid Retina XDR' },
      { key: 'Memory', value: '24GB unified memory' },
      { key: 'Storage', value: '512GB SSD' },
      { key: 'Battery', value: 'Up to 24 hours' },
      { key: 'Weight', value: '1.62 kg' },
      { key: 'Ports', value: '3x Thunderbolt 5, HDMI, SD card, MagSafe 3' },
      { key: 'Display refresh', value: 'ProMotion up to 120Hz' },
    ],
    description:
      'MacBook Pro with M4 Pro. More performance. Better display. Longer battery life.',
    features: ['M4 Pro chip', 'Liquid Retina XDR display', 'Thunderbolt 5', '24-hour battery'],
    tags: ['macbook', 'laptop', 'apple', 'm4', 'pro'],
  },
  {
    id: '8',
    slug: 'airpods-max',
    name: 'AirPods Max',
    brand: 'Apple',
    category: 'Headphones',
    categorySlug: 'headphones',
    price: 549,
    originalPrice: 599,
    discountPercent: 8,
    images: [
      { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', alt: 'AirPods Max' },
      { url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80', alt: 'AirPods Max side' },
    ],
    rating: 4.5,
    reviewCount: 2104,
    inStock: true,
    colors: [
      { id: 'midnight', name: 'Midnight', hex: '#2c2c3e' },
      { id: 'starlight', name: 'Starlight', hex: '#f0e8da' },
      { id: 'pink', name: 'Pink', hex: '#f4b8c0' },
      { id: 'blue', name: 'Blue', hex: '#7ab7e0' },
      { id: 'orange', name: 'Orange', hex: '#e8834a' },
    ],
    specs: [
      { key: 'Chip', value: 'Apple H1' },
      { key: 'ANC', value: 'Active Noise Cancellation' },
      { key: 'Battery', value: 'Up to 20 hours with ANC' },
      { key: 'Connector', value: 'USB-C' },
      { key: 'Spatial Audio', value: 'Dynamic head tracking' },
      { key: 'Weight', value: '385g' },
      { key: 'Material', value: 'Stainless steel headband' },
    ],
    description:
      'AirPods Max. A perfect balance of exhilarating high-fidelity audio and the effortless magic of AirPods.',
    features: ['Computational audio', 'Custom-built drivers', 'Digital Crown', 'Memory foam ear cushions'],
    tags: ['airpods', 'headphones', 'wireless', 'apple', 'anc'],
  },
  {
    id: '9',
    slug: 'samsung-galaxy-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra',
    brand: 'Samsung',
    category: 'Smartphones',
    categorySlug: 'smartphones',
    price: 1299,
    images: [
      { url: 'https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=800&q=80', alt: 'Galaxy S24 Ultra' },
      { url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80', alt: 'Galaxy S24 Ultra back' },
    ],
    rating: 4.7,
    reviewCount: 1876,
    inStock: true,
    colors: [
      { id: 'titanium-black', name: 'Titanium Black', hex: '#2c2c2e' },
      { id: 'titanium-gray', name: 'Titanium Gray', hex: '#808080' },
      { id: 'titanium-violet', name: 'Titanium Violet', hex: '#7b68aa' },
      { id: 'titanium-yellow', name: 'Titanium Yellow', hex: '#d4af37' },
    ],
    storages: [
      { id: '256', label: '256GB', priceDelta: 0 },
      { id: '512', label: '512GB', priceDelta: 120 },
      { id: '1tb', label: '1TB', priceDelta: 240 },
    ],
    specs: [
      { key: 'Display', value: '6.8-inch QHD+ Dynamic AMOLED 2X' },
      { key: 'Chip', value: 'Snapdragon 8 Gen 3' },
      { key: 'Camera', value: '200MP Main + 12MP Ultra Wide + 10MP + 50MP Telephoto' },
      { key: 'Battery', value: '5000 mAh' },
      { key: 'RAM', value: '12GB' },
      { key: 'OS', value: 'Android 14 / One UI 6.1' },
      { key: 'S Pen', value: 'Built-in' },
      { key: 'Connectivity', value: '5G, Wi-Fi 7, Bluetooth 5.3' },
    ],
    description:
      'Galaxy S24 Ultra. AI-powered. Titanium design with built-in S Pen and 200MP camera.',
    features: ['Galaxy AI', 'Built-in S Pen', '200MP camera', 'Titanium frame', '7 years OS updates'],
    tags: ['samsung', 'smartphone', '5g', 'android'],
  },
  {
    id: '10',
    slug: 'sony-wh-1000xm5',
    name: 'Sony WH-1000XM5',
    brand: 'Sony',
    category: 'Headphones',
    categorySlug: 'headphones',
    price: 279,
    originalPrice: 349,
    discountPercent: 20,
    images: [
      { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', alt: 'Sony WH-1000XM5' },
    ],
    rating: 4.8,
    reviewCount: 4320,
    inStock: true,
    colors: [
      { id: 'black', name: 'Black', hex: '#1c1c1e' },
      { id: 'platinum-silver', name: 'Platinum Silver', hex: '#d8d8d8' },
    ],
    specs: [
      { key: 'Driver', value: '30mm dynamic driver' },
      { key: 'ANC', value: 'Industry-leading ANC' },
      { key: 'Battery', value: '30 hours (ANC on), 40 hours (ANC off)' },
      { key: 'Quick charge', value: '3 min = 3 hours' },
      { key: 'Codec', value: 'LDAC, AAC, SBC' },
      { key: 'Weight', value: '250g' },
      { key: 'Microphones', value: '8 mics for ANC + 2 for calls' },
    ],
    description:
      'Sony WH-1000XM5. Industry-leading noise canceling with exceptional sound quality.',
    features: ['Industry-leading ANC', 'Speak-to-Chat', 'Multipoint connection', 'Quick charge'],
    tags: ['sony', 'headphones', 'wireless', 'anc'],
  },
  {
    id: '11',
    slug: 'ipad-pro-m4',
    name: 'iPad Pro 13" M4',
    brand: 'Apple',
    category: 'Tablets',
    categorySlug: 'tablets',
    price: 1299,
    images: [
      { url: 'https://images.unsplash.com/photo-1623126908029-58cb08a2b272?w=800&q=80', alt: 'iPad Pro M4' },
      { url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80', alt: 'iPad Pro M4 back' },
    ],
    rating: 4.8,
    reviewCount: 723,
    inStock: true,
    isNew: true,
    colors: [
      { id: 'silver', name: 'Silver', hex: '#d8d8d8' },
      { id: 'space-black', name: 'Space Black', hex: '#1c1c1e' },
    ],
    storages: [
      { id: '256', label: '256GB', priceDelta: 0 },
      { id: '512', label: '512GB', priceDelta: 200 },
      { id: '1tb', label: '1TB', priceDelta: 400 },
      { id: '2tb', label: '2TB', priceDelta: 800 },
    ],
    specs: [
      { key: 'Chip', value: 'Apple M4' },
      { key: 'Display', value: '13-inch Ultra Retina XDR OLED' },
      { key: 'Storage', value: '256GB to 2TB' },
      { key: 'Battery', value: 'Up to 10 hours' },
      { key: 'Thickness', value: '5.1mm (thinnest Apple product)' },
      { key: 'Front Camera', value: '12MP landscape TrueDepth' },
      { key: 'Connectivity', value: '5G + Wi-Fi 6E' },
      { key: 'OS', value: 'iPadOS 18' },
    ],
    description:
      'iPad Pro with M4. Outrageously thin. Incredibly powerful. The thinnest Apple product ever.',
    features: ['M4 chip', 'Ultra Retina XDR OLED', 'Apple Pencil Pro', 'Nano-texture glass option'],
    tags: ['ipad', 'tablet', 'apple', 'm4', 'pro'],
  },
  {
    id: '12',
    slug: 'apple-tv-4k',
    name: 'Apple TV 4K (3rd gen)',
    brand: 'Apple',
    category: 'Accessories',
    categorySlug: 'accessories',
    price: 129,
    images: [
      { url: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&q=80', alt: 'Apple TV 4K' },
    ],
    rating: 4.6,
    reviewCount: 1540,
    inStock: true,
    storages: [
      { id: 'wifi', label: 'Wi-Fi', priceDelta: 0 },
      { id: 'wifi-eth', label: 'Wi-Fi + Ethernet', priceDelta: 20 },
    ],
    specs: [
      { key: 'Chip', value: 'A15 Bionic' },
      { key: 'Video', value: '4K HDR, Dolby Vision, HDR10+' },
      { key: 'Audio', value: 'Dolby Atmos' },
      { key: 'Storage', value: '64GB' },
      { key: 'Connectivity', value: 'Wi-Fi 6, Bluetooth 5.0' },
      { key: 'Thread', value: 'Thread home automation' },
      { key: 'Remote', value: 'Siri Remote with Touch surface' },
    ],
    description:
      'Apple TV 4K. For all the ways you watch — and play. With the A15 Bionic chip.',
    features: ['A15 Bionic chip', '4K HDR streaming', 'Siri Remote', 'HomeKit hub', 'Apple Fitness+'],
    tags: ['apple', 'streaming', 'tv', '4k'],
  },
]

export const reviews: Review[] = [
  {
    id: '1',
    author: 'John D.',
    rating: 5,
    date: 'Mar 15, 2025',
    title: 'Best iPhone ever',
    body: 'Incredibly fast, the camera is outstanding. The titanium build feels premium. Apple Intelligence features are genuinely useful — AI-powered writing suggestions have saved me hours.',
    verified: true,
    helpful: 142,
  },
  {
    id: '2',
    author: 'Sarah M.',
    rating: 5,
    date: 'Feb 28, 2025',
    title: 'Worth every penny',
    body: 'Upgraded from iPhone 13 Pro and the difference is night and day. ProMotion display is silky smooth, the A18 Pro chip handles everything I throw at it without breaking a sweat.',
    verified: true,
    helpful: 98,
  },
  {
    id: '3',
    author: 'Mike T.',
    rating: 4,
    date: 'Feb 10, 2025',
    title: 'Great but pricey',
    body: 'The camera system is absolutely incredible. Takes pro-level photos effortlessly. Camera Control button took some getting used to but now I use it all the time. Battery life is solid for my heavy use.',
    verified: true,
    helpful: 67,
  },
  {
    id: '4',
    author: 'Emma L.',
    rating: 5,
    date: 'Jan 22, 2025',
    title: 'Switching from Android was worth it',
    body: "First iPhone ever and I'm blown away. Setup was seamless, Face ID is instant, and the integration with my MacBook is something Android never had. Very happy with this purchase.",
    verified: false,
    helpful: 54,
  },
  {
    id: '5',
    author: 'David K.',
    rating: 4,
    date: 'Jan 8, 2025',
    title: 'Solid upgrade',
    body: 'ProRes video recording is a game changer for my work. USB 3 transfer speeds are finally here and make downloading footage so much faster. The desert titanium color is gorgeous in person.',
    verified: true,
    helpful: 41,
  },
]

export function getProductBySlug(slug: string): Product | undefined {
  return products.find(p => p.slug === slug)
}

export function getProductsByCategory(slug: string): Product[] {
  return products.filter(p => p.categorySlug === slug)
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return products
    .filter(p => p.id !== product.id && (p.categorySlug === product.categorySlug || p.brand === product.brand))
    .slice(0, limit)
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase()
  return products.filter(
    p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some(t => t.includes(q)),
  )
}
