const app = getApp()
import { getCurrentLocation, formatDistance } from '../../utils/location.js'
import { searchNearby, getActivities } from '../../utils/api.js'
import { sendMessage, planRouteWithAI, getTravelSuggestions, initOpenClaw } from '../../utils/openClaw.js'
import { searchHotActivities, searchXiaohongshu, searchDouyin, searchTrendingTopics, getActivityRecommendations, formatNumber, formatTimeAgo } from '../../utils/socialSearch.js'

Page({
  data: {
    currentLocation: null,
    messages: [],
    inputText: '',
    isLoading: false,
    quickActions: [
      { id: 'ai_chat', text: '🤖 智能对话', type: 'ai', action: 'chat' },
      { id: 'nearby_subway', text: '🚇 查找附近地铁站', type: 'nearby', category: 'subway' },
      { id: 'nearby_mall', text: '🛍️ 查找附近商场', type: 'nearby', category: 'mall' },
      { id: 'nearby_restaurant', text: '🍽️ 查找附近餐厅', type: 'nearby', category: 'restaurant' },
      { id: 'nearby_park', text: '🌳 查找附近公园', type: 'nearby', category: 'park' },
      { id: 'nearby_hotel', text: '🏨 查找附近酒店', type: 'nearby', category: 'hotel' },
      { id: 'hot_activities', text: '� 查看近期热门活动', type: 'activities' },
      { id: 'social_hot', text: '🔥 小红书/抖音热门', type: 'social', platform: 'all' },
      { id: 'xiaohongshu', text: '📕 小红书推荐', type: 'social', platform: 'xiaohongshu' },
      { id: 'douyin', text: '� 抖音热门', type: 'social', platform: 'douyin' },
      { id: 'trending_topics', text: '📊 热门话题榜单', type: 'trending' },
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
    showQuickActions: true,
    userPreferences: {
      interests: [],
      budget: 'medium',
      timeAvailable: 120
    }
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
    
    initOpenClaw(app.globalData.apiKey.ai)
    this.addWelcomeMessage()
  },

  addWelcomeMessage() {
    const welcomeMessage = {
      id: Date.now(),
      type: 'ai',
      content: '你好！我是你的AI旅行助手 🤖',
      subContent: '我可以帮你：\n• 🤖 智能对话，解答旅行问题\n• 📍 查找附近的设施（地铁站、商场等）\n• 📕 搜索小红书/抖音热门活动\n• 🗺️ 智能规划最优路线\n• 💡 推荐景点和美食\n\n点击下方快捷选项或输入你的需求开始吧！',
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
    } else if (action.type === 'social') {
      this.handleSocialSearch(action.platform)
    } else if (action.type === 'trending') {
      this.handleTrendingTopics()
    } else if (action.type === 'ai') {
      this.handleAIChat(action.action)
    }
  },

  async processUserMessage(message) {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('小红书') || lowerMessage.includes('抖音') || lowerMessage.includes('热门') || lowerMessage.includes('推荐')) {
      if (lowerMessage.includes('小红书')) {
        await this.handleSocialSearch('xiaohongshu')
      } else if (lowerMessage.includes('抖音')) {
        await this.handleSocialSearch('douyin')
      } else {
        await this.handleSocialSearch('all')
      }
      return
    }
    
    if (lowerMessage.includes('话题') || lowerMessage.includes('榜单') || lowerMessage.includes('热搜')) {
      await this.handleTrendingTopics()
      return
    }
    
    if (lowerMessage.includes('路线') || lowerMessage.includes('规划') || lowerMessage.includes('行程')) {
      await this.handleRouteRecommend()
      return
    }
    
    if (lowerMessage.includes('地铁') || lowerMessage.includes('地铁站')) {
      await this.handleNearbySearch('subway')
      return
    }
    if (lowerMessage.includes('商场') || lowerMessage.includes('购物')) {
      await this.handleNearbySearch('mall')
      return
    }
    if (lowerMessage.includes('餐厅') || lowerMessage.includes('吃饭')) {
      await this.handleNearbySearch('restaurant')
      return
    }
    if (lowerMessage.includes('公园')) {
      await this.handleNearbySearch('park')
      return
    }
    if (lowerMessage.includes('酒店') || lowerMessage.includes('住宿')) {
      await this.handleNearbySearch('hotel')
      return
    }
    if (lowerMessage.includes('活动') || lowerMessage.includes('展览')) {
      await this.handleActivitiesSearch()
      return
    }
    
    await this.handleAIChatWithMessage(message)
  },

  async handleAIChat(action) {
    try {
      const response = await sendMessage('你好，请介绍一下你能帮我做什么', {
        location: this.data.currentLocation
      })
      
      this.addAIResponse({
        type: 'ai_chat',
        content: response.content,
        subContent: response.subContent,
        suggestions: response.suggestions
      })
      
    } catch (error) {
      console.error('AI 对话失败:', error)
      this.addAIResponse({
        content: '抱歉，AI 服务暂时不可用。',
        subContent: '您可以尝试使用快捷选项或稍后再试。'
      })
    }
    
    this.setData({ isLoading: false })
    this.scrollToBottom()
  },

  async handleAIChatWithMessage(message) {
    try {
      const response = await sendMessage(message, {
        location: this.data.currentLocation,
        preferences: this.data.userPreferences
      })
      
      this.addAIResponse({
        type: response.type || 'ai_chat',
        content: response.content,
        subContent: response.subContent,
        attractions: response.attractions,
        restaurants: response.restaurants,
        weather: response.weather,
        suggestions: response.suggestions
      })
      
    } catch (error) {
      console.error('AI 对话失败:', error)
      this.addAIResponse({
        content: '抱歉，我暂时无法理解您的需求。',
        subContent: '您可以尝试：\n• 查找附近地铁站\n• 搜索小红书热门\n• 规划旅行路线'
      })
    }
    
    this.setData({ isLoading: false })
    this.scrollToBottom()
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

  async handleSocialSearch(platform) {
    const { currentLocation } = this.data
    
    const platformNames = {
      all: '小红书和抖音',
      xiaohongshu: '小红书',
      douyin: '抖音'
    }
    
    try {
      let results
      let content = `为您搜索${platformNames[platform]}的热门内容：`
      
      if (platform === 'all') {
        results = await searchHotActivities(currentLocation, [], { 
          platforms: ['xiaohongshu', 'douyin'], 
          limit: 10 
        })
        
        const activitiesWithFormatted = results.activities.map(act => ({
          ...act,
          likesFormatted: formatNumber(act.likes),
          commentsFormatted: formatNumber(act.comments),
          publishTimeFormatted: formatTimeAgo(act.publishTime)
        }))
        
        this.addAIResponse({
          type: 'social',
          content: content,
          socialActivities: activitiesWithFormatted,
          platform: 'all'
        })
      } else if (platform === 'xiaohongshu') {
        results = await searchXiaohongshu(currentLocation, [], 8)
        
        const postsWithFormatted = results.posts.map(post => ({
          ...post,
          likesFormatted: formatNumber(post.likes),
          commentsFormatted: formatNumber(post.comments),
          collectsFormatted: formatNumber(post.collects),
          publishTimeFormatted: formatTimeAgo(post.publishTime)
        }))
        
        this.addAIResponse({
          type: 'xiaohongshu',
          content: content,
          xiaohongshuPosts: postsWithFormatted
        })
      } else if (platform === 'douyin') {
        results = await searchDouyin(currentLocation, [], 8)
        
        const videosWithFormatted = results.videos.map(video => ({
          ...video,
          likesFormatted: formatNumber(video.likes),
          commentsFormatted: formatNumber(video.comments),
          sharesFormatted: formatNumber(video.shares),
          publishTimeFormatted: formatTimeAgo(video.publishTime),
          durationFormatted: this.formatDuration(video.duration)
        }))
        
        this.addAIResponse({
          type: 'douyin',
          content: content,
          douyinVideos: videosWithFormatted
        })
      }
      
    } catch (error) {
      console.error('社交搜索失败:', error)
      this.addAIResponse({
        content: '搜索热门内容失败，请稍后再试',
        subContent: error.message || '未知错误'
      })
    }
    
    this.setData({ isLoading: false })
    this.scrollToBottom()
  },

  async handleTrendingTopics() {
    const { currentLocation } = this.data
    
    try {
      const result = await searchTrendingTopics(currentLocation, 'all')
      
      const topicsWithHeat = result.topics.map(topic => ({
        ...topic,
        heatFormatted: formatNumber(topic.heat),
        trendIcon: topic.trend === 'up' ? '↑' : topic.trend === 'down' ? '↓' : '—',
        trendColor: topic.trend === 'up' ? '#e74c3c' : topic.trend === 'down' ? '#27ae60' : '#95a5a6'
      }))
      
      this.addAIResponse({
        type: 'trending',
        content: `🔥 ${result.location} 热门话题榜单`,
        trendingTopics: topicsWithHeat
      })
      
    } catch (error) {
      console.error('获取热门话题失败:', error)
      this.addAIResponse({
        content: '获取热门话题失败，请稍后再试'
      })
    }
    
    this.setData({ isLoading: false })
    this.scrollToBottom()
  },

  async handleRouteRecommend() {
    const { currentLocation, userPreferences } = this.data
    
    try {
      const suggestions = await getTravelSuggestions(
        currentLocation, 
        userPreferences.interests
      )
      
      const recommendations = await getActivityRecommendations(
        currentLocation,
        userPreferences
      )
      
      this.addAIResponse({
        type: 'route_recommend',
        content: '为您推荐周边热门景点和活动：',
        travelSuggestions: suggestions.categories,
        activityRecommendations: recommendations.recommendations
      })
      
    } catch (error) {
      console.error('路线推荐失败:', error)
      this.addAIResponse({
        type: 'route_recommend',
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
    }
    
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
      responseType: response.type,
      socialActivities: response.socialActivities,
      xiaohongshuPosts: response.xiaohongshuPosts,
      douyinVideos: response.douyinVideos,
      trendingTopics: response.trendingTopics,
      travelSuggestions: response.travelSuggestions,
      activityRecommendations: response.activityRecommendations,
      suggestions: response.suggestions,
      attractions: response.attractions,
      restaurants: response.restaurants,
      weather: response.weather,
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

  onSocialActivityTap(e) {
    const { activity } = e.currentTarget.dataset
    if (!activity) return
    
    if (activity.location && activity.location.latitude) {
      wx.navigateTo({
        url: `/pages/map/map?latitude=${activity.location.latitude}&longitude=${activity.location.longitude}&name=${encodeURIComponent(activity.title)}&address=${encodeURIComponent(activity.location.address || '')}`
      })
    }
  },

  onTopicTap(e) {
    const { topic } = e.currentTarget.dataset
    if (!topic) return
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: `搜索"${topic.title}"相关内容`,
      timestamp: new Date().toISOString()
    }
    
    this.setData({
      messages: [...this.data.messages, userMessage],
      isLoading: true
    })
    
    this.scrollToBottom()
    
    this.handleSocialSearch('all')
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

  onRecommendationTap(e) {
    const { recommendation } = e.currentTarget.dataset
    if (!recommendation) return
    
    if (recommendation.type === 'attraction' || recommendation.type === 'food') {
      const location = {
        name: recommendation.title,
        latitude: 39.9042 + (Math.random() - 0.5) * 0.1,
        longitude: 116.4074 + (Math.random() - 0.5) * 0.1
      }
      
      wx.navigateTo({
        url: `/pages/map/map?latitude=${location.latitude}&longitude=${location.longitude}&name=${encodeURIComponent(recommendation.title)}`
      })
    }
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
  },

  formatDuration(seconds) {
    if (seconds < 60) {
      return `${seconds}秒`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (remainingSeconds === 0) {
      return `${minutes}分`
    }
    return `${minutes}分${remainingSeconds}秒`
  }
})
