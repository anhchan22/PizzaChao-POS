import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingApi } from './api/setting.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import type { Setting } from './types/setting.types'

export default function SettingsPage() {
  const queryClient = useQueryClient()

  // Form states
  const [bankId, setBankId] = useState('')
  const [accountNo, setAccountNo] = useState('')
  const [accountName, setAccountName] = useState('')

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingApi.getAllSettings
  })

  useEffect(() => {
    if (settingsData?.data) {
      const settings = settingsData.data
      setBankId(settings.find((s: Setting) => s.key === 'bankId')?.value || '')
      setAccountNo(settings.find((s: Setting) => s.key === 'accountNo')?.value || '')
      setAccountName(settings.find((s: Setting) => s.key === 'accountName')?.value || '')
    }
  }, [settingsData])

  const mutation = useMutation({
    mutationFn: settingApi.saveSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Lưu cấu hình thành công!')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Lưu cấu hình thất bại')
    }
  })

  const handleSave = () => {
    const newSettings: Setting[] = [
      { key: 'bankId', value: bankId, group: 'PAYMENT', description: 'Mã ngân hàng (VietQR)' },
      { key: 'accountNo', value: accountNo, group: 'PAYMENT', description: 'Số tài khoản' },
      { key: 'accountName', value: accountName, group: 'PAYMENT', description: 'Tên chủ tài khoản' }
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
    <div className="space-y-6 max-w-2xl mx-auto py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cài Đặt Hệ Thống</h1>
        <p className="text-muted-foreground mt-2">
          Quản lý các cấu hình chung của hệ thống bán hàng
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cấu hình thanh toán VietQR</CardTitle>
          <CardDescription>
            Thông tin tài khoản ngân hàng để tạo mã QR cho khách hàng thanh toán chuyển khoản
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankId">Mã ngân hàng (Bin / Tên viết tắt)</Label>
              <Input 
                id="bankId" 
                placeholder="VD: MB, VCB, 970422..." 
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Ví dụ: MB, VCB, TCB, ACB...</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accountNo">Số tài khoản</Label>
              <Input 
                id="accountNo" 
                placeholder="VD: 0123456789" 
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
              />
            </div>
          </div>

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

          <div className="pt-4 flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={mutation.isPending}
            >
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Lưu Cấu Hình
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
