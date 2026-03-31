'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store'
import { userApi, billingApi, modelApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Key, 
  CreditCard, 
  Activity, 
  Zap,
  Plus,
  Trash2,
  Copy,
  Check
} from 'lucide-react'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  permissions: string[]
  lastUsedAt: string
  createdAt: string
}

interface UsageStat {
  modelId: string
  requests: number
  inputTokens: number
  outputTokens: number
  cost: number
}

export default function DashboardPage() {
  const { user, logout } = useAuthStore()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [balance, setBalance] = useState(0)
  const [usage, setUsage] = useState<UsageStat[]>([])
  const [models, setModels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newKeyName, setNewKeyName] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [keysRes, balanceRes, usageRes, modelsRes] = await Promise.all([
        userApi.getApiKeys(),
        billingApi.getBalance(),
        userApi.getUsage(),
        modelApi.getModels(),
      ])
      
      setApiKeys(keysRes.data.data || [])
      setBalance(balanceRes.data.balance || 0)
      setUsage(usageRes.data.data || [])
      setModels(modelsRes.data.data || [])
    } catch (error) {
      toast({
        title: '错误',
        description: '加载数据失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const createApiKey = async () => {
    if (!newKeyName.trim()) return
    try {
      const res = await userApi.createApiKey({ name: newKeyName })
      toast({
        title: '创建成功',
        description: `API Key: ${res.data.key}`,
      })
      setNewKeyName('')
      loadData()
    } catch (error) {
      toast({
        title: '创建失败',
        variant: 'destructive',
      })
    }
  }

  const revokeApiKey = async (id: string) => {
    try {
      await userApi.revokeApiKey(id)
      toast({ title: '已撤销' })
      loadData()
    } catch (error) {
      toast({
        title: '撤销失败',
        variant: 'destructive',
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: '已复制' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">LLM Hub</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <Button variant="outline" onClick={logout}>退出</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">账户余额</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Keys</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{apiKeys.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本月消耗</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(usage.reduce((sum, u) => sum + u.cost, 0))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="apikeys" className="space-y-4">
          <TabsList>
            <TabsTrigger value="apikeys">API Keys</TabsTrigger>
            <TabsTrigger value="usage">使用统计</TabsTrigger>
            <TabsTrigger value="pricing">模型定价</TabsTrigger>
          </TabsList>

          <TabsContent value="apikeys" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>创建 API Key</CardTitle>
                <CardDescription>创建新的 API Key 用于调用接口</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <input
                  type="text"
                  placeholder="API Key 名称"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <Button onClick={createApiKey}>
                  <Plus className="h-4 w-4 mr-2" />
                  创建
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>我的 API Keys</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{key.name}</div>
                        <div className="text-sm text-gray-500">
                          {key.keyPrefix}... • 创建于 {formatDate(key.createdAt)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeApiKey(key.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  {apiKeys.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      暂无 API Keys
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage">
            <Card>
              <CardHeader>
                <CardTitle>使用统计 (最近30天)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usage.map((stat) => (
                    <div
                      key={stat.modelId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{stat.modelId}</div>
                        <div className="text-sm text-gray-500">
                          {formatNumber(stat.inputTokens + stat.outputTokens)} tokens
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{stat.requests} 次请求</div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(stat.cost)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {usage.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      暂无使用记录
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle>模型定价</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {models.map((model) => (
                    <div
                      key={model.id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="font-medium">{model.id}</div>
                      <div className="text-sm text-gray-500 mb-2">
                        {model.owned_by}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>输入:</span>
                          <span>¥{model.pricing?.input}/1K tokens</span>
                        </div>
                        <div className="flex justify-between">
                          <span>输出:</span>
                          <span>¥{model.pricing?.output}/1K tokens</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
