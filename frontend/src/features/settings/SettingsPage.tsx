import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Loader2, Save, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { uploadApi } from '@/apis/product.api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { settingApi } from './api/setting.api'
import type { Setting } from './types/setting.types'

export default function SettingsPage() {
  const queryClient = useQueryClient()

  const [bankId, setBankId] = useState('')
  const [accountNo, setAccountNo] = useState('')
  const [accountName, setAccountName] = useState('')
  const [transferPrefix, setTransferPrefix] = useState('PCN')
  const [storeName, setStoreName] = useState('CHAO NGON')
  const [qrImageUrl, setQrImageUrl] = useState('')

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingApi.getAllSettings,
  })

  useEffect(() => {
    if (settingsData?.data) {
      const settings = settingsData.data
      setBankId(settings.find((s: Setting) => s.key === 'bankId')?.value || '')
      setAccountNo(settings.find((s: Setting) => s.key === 'accountNo')?.value || '')
      setAccountName(settings.find((s: Setting) => s.key === 'accountName')?.value || '')
      setTransferPrefix(settings.find((s: Setting) => s.key === 'transferPrefix')?.value || 'PCN')
      setStoreName(settings.find((s: Setting) => s.key === 'storeName')?.value || 'CHAO NGON')
      setQrImageUrl(settings.find((s: Setting) => s.key === 'qrImageUrl')?.value || '')
    }
  }, [settingsData])

  const mutation = useMutation({
    mutationFn: settingApi.saveSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Lưu cấu hình thành công')
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error?.response?.data?.message || 'Lưu cấu hình thất bại')
    },
  })

  const uploadQrMutation = useMutation({
    mutationFn: uploadApi.uploadImage,
    onSuccess: (url) => {
      setQrImageUrl(url)
      toast.success('Đã tải ảnh QR lên, bấm Lưu cấu hình để áp dụng')
    },
    onError: () => toast.error('Không thể tải ảnh QR'),
  })

  const handleSave = () => {
    const normalizedBankId = bankId.trim().toUpperCase()
    const normalizedAccountNo = accountNo.replace(/\s/g, '')
    const normalizedAccountName = accountName.trim().toUpperCase()
    const normalizedPrefix = transferPrefix.replace(/[^A-Za-z0-9]/g, '').toUpperCase()

    if (!normalizedBankId) {
      toast.error('Vui lòng nhập mã ngân hàng')
      return
    }
    if (!/^[A-Za-z0-9]{3,19}$/.test(normalizedAccountNo)) {
      toast.error('Số tài khoản chỉ gồm chữ/số và dài từ 3 đến 19 ký tự')
      return
    }
    if (!normalizedAccountName || /[^\x00-\x7F]/.test(normalizedAccountName)) {
      toast.error('Tên chủ tài khoản cần viết hoa, không dấu')
      return
    }
    if (!normalizedPrefix || normalizedPrefix.length > 10) {
      toast.error('Tiền tố chuyển khoản phải gồm 1-10 chữ hoặc số')
      return
    }

    const newSettings: Setting[] = [
      { key: 'bankId', value: normalizedBankId },
      { key: 'accountNo', value: normalizedAccountNo },
      { key: 'accountName', value: normalizedAccountName },
      { key: 'transferPrefix', value: normalizedPrefix },
      { key: 'storeName', value: storeName.trim().toUpperCase() || 'CHAO NGON' },
      { key: 'qrImageUrl', value: qrImageUrl.trim() },
    ]
    mutation.mutate(newSettings)
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-1.5rem)] rounded-2xl bg-[#d2f2e7] p-1.5 text-[#022c22] sm:p-4">
      <div className="mx-auto max-w-2xl space-y-1.5 rounded-xl border border-[#e5e7eb] bg-white p-1.5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] sm:py-8">
        <div>
          <h1 className="flex items-center gap-1 text-xs font-black leading-none tracking-[-0.04em] text-[#022c22] sm:text-3xl">
            <Settings className="h-4 w-4 sm:h-7 sm:w-7 text-[#007a55]" />
            Cài đặt hệ thống
          </h1>
        </div>
        <Card className="border-[#e5e7eb] bg-white shadow-sm rounded-lg">
          <CardHeader className="p-2 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-lg font-black tracking-[-0.03em] text-[#022c22]">Cấu hình thanh toán chuyển khoản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 p-2 pt-0 sm:p-4 sm:pt-0">
            <div className="grid grid-cols-3 gap-1.5">
              <div className="space-y-0.5">
                <Label htmlFor="bankId" className="text-[8px] sm:text-xs">Mã ngân hàng</Label>
                <Input
                  id="bankId"
                  placeholder="VD: MB, VCB..."
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value.toUpperCase())}
                  className="h-7 text-xs px-2 sm:h-9 sm:px-3 sm:text-sm"
                />
              </div>

              <div className="space-y-0.5">
                <Label htmlFor="accountNo" className="text-[8px] sm:text-xs">Số tài khoản</Label>
                <Input
                  id="accountNo"
                  placeholder="VD: 0123456789"
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value.replace(/\s/g, ''))}
                  className="h-7 text-xs px-2 sm:h-9 sm:px-3 sm:text-sm"
                  maxLength={19}
                />
              </div>

              <div className="space-y-0.5">
                <Label htmlFor="accountName" className="text-[8px] sm:text-xs">Tên chủ tài khoản</Label>
                <Input
                  id="accountName"
                  placeholder="VD: NGUYEN VAN A"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="uppercase h-7 text-xs px-2 sm:h-9 sm:px-3 sm:text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5 rounded-lg border p-1.5">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Label htmlFor="qrImage" className="text-[8px] sm:text-xs">QR chuyển khoản</Label>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-6 text-[9px] px-2 rounded sm:h-9 sm:text-sm sm:px-4"
                  disabled={uploadQrMutation.isPending}
                  onClick={() => document.getElementById('qrImage')?.click()}
                >
                  {uploadQrMutation.isPending ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ImagePlus className="mr-1 h-3.5 w-3.5" />
                  )}
                  Tải ảnh QR
                </Button>
              </div>
              <input
                id="qrImage"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) uploadQrMutation.mutate(file)
                  event.target.value = ''
                }}
              />
              {qrImageUrl && (
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                  <img
                    src={qrImageUrl}
                    alt="QR chuyển khoản"
                    className="h-20 w-20 rounded-md border bg-white object-contain p-1"
                  />
                  <div className="min-w-0 flex-1">
                    <Button
                      type="button"
                      variant="ghost"
                      className="px-0 h-5 text-[9px] text-destructive sm:h-8 sm:text-sm"
                      onClick={() => setQrImageUrl('')}
                    >
                      Xóa ảnh QR
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1.5">
              <Button
                className="h-6 text-[9px] px-3.5 rounded bg-[#00bc7d] text-white hover:bg-[#007a55] sm:h-9 sm:text-sm sm:px-5 sm:rounded-full"
                onClick={handleSave}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1 h-3.5 w-3.5" />}
                Lưu cấu hình
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
