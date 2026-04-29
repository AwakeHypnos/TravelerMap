const app = getApp()
import { getCurrentLocation, formatDistance } from '../../utils/location.js'
import { searchNearby, getActivities } from '../../utils/api.js'

Page({
  data: {
    currentLocation: null,
    messages: [],
    inputText: '',
    isLoading: false,
    quickActions: [
      { id: 'nearby_subway', text: '🚇 查找附近地铁站', type: 'nearby', category: 'subway' },
      { id: 'nearby_mall', text: '🛍️ 查找附近商场', type: 'nearby', category: 'mall' },
      { id: 'nearby_restaurant', text: '🍽️ 查找附近餐厅', type: 'nearby', category: 'restaurant' },
      { id: 'nearby_park', text: '🌳 查找附近公园', type: 'nearby', category: 'park' },
      { id: 'nearby_hotel', text: '🏨 查找附近酒店', type: 'nearby', category: 'hotel' },
      { id: 'nearby_convenience', text: '🏪 查找附近便利店', type: 'nearby', category: 'convenience' },
      { id: 'hot_activities', text: '🎉 查看近期热门活动', type: 'activities' },
      { id: 'recommend_route', text: '🗺️ 推荐周边景点路线', type: 'recommend' }
    ],
    categoryLabels: {
      subway: '地铁站',
      mall: '商场',
      restaurant: '餐厅',
      park: '公园',
      hotel: '酒店',
      convenience: '便利店'
    },
    showQuickActions: true
  },

  onLoad() {
    this.initPage()
  },

  async initPage() {
    try {
      const location = await getCurrentLocation()
      this.setData({
        currentLocation: location
      })
    } catch (error) {
      console.error('获取位置失败:', error)
    }
    
    this.addWelcomeMessage()
  },

  addWelcomeMessage() {
    const welcomeMessage = {
      id: Date.now(),
      type: 'ai',
      content: '你好！我是你的AI旅行助手 🤖',
      subContent: '我可以帮你：\n• 查找附近的建筑设施（地铁站、商场、餐厅等）\n• 搜索当地热门活动和展览\n• 推荐周边景点路线\n\n点击下方快捷选项或输入你的需求开始吧！',
      timestamp: new Date().toISOString()
    }
    
    this.setData({
      messages: [welcomeMessage]
    })
  },

  onInputChange(e) {
    this.setData({
      inputText: e.detail.value
    })
  },

  onSendMessage() {
    const { inputText, isLoading } = this.data
    
    if (!inputText.trim() || isLoading) {
      return
    }
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString()
    }
    
    this.setData({
      messages: [...this.data.messages, userMessage],
      inputText: '',
      isLoading: true,
      showQuickActions: false
    })
    
    this.scrollToBottom()
    
    this.processUserMessage(inputText.trim())
  },

  onQuickActionTap(e) {
    const { action } = e.currentTarget.dataset
    if (!action) return
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: action.text,
      timestamp: new Date().toISOString()
    }
    
    this.setData({
      messages: [...this.data.messages, userMessage],
      isLoading: true,
      showQuickActions: false
    })
    
    this.scrollToBottom()
    
    if (action.type === 'nearby') {
      this.handleNearbySearch(action.category)
    } else if (action.type === 'activities') {
      this.handleActivitiesSearch()
    } else if (action.type === 'recommend') {
      this.handleRouteRecommend()
    }
  },

  async processUserMessage(message) {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('地铁') || lowerMessage.includes('地铁站') || lowerMessage.includes('subway')) {
      await this.handleNearbySearch('subway')
    } else if (lowerMessage.includes('商场') || lowerMessage.includes('购物') || lowerMessage.includes('mall')) {
      await this.handleNearbySearch('mall')
    } else if (lowerMessage.includes('餐厅') || lowerMessage.includes('吃饭') || lowerMessage.includes('restaurant')) {
      await this.handleNearbySearch('restaurant')
    } else if (lowerMessage.includes('公园') || lowerMessage.includes('park')) {
      await this.handleNearbySearch('park')
    } else if (lowerMessage.includes('酒店') || lowerMessage.includes('住宿') || lowerMessage.includes('hotel')) {
      await this.handleNearbySearch('hotel')
    } else if (lowerMessage.includes('便利店') || lowerMessage.includes('convenience')) {
      await this.handleNearbySearch('convenience')
    } else if (lowerMessage.includes('活动') || lowerMessage.includes('展览') || lowerMessage.includes('热门')) {
      await this.handleActivitiesSearch()
    } else if (lowerMessage.includes('路线') || lowerMessage.includes('景点') || lowerMessage.includes('推荐')) {
      await this.handleRouteRecommend()
    } else {
      this.addAIResponse({
        content: '抱歉，我暂时无法理解您的需求。',
        subContent: '您可以尝试：\n• 查找附近地铁站\n• 查找附近商场\n• 查看近期热门活动\n• 推荐周边景点路线'
      })
    }
  },

  async handleNearbySearch(category) {
    const { currentLocation, categoryLabels } = this.data
    
    if (!currentLocation) {
      this.addAIResponse({
        content: '无法获取您的位置信息',
        subContent: '请授权定位权限后再试'
      })
      this.setData({ isLoading: false })
      return
    }
    
    try {
      const pois = await searchNearby(currentLocation, category, 1000)
      
      const poisWithDistance = pois.map(poi => ({
        ...poi,
        distanceText: poi.distance ? formatDistance(poi.distance) : null
      }))
      
      const categoryName = categoryLabels[category] || category
      
      this.addAIResponse({
        content: `为您找到附近的${categoryName}：`,
        pois: poisWithDistance,
        category: category
      })
      
    } catch (error) {
      console.error('搜索附近失败:', error)
      this.addAIResponse({
        content: '搜索失败，请稍后再试',
        subContent: error.message || '未知错误'
      })
    }
    
    this.setData({ isLoading: false })
    this.scrollToBottom()
  },

  async handleActivitiesSearch() {
    const { currentLocation } = this.data
    
    try {
      const result = await getActivities(currentLocation, [], 1, 10)
      
      this.addAIResponse({
        content: '以下是近期的热门活动：',
        activities: result.list
      })
      
    } catch (error) {
      console.error('获取活动失败:', error)
      this.addAIResponse({
        content: '获取活动信息失败，请稍后再试'
      })
    }
    
    this.setData({ isLoading: false })
    this.scrollToBottom()
  },

  async handleRouteRecommend() {
    const { currentLocation } = this.data
    
    this.addAIResponse({
      content: '为您推荐周边热门景点路线：',
      routes: [
        {
          name: '经典一日游',
          description: '包含3个主要景点，适合一日游览',
          locations: [
            { name: '故宫博物院', distance: '2.5公里' },
            { name: '景山公园', distance: '步行10分钟' },
            { name: '北海公园', distance: '步行15分钟' }
          ],
          totalTime: '约4-5小时',
          totalDistance: '约5公里'
        },
        {
          name: '文艺探索路线',
          description: '博物馆和艺术画廊的深度体验',
          locations: [
            { name: '国家博物馆', distance: '3公里' },
            { name: '798艺术区', distance: '10公里' },
            { name: '红砖美术馆', distance: '5公里' }
          ],
          totalTime: '约一天',
          totalDistance: '约18公里'
        },
        {
          name: '自然风光路线',
          description: '享受城市中的自然景观',
          locations: [
            { name: '奥林匹克公园', distance: '8公里' },
            { name: '朝阳公园', distance: '5公里' },
            { name: '玉渊潭公园', distance: '3公里' }
          ],
          totalTime: '约3-4小时',
          totalDistance: '约16公里'
        }
      ]
    })
    
    this.setData({ isLoading: false })
    this.scrollToBottom()
  },

  addAIResponse(response) {
    const aiMessage = {
      id: Date.now(),
      type: 'ai',
      content: response.content,
      subContent: response.subContent,
      pois: response.pois,
      activities: response.activities,
      routes: response.routes,
      category: response.category,
      timestamp: new Date().toISOString()
    }
    
    this.setData({
      messages: [...this.data.messages, aiMessage]
    })
  },

  onPOITap(e) {
    const { poi } = e.currentTarget.dataset
    if (!poi) return
    
    wx.navigateTo({
      url: `/pages/map/map?latitude=${poi.latitude}&longitude=${poi.longitude}&name=${encodeURIComponent(poi.name)}&address=${encodeURIComponent(poi.address || '')}`
    })
  },

  onActivityTap(e) {
    const { activity } = e.currentTarget.dataset
    if (!activity) return
    
    wx.navigateTo({
      url: `/pages/activities/activities?id=${activity.id}`
    })
  },

  onRouteTap(e) {
    const { route, index } = e.currentTarget.dataset
    if (!route) return
    
    const selectedLocations = route.locations.map((loc, i) => ({
      id: Date.now() + i,
      name: loc.name,
      latitude: 39.9042 + (i * 0.01),
      longitude: 116.4074 + (i * 0.01),
      selected: true,
      estimatedTime: 60
    }))
    
    try {
      wx.setStorageSync('selectedLocations', selectedLocations)
    } catch (error) {
      console.error('保存地点失败:', error)
    }
    
    wx.navigateTo({
      url: '/pages/route/route'
    })
  },

  scrollToBottom() {
    setTimeout(() => {
      wx.pageScrollTo({
        scrollTop: 999999,
        duration: 300
      })
    }, 100)
  },

  onShowQuickActions() {
    this.setData({
      showQuickActions: true
    })
  }
})
