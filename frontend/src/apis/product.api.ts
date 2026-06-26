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

type ApiMaybeWrapped<T> = T | { data: T }

function unwrapData<T>(payload: ApiMaybeWrapped<T>): T {
  if (
    payload
    && typeof payload === 'object'
    && 'data' in payload
  ) {
    return (payload as { data: T }).data
  }

  return payload as T
}

export const categoryApi = {
  getAll: () => axiosInstance.get<ApiMaybeWrapped<ProductCategory[]>>('/categories').then(res => unwrapData(res.data)),
  create: (data: CategoryRequest) => axiosInstance.post<ApiMaybeWrapped<ProductCategory>>('/categories', data).then(res => unwrapData(res.data)),
  update: (id: number, data: CategoryRequest) => axiosInstance.put<ApiMaybeWrapped<ProductCategory>>(`/categories/${id}`, data).then(res => unwrapData(res.data)),
  delete: (id: number) => axiosInstance.delete(`/categories/${id}`).then(res => res.data),
}

export const sizeApi = {
  getAll: () => axiosInstance.get<ApiMaybeWrapped<Size[]>>('/sizes').then(res => unwrapData(res.data)),
  create: (data: SizeRequest) => axiosInstance.post<ApiMaybeWrapped<Size>>('/sizes', data).then(res => unwrapData(res.data)),
  update: (id: number, data: SizeRequest) => axiosInstance.put<ApiMaybeWrapped<Size>>(`/sizes/${id}`, data).then(res => unwrapData(res.data)),
  delete: (id: number) => axiosInstance.delete(`/sizes/${id}`).then(res => res.data),
}

export const optionApi = {
  getAll: () => axiosInstance.get<ApiMaybeWrapped<ProductOption[]>>('/options').then(res => unwrapData(res.data)),
  getPosOptions: () =>
    axiosInstance
      .get<ApiMaybeWrapped<ProductOption[]>>('/options/pos')
      .then(res => unwrapData(res.data)),
  create: (data: OptionRequest) => axiosInstance.post<ApiMaybeWrapped<ProductOption>>('/options', data).then(res => unwrapData(res.data)),
  update: (id: number, data: OptionRequest) => axiosInstance.put<ApiMaybeWrapped<ProductOption>>(`/options/${id}`, data).then(res => unwrapData(res.data)),
  delete: (id: number) => axiosInstance.delete(`/options/${id}`).then(res => res.data),
}

export const productApi = {
  getAll: () => axiosInstance.get<ApiMaybeWrapped<Product[]>>('/products').then(res => unwrapData(res.data)),
  create: (data: ProductRequest) => axiosInstance.post<ApiMaybeWrapped<Product>>('/products', data).then(res => unwrapData(res.data)),
  update: (id: number, data: ProductRequest) => axiosInstance.put<ApiMaybeWrapped<Product>>(`/products/${id}`, data).then(res => unwrapData(res.data)),
  delete: (id: number) => axiosInstance.delete(`/products/${id}`).then(res => res.data),
  getPosData: () => axiosInstance.get<ApiMaybeWrapped<PosCategory[]>>('/products/pos').then(res => unwrapData(res.data)),
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
