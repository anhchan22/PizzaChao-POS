import {
  FileText,
  History,
  HomeIcon,
  Boxes,
  PackageIcon,
  ReceiptText,
  Settings,
  ShoppingCart,
  type LucideIcon,
  Users,
} from 'lucide-react'
import type { UserRole } from '@/types'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  roles: UserRole[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const navigation: NavGroup[] = [
  {
    label: 'Bán hàng',
    items: [
      { title: 'POS', href: '/pos', icon: ShoppingCart, roles: ['OWNER', 'STAFF'] },
      { title: 'Đơn hàng', href: '/admin/orders', icon: FileText, roles: ['OWNER', 'STAFF'] },
    ],
  },
  {
    label: 'Tổng quan',
    items: [
      { title: 'Tổng quan', href: '/dashboard', icon: HomeIcon, roles: ['OWNER', 'STAFF'] },
    ],
  },
  {
    label: 'Thực đơn',
    items: [
      { title: 'Danh mục', href: '/admin/categories', icon: PackageIcon, roles: ['OWNER'] },
      { title: 'Kích cỡ', href: '/admin/sizes', icon: PackageIcon, roles: ['OWNER'] },
      { title: 'Topping', href: '/admin/options', icon: PackageIcon, roles: ['OWNER'] },
      { title: 'Món ăn', href: '/admin/products', icon: PackageIcon, roles: ['OWNER'] },
    ],
  },
  {
    label: 'Quản lý',
    items: [
      { title: 'Nhân viên', href: '/admin/users', icon: Users, roles: ['OWNER'] },
      { title: 'Chi phí', href: '/admin/expenses', icon: ReceiptText, roles: ['OWNER', 'STAFF'] },
      { title: 'Kho vật tư', href: '/admin/inventory', icon: Boxes, roles: ['OWNER', 'STAFF'] },
      { title: 'Lịch sử ca', href: '/admin/shifts', icon: History, roles: ['OWNER'] },
      { title: 'Cài đặt', href: '/admin/settings', icon: Settings, roles: ['OWNER'] },
    ],
  },
]
