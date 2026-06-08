import { Smartphone, Laptop, Tablet, Watch, Headphones, Package } from 'lucide-react'
import type { LucideProps } from 'lucide-react'

export const CATEGORY_ICONS: Record<string, React.ComponentType<LucideProps>> = {
  smartphones: Smartphone,
  laptops: Laptop,
  tablets: Tablet,
  smartwatches: Watch,
  headphones: Headphones,
  accessories: Package,
}
