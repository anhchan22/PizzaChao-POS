import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { uploadApi } from '@/apis/product.api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cài đặt hệ thống</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Cấu hình thanh toán chuyển khoản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankId">Mã ngân hàng</Label>
              <Input
                id="bankId"
                placeholder="VD: MB, VCB, 970422..."
                value={bankId}
                onChange={(e) => setBankId(e.target.value.toUpperCase())}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNo">Số tài khoản</Label>
              <Input
                id="accountNo"
                placeholder="VD: 0123456789"
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value.replace(/\s/g, ''))}
                maxLength={19}
              />
            </div>

            <div>
            <div className="space-y-2">
            <Label htmlFor="accountName">Tên chủ tài khoản</Label>
            <Input
              id="accountName"
              placeholder="VD: NGUYEN VAN A"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="uppercase"
            />              
            </div>

          </div>
          </div>



          <div className="space-y-3 rounded-xl border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Label htmlFor="qrImage">QR chuyển khoản</Label>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={uploadQrMutation.isPending}
                onClick={() => document.getElementById('qrImage')?.click()}
              >
                {uploadQrMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="mr-2 h-4 w-4" />
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
            {(
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <img
                  src={qrImageUrl}
                  alt="QR chuyển khoản"
                  className="h-36 w-36 rounded-lg border bg-white object-contain p-2"
                />
                <div className="min-w-0 flex-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className="px-0 text-destructive"
                    onClick={() => setQrImageUrl('')}
                  >
                    Xóa ảnh QR
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Lưu cấu hình
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
