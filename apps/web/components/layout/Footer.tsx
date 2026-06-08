import Link from 'next/link'

const links: Record<string, { label: string; href: string }[]> = {
  Shop: [
    { label: 'iPhone', href: '/products?category=smartphones&brand=apple' },
    { label: 'Mac', href: '/products?category=laptops&brand=apple' },
    { label: 'iPad', href: '/products?category=tablets&brand=apple' },
    { label: 'Apple Watch', href: '/products?category=smartwatches&brand=apple' },
    { label: 'AirPods', href: '/products?category=headphones&brand=apple' },
    { label: 'Accessories', href: '/products?category=accessories&brand=apple' },
  ],
  Account: [
    { label: 'Sign In', href: '/login' },
    { label: 'Create Account', href: '/register' },
    { label: 'My Orders', href: '/orders' },
    { label: 'Wishlist', href: '/wishlist' },
  ],
  Support: [
    { label: 'Contact Us', href: '/contact' },
    { label: 'Shipping Policy', href: '/shipping' },
    { label: 'Returns & Refunds', href: '/returns' },
    { label: 'FAQ', href: '/faq' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-ap-gray2 bg-ap-gray1 mt-20">
      <div className="container-ap py-16">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="text-2xl font-bold text-ap-black">
              Apple+
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-ap-text2 max-w-xs">
              Your destination for premium Apple products and electronics. Free shipping on orders over $50.
            </p>
          </div>

          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-ap-black mb-4">{title}</h3>
              <ul className="space-y-2.5">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-ap-text2 hover:text-ap-black transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-ap-gray2 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-ap-text3">
            © {new Date().getFullYear()} Apple Plus. All rights reserved.
          </p>
          <div className="flex gap-5">
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
              { label: 'Cookies', href: '/cookies' },
            ].map(({ label, href }) => (
              <Link key={label} href={href} className="text-xs text-ap-text3 hover:text-ap-black transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
