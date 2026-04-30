const app = getApp()
import { getCurrentLocation, formatDistance } from '../../utils/location.js'
import { searchNearby, getActivities } from '../../utils/api.js'
import { sendMessage, initAI, configureAI, getAIConfig, aiService } from '../../utils/openClaw.js'
import { searchHotActivities, searchXiaohongshu, searchDouyin, searchTrendingTopics, formatNumber, formatTimeAgo } from '../../utils/socialSearch.js'

Page({
  data: {
    currentLocation: null,
    messages: [],
    inputText: '',
    isLoading: false,
    quickActions: [
      { id: 'ai_greeting', text: '👋 你好', type: 'chat', message: '你好' },
      { id: 'nearby_subway', text: '🚇 附近地铁站', type: 'nearby', category: 'subway' },
      { id: 'nearby_mall', text: '🛍️ 附近商场', type: 'nearby', category: 'mall' },
      { id: 'nearby_restaurant', text: '🍽️ 附近餐厅', type: 'nearby', category: 'restaurant' },
      { id: 'nearby_park', text: '🌳 附近公园', type: 'nearby', category: 'park' },
      { id: 'nearby_hotel', text: '🏨 附近酒店', type: 'nearby', category: 'hotel' },
      { id: 'social_hot', text: '🔥 小红书/抖音热门', type: 'social', platform: 'all' },
      { id: 'xiaohongshu', text: '📕 小红书推荐', type: 'social', platform: 'xiaohongshu' },
      { id: 'douyin', text: '🎵 抖音热门', type: 'social', platform: 'douyin' },
      { id: 'trending_topics', text: '📊 热门话题', type: 'trending' },
      { id: 'recommend_attractions', text: '🏛️ 推荐景点', type: 'chat', message: '推荐附近的景点' },
      { id: 'recommend_food', text: '🍜 推荐美食', type: 'chat', message: '推荐当地美食' },
      { id: 'plan_route', text: '🗺️ 规划路线', type: 'chat', message: '帮我规划一条旅行路线' },
      { id: 'help', text: '❓ 帮助', type: 'chat', message: '你能做什么' }
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
    aiConfig: null
  },

  onLoad() {
    this.initPage()
  },

  onShow() {
    const config = getAIConfig()
    this.setData({ aiConfig: config })
  },

  async initPage() {
    try {
      const location = await getCurrentLocation()
      this.setData({
        currentLocation: location
      })
      initAI(location)
    } catch (error) {
      console.error('获取位置失败:', error)
    }
    
    this.addWelcomeMessage()
  },

  addWelcomeMessage() {
    const config = getAIConfig()
    let modeInfo = ''
    
    if (config.mode === 'api') {
      modeInfo = `当前模式：真实 API (${config.provider})\n\n`
    } else {
      modeInfo = '当前模式：模拟智能对话\n\n'
    }
    
    const welcomeMessage = {
      id: Date.now(),
      type: 'ai',
      content: '你好！我是你的AI旅行助手 🤖',
      subContent: modeInfo + 
        '我可以帮你：\n' +
        '• 💬 智能对话，解答旅行问题\n' +
        '• 📍 查找附近的设施（地铁站、商场等）\n' +
        '• 📕 搜索小红书/抖音热门活动\n' +
        '• 🗺️ 推荐景点和美食\n' +
        '• ❓ 发送 "帮助" 查看所有功能\n\n' +
        '点击下方快捷选项或输入你的需求开始吧！',
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
    
    this.processMessage(inputText.trim())
  },

  onQuickActionTap(e) {
    const { action } = e.currentTarget.dataset
    if (!action) return
    
    let userMessageContent = action.text
    
    if (action.type === 'chat' && action.message) {
      userMessageContent = action.message
    }
    
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
    } else if (action.type === 'social') {
      this.handleSocialSearch(action.platform)
    } else if (action.type === 'trending') {
      this.handleTrendingTopics()
    } else if (action.type === 'chat') {
      this.processMessage(action.message || action.text)
    }
  },

  async processMessage(message) {
    try {
      const response = await sendMessage(message, {
        location: this.data.currentLocation
      })
      
      this.addAIResponse(response)
      
    } catch (error) {
      console.error('消息处理失败:', error)
      this.addAIResponse({
        content: '抱歉，处理失败了 😔',
        subContent: error.message || '请稍后再试，或者试试其他问题。'
      })
    }
    
    this.setData({ isLoading: false })
    this.scrollToBottom()
  },

  async handleNearbySearch(category) {
    const { currentLocation, categoryLabels } = this.data
    
    if (!currentLocation) {
      this.addAIResponse({
        content: '无法获取您的位置信息 📍',
        subContent: '请授权定位权限后再试，或者手动告诉我你的位置。'
      })
      this.setData({ isLoading: false })
      return
    }
    
    try {
      const pois = await searchNearby(currentLocation, category, 1000)
      
      if (!pois || pois.length === 0) {
        this.addAIResponse({
          content: `附近暂时找不到${categoryLabels[category]}`,
          subContent: '可能是搜索范围太小，或者该区域这类设施较少。'
        })
      } else {
        const poisWithDistance = pois.map(poi => ({
          ...poi,
          distanceText: poi.distance ? formatDistance(poi.distance) : null
        }))
        
        const categoryName = categoryLabels[category] || category
        
        this.addAIResponse({
          content: `📍 为你找到附近的${categoryName}（${poisWithDistance.length}个）：`,
          pois: poisWithDistance,
          category: category
        })
      }
      
    } catch (error) {
      console.error('搜索附近失败:', error)
      this.addAIResponse({
        content: '搜索失败了 😔',
        subContent: error.message || '请稍后再试。'
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
      
      if (platform === 'all') {
        results = await searchHotActivities(currentLocation, [], { 
          platforms: ['xiaohongshu', 'douyin'], 
          limit: 6 
        })
        
        const activitiesWithFormatted = results.activities.map(act => ({
          ...act,
          likesFormatted: formatNumber(act.likes),
          commentsFormatted: formatNumber(act.comments),
          publishTimeFormatted: formatTimeAgo(act.publishTime)
        }))
        
        this.addAIResponse({
          type: 'social',
          content: `🔥 ${platformNames[platform]}热门推荐（${activitiesWithFormatted.length}条）：`,
          subContent: '点击查看详情，这些都是当前最火的打卡地点！',
          socialActivities: activitiesWithFormatted,
          platform: 'all'
        })
      } else if (platform === 'xiaohongshu') {
        results = await searchXiaohongshu(currentLocation, [], 6)
        
        const postsWithFormatted = results.posts.map(post => ({
          ...post,
          likesFormatted: formatNumber(post.likes),
          commentsFormatted: formatNumber(post.comments),
          collectsFormatted: formatNumber(post.collects),
          publishTimeFormatted: formatTimeAgo(post.publishTime)
        }))
        
        this.addAIResponse({
          type: 'xiaohongshu',
          content: `📕 小红书热门推荐（${postsWithFormatted.length}条）：`,
          subContent: '这些都是小红书上最热门的打卡地点和美食推荐！',
          xiaohongshuPosts: postsWithFormatted
        })
      } else if (platform === 'douyin') {
        results = await searchDouyin(currentLocation, [], 6)
        
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
          content: `🎵 抖音热门推荐（${videosWithFormatted.length}条）：`,
          subContent: '这些都是抖音上最火的打卡地点和活动！',
          douyinVideos: videosWithFormatted
        })
      }
      
    } catch (error) {
      console.error('社交搜索失败:', error)
      this.addAIResponse({
        content: '搜索热门内容失败了 😔',
        subContent: error.message || '请稍后再试。'
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
        content: `� ${result.location} 热门话题榜单：`,
        subContent: '点击话题可以搜索相关内容！',
        trendingTopics: topicsWithHeat
      })
      
    } catch (error) {
      console.error('获取热门话题失败:', error)
      this.addAIResponse({
        content: '获取热门话题失败了 😔',
        subContent: error.message || '请稍后再试。'
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
      responseType: response.intent || response.type,
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
    } else if (activity.title) {
      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: `搜索"${activity.title}"`,
        timestamp: new Date().toISOString()
      }
      
      this.setData({
        messages: [...this.data.messages, userMessage],
        isLoading: true
      })
      
      this.scrollToBottom()
      
      this.processMessage(`搜索${activity.title}`)
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
    
    if (recommendation.name) {
      const location = {
        name: recommendation.name,
        latitude: 39.9042 + (Math.random() - 0.5) * 0.1,
        longitude: 116.4074 + (Math.random() - 0.5) * 0.1
      }
      
      wx.navigateTo({
        url: `/pages/map/map?latitude=${location.latitude}&longitude=${location.longitude}&name=${encodeURIComponent(recommendation.name)}`
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
    if (!seconds) return ''
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
