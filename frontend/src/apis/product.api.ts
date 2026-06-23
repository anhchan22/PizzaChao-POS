import axiosInstance from './axios'
import type { 
  ProductCategory, 
  CategoryRequest,
  Size,
  SizeRequest,
  ProductOption,
  OptionRequest,
  Product,
  ProductRequest,
  PosCategory
} from '@/types'

export const categoryApi = {
  getAll: () => axiosInstance.get<ProductCategory[]>('/categories').then(res => res.data),
  create: (data: CategoryRequest) => axiosInstance.post<ProductCategory>('/categories', data).then(res => res.data),
  update: (id: number, data: CategoryRequest) => axiosInstance.put<ProductCategory>(`/categories/${id}`, data).then(res => res.data),
  delete: (id: number) => axiosInstance.delete(`/categories/${id}`).then(res => res.data),
}

export const sizeApi = {
  getAll: () => axiosInstance.get<Size[]>('/sizes').then(res => res.data),
  create: (data: SizeRequest) => axiosInstance.post<Size>('/sizes', data).then(res => res.data),
  update: (id: number, data: SizeRequest) => axiosInstance.put<Size>(`/sizes/${id}`, data).then(res => res.data),
  delete: (id: number) => axiosInstance.delete(`/sizes/${id}`).then(res => res.data),
}

export const optionApi = {
  getAll: () => axiosInstance.get<ProductOption[]>('/options').then(res => res.data),
  create: (data: OptionRequest) => axiosInstance.post<ProductOption>('/options', data).then(res => res.data),
  update: (id: number, data: OptionRequest) => axiosInstance.put<ProductOption>(`/options/${id}`, data).then(res => res.data),
  delete: (id: number) => axiosInstance.delete(`/options/${id}`).then(res => res.data),
}

export const productApi = {
  getAll: () => axiosInstance.get<Product[]>('/products').then(res => res.data),
  create: (data: ProductRequest) => axiosInstance.post<Product>('/products', data).then(res => res.data),
  update: (id: number, data: ProductRequest) => axiosInstance.put<Product>(`/products/${id}`, data).then(res => res.data),
  delete: (id: number) => axiosInstance.delete(`/products/${id}`).then(res => res.data),
  getPosData: () => axiosInstance.get<PosCategory[]>('/products/pos').then(res => res.data),
}

export const uploadApi = {
  uploadImage: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await axiosInstance.post<{url: string}>('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return res.data.url
  }
}
